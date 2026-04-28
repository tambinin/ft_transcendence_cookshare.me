/**
 * navigationUtils.ts — Safe navigation helpers
 */

/**
 * Returns true if the browser can go back within the current SPA session.
 * When history index is 0, pressing ← would leave the app entirely.
 */
export function canGoBack(): boolean {
	// React Router stores the index in history.state
	const idx = (window.history.state as { idx?: number } | null)?.idx;
	return typeof idx === 'number' && idx > 0;
}

/**
 * Validates that a redirect URL is internal (same origin, no open redirect).
 * Rejects protocol-relative URLs (//) and external origins.
 */
export function isSafeRedirect(url: string): boolean {
	// Must start with / (internal path) and NOT // (protocol-relative)
	if (!url.startsWith('/') || url.startsWith('//')) return false;

	try {
		const parsed = new URL(url, window.location.origin);
		return parsed.origin === window.location.origin;
	} catch {
		return false;
	}
}

/** Public paths that don't require authentication */
export const PUBLIC_PATHS = [
	'/',
	'/login',
	'/register',
	'/email-verify',
	'/reset-password',
	'/terms-of-service',
	'/privacy-policy',
] as const;

/** Auth-only public paths: if already logged in, redirect away */
export const AUTH_REDIRECT_PATHS = ['/login', '/register'] as const;

/**
 * Determine the safe "from" location for post-login redirect.
 * Falls back to /home if the "from" value is missing or unsafe.
 */
export function getSafeRedirectFrom(from: unknown): string {
	if (typeof from === 'string' && isSafeRedirect(from)) {
		// Don't redirect back to auth pages
		if (AUTH_REDIRECT_PATHS.some(p => from === p || from.startsWith(p + '/'))) {
			return '/home';
		}
		return from;
	}
	// Handle Location objects from React Router state
	if (from && typeof from === 'object' && 'pathname' in from) {
		const pathname = (from as { pathname: string }).pathname;
		return getSafeRedirectFrom(pathname);
	}
	return '/home';
}
