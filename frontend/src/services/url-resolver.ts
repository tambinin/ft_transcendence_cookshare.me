/**
 * ═══════════════════════════════════════════════════════════════════════════
 * url-resolver.ts — Dynamic Base URL Resolver (Single Source of Truth)
 *
 * HOW IT WORKS:
 * 1. At app startup, resolveBaseUrls() is called ONCE from main.tsx.
 * 2. If VITE_API_URL / VITE_WS_URL are set (by Makefile → Docker env) they
 *    are used directly — this is the primary mechanism.
 * 3. If no env vars → use window.location.origin as a smart fallback:
 *    the browser already reached this page, so API routes on the same
 *    origin (behind Nginx) will work too.
 * 4. The resolved URLs are cached in module-level variables and exposed
 *    via getApiBaseUrl() / getWsUrl() / getWsPath(). Every HTTP client
 *    and Socket.IO connection reads from here — no hardcoded URLs exist
 *    anywhere else in the codebase.
 *
 * MODE SWITCHING:
 *   `make dev`  → VITE_API_URL=https://<local-ip>/api/v1
 *                  VITE_WS_URL=https://<local-ip>
 *   `make prod` → VITE_API_URL=https://cookshare.me/api/v1
 *                  VITE_WS_URL=https://cookshare.me
 *   No config   → uses window.location.origin (works everywhere)
 *
 * FLOW DIAGRAM:
 *   VITE_API_URL set?
 *        │
 *   ┌────┴─yes──┐
 *   │  use it   │  (set by `make dev` or `make prod`)
 *   └───────────┘
 *   ┌────┴─no───┐
 *   │  use      │  window.location.origin + /api/v1
 *   │  (auto)   │  WS = same origin, path = /ws/socket.io/
 *   └───────────┘
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Module State ───
let apiBaseUrl = '';
let wsUrl = '';
let wsPath = '/ws/socket.io/';
let resolved = false;
let resolvePromise: Promise<void> | null = null;

// ─── Public Getters ───

/** Returns the resolved API base URL (e.g. "https://cookshare.me/api/v1") */
export function getApiBaseUrl(): string {
	return apiBaseUrl;
}

/** Returns the resolved WebSocket URL (e.g. "https://cookshare.me") */
export function getWsUrl(): string {
	return wsUrl;
}

/** Returns the resolved WebSocket path (e.g. "/ws/socket.io/") */
export function getWsPath(): string {
	return wsPath;
}

/** Returns true once resolution is complete */
export function isResolved(): boolean {
	return resolved;
}

/**
 * Wait for URL resolution to complete. Safe to call multiple times —
 * returns the same promise. If already resolved, resolves immediately.
 */
export function waitForResolution(): Promise<void> {
	if (resolved) return Promise.resolve();
	if (resolvePromise) return resolvePromise;
	return resolveBaseUrls();
}

// ─── Core Resolver ───

/**
 * Resolve base URLs. Called ONCE at app startup from main.tsx.
 *
 * Priority:
 *   1. VITE_API_URL / VITE_WS_URL env vars (set by Makefile)
 *   2. window.location.origin (auto-detect: works on any domain/IP)
 */
export function resolveBaseUrls(): Promise<void> {
	if (resolved) return Promise.resolve();
	if (resolvePromise) return resolvePromise;

	resolvePromise = (async () => {
		const envApiUrl = import.meta.env.VITE_API_URL;
		const envWsUrl = import.meta.env.VITE_WS_URL;

		if (envApiUrl) {
			// ── Env vars provided (set by `make dev` or `make prod`) ──
			apiBaseUrl = envApiUrl;
			wsUrl = envWsUrl || envApiUrl.replace(/\/api\/v1$/, '');
			wsPath = '/ws/socket.io/';
			resolved = true;

			return;
		}

		// ── No env vars → auto-detect from current page URL ──
		// The browser already loaded this page through Nginx, so we know
		// the same origin works for /api/* and /ws/* routes.
		const origin = window.location.origin;
		apiBaseUrl = `${origin}/api/v1`;
		wsUrl = origin;
		wsPath = '/ws/socket.io/';
		resolved = true;

	})();

	return resolvePromise;
}
