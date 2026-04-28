import type { AuthenticatedSocket } from './ws.types';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:ratelimit');

const MAX_MESSAGES_PER_WINDOW = 30;

const WINDOW_MS = 10_000;

const MAX_VIOLATIONS = 3;

interface RateLimitState {
	count: number;
	windowStart: number;
	violations: number;
}

const rateLimitMap = new Map<string, RateLimitState>();

/**
 * Check rate limit for a socket. Returns `true` if the message is allowed.
 * Returns `false` if the message should be rejected.
 */
export function checkRateLimit(socket: AuthenticatedSocket): boolean {
	const socketId = socket.id;
	const now = Date.now();

	let state = rateLimitMap.get(socketId);

	if (!state) {
		state = { count: 0, windowStart: now, violations: 0 };
		rateLimitMap.set(socketId, state);
	}

	if (now - state.windowStart >= WINDOW_MS) {
		state.count = 0;
		state.windowStart = now;
	}

	state.count++;

	if (state.count > MAX_MESSAGES_PER_WINDOW) {
		state.violations++;

		if (state.violations >= MAX_VIOLATIONS) {
			logger.warn(
				{ userId: socket.userId, socketId, violations: state.violations },
				'Rate limit: too many violations — disconnecting'
			);
			socket.emit('error', {
				type: 'ERROR',
				code: 'RATE_LIMIT_EXCEEDED',
				details: 'Too many messages. Connection terminated.',
			});
			socket.disconnect(true);
			cleanupSocket(socketId);
			return false;
		}

		logger.info(
			{ userId: socket.userId, socketId, count: state.count },
			'Rate limit: message rejected'
		);
		socket.emit('error', {
			type: 'ERROR',
			code: 'RATE_LIMIT_EXCEEDED',
			details: `Slow down. Max ${MAX_MESSAGES_PER_WINDOW} messages per ${WINDOW_MS / 1000}s.`,
		});
		return false;
	}

	return true;
}

/**
 * Remove rate limit state for a disconnected socket.
 */
export function cleanupSocket(socketId: string): void {
	rateLimitMap.delete(socketId);
}
