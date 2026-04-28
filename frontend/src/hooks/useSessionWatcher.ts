import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, setAccessToken } from '../services/auth.service';
import { disconnect as wsDisconnect } from '../services/socket.service';
import logger from '../utils/logger';
import { PUBLIC_PATHS } from '../utils/navigation.utils';

const AUTH_CHANNEL = 'cookshare_auth';
const TOKEN_KEY = 'cookshare_token';

interface AuthChannelMessage {
	type: 'LOGOUT';
}

function isPublicPath(pathname: string): boolean {
	return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}

/**
 * useSessionWatcher — Cross-tab logout sync + focus/bfcache session validation.
 *
 * • BroadcastChannel: when any tab logs out it broadcasts `{ type: 'LOGOUT' }`.
 *   All other tabs receive this and redirect to /login immediately.
 *
 * • Window focus: when the user returns to a stale tab we verify
 *   the token still exists in storage. If it's gone (another tab
 *   logged out while this tab was backgrounded), we redirect.
 *
 * • Page show (bfcache): when the browser restores a page from the
 *   back-forward cache (e.g. user presses ← after logout), we check
 *   the token. If the session is dead, we redirect to /login.
 *   This is the critical fix: `navigate('/login', { replace: true })`
 *   only replaces ONE history entry, but bfcache can restore older ones.
 *
 * This hook should be mounted ONCE at the top of the component tree
 * (inside AuthProvider or App).
 */
export function useSessionWatcher() {
	const navigate = useNavigate();
	const channelRef = useRef<BroadcastChannel | null>(null);

	useEffect(() => {
		// ── BroadcastChannel for multi-tab sync ──
		try {
			const channel = new BroadcastChannel(AUTH_CHANNEL);
			channelRef.current = channel;

			channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
				if (event.data?.type === 'LOGOUT') {
					logger.log('[SessionWatcher] Logout received from another tab');
					setAccessToken(null);
					wsDisconnect();
					navigate('/login', { replace: true });
				}
			};
		} catch {
			// BroadcastChannel not supported — fall through to storage listener.
		}

		// ── Storage event fallback (works even without BroadcastChannel) ──
		const onStorage = (e: StorageEvent) => {
			if (e.key === TOKEN_KEY && e.newValue === null) {
				logger.log('[SessionWatcher] Token removed in another tab (storage event)');
				setAccessToken(null);
				wsDisconnect();
				navigate('/login', { replace: true });
			}
		};
		window.addEventListener('storage', onStorage);

		// ── Focus re-validation ──
		const onFocus = () => {
			const token = getAccessToken();
			if (!token && !isPublicPath(window.location.pathname)) {
				logger.log('[SessionWatcher] No token on focus — redirecting to login');
				navigate('/login', { replace: true });
			}
		};
		window.addEventListener('focus', onFocus);

		// ── Bfcache (back-forward cache) detection ──
		// When a user presses ← after logout, the browser may restore the
		// previous protected page from bfcache WITHOUT executing any JS.
		// The `pageshow` event with `persisted === true` fires when this
		// happens. We check if the session is still alive; if not, redirect.
		const onPageShow = (e: PageTransitionEvent) => {
			if (e.persisted) {
				logger.log('[SessionWatcher] Page restored from bfcache');
				const token = getAccessToken();
				if (!token && !isPublicPath(window.location.pathname)) {
					logger.log('[SessionWatcher] No token after bfcache restore — redirecting');
					// Use window.location for bfcache restore — React state may be stale
					window.location.replace('/login');
				}
			}
		};
		window.addEventListener('pageshow', onPageShow);

		// ── Popstate detection (browser back/forward within SPA) ──
		// When the user navigates back/forward via browser buttons,
		// React Router handles it. But we add an extra guard: if the
		// token is gone and we're on a protected route, redirect.
		const onPopState = () => {
			const token = getAccessToken();
			if (!token && !isPublicPath(window.location.pathname)) {
				logger.log('[SessionWatcher] No token on popstate — redirecting to login');
				navigate('/login', { replace: true });
			}
		};
		window.addEventListener('popstate', onPopState);

		return () => {
			channelRef.current?.close();
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('pageshow', onPageShow);
			window.removeEventListener('popstate', onPopState);
		};
	}, [navigate]);

	return channelRef;
}

/**
 * Broadcast a logout event to all other tabs.
 * Call this from your logout function AFTER clearing local tokens.
 */
export function broadcastLogout(): void {
	try {
		const channel = new BroadcastChannel(AUTH_CHANNEL);
		channel.postMessage({ type: 'LOGOUT' } satisfies AuthChannelMessage);
		// Close immediately — this is a fire-and-forget broadcast
		channel.close();
	} catch {
		// BroadcastChannel not supported — storage event will still fire
	}
}
