import jwt from 'jsonwebtoken';
import { validateEnv } from '@transcendence/common';
import type { AuthenticatedSocket } from './ws.types';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:auth');
const env = validateEnv();

/** Interval (ms) between mid-session token expiry checks */
const TOKEN_CHECK_INTERVAL_MS = 60_000;

interface JwtPayload {
	id: string;
	exp?: number;
	iat?: number;
}

/**
 * Socket.IO middleware: validates JWT before allowing the connection.
 * Attaches `userId` and `lastTokenCheck` to the socket.
 */
export function authMiddleware(
	socket: AuthenticatedSocket,
	next: (err?: Error) => void
): void {
	const token = socket.handshake.auth.token as string | undefined;

	if (!token) {
		logger.warn({ socketId: socket.id }, 'WS auth: token missing');
		return next(new Error('Authentication error: Token missing'));
	}

	try {
		const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

		if (!decoded.id) {
			return next(new Error('Authentication error: Invalid token payload'));
		}

		socket.userId = decoded.id;
		socket.lastTokenCheck = Date.now();
		socket.isAlive = true;

		logger.info(
			{ userId: decoded.id, socketId: socket.id },
			'WS auth: handshake success'
		);
		next();
	} catch (err) {
		const message = err instanceof jwt.TokenExpiredError
			? 'Authentication error: Token expired'
			: 'Authentication error: Invalid token';
		logger.warn({ socketId: socket.id, error: (err as Error).message }, message);
		return next(new Error(message));
	}
}

/**
 * Re-verify the JWT token that was used at handshake.
 * Called periodically to detect token expiry mid-session.
 *
 * @returns `true` if the token is still valid, `false` otherwise
 */
export function checkTokenExpiry(socket: AuthenticatedSocket): boolean {
	const now = Date.now();

	if (now - socket.lastTokenCheck < TOKEN_CHECK_INTERVAL_MS) {
		return true;
	}

	const token = socket.handshake.auth.token as string | undefined;
	if (!token) return false;

	try {
		jwt.verify(token, env.JWT_SECRET);
		socket.lastTokenCheck = now;
		return true;
	} catch {
		return false;
	}
}
