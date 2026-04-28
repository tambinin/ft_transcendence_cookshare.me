import { redis } from '@transcendence/common';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:redis');

/** Max messages to buffer per user while offline */
const MAX_BUFFERED_MESSAGES = 100;

/** TTL for the buffer (1 hour) — avoids unbounded growth for users who never come back */
const BUFFER_TTL_SECONDS = 3600;

/** Redis key prefix for per-user message buffers */
const BUFFER_KEY_PREFIX = 'ws:missed:';

// ─── Types ───

export interface BufferedMessage {
	event: string;
	data: unknown;
	bufferedAt: string;
}

// ─── Events worth buffering (not everything — typing events are ephemeral) ───
const BUFFERABLE_EVENTS = new Set([
	'notification',
	'new_message',
	'friend_request',
	'friend_request_accepted',
	'friend_request_rejected',
	'new_follower',
	'shopping_list_update',
	'meal_plan_update',
	'feed_update',
	'new_comment',
	'comment_updated',
	'comment_deleted',
	'recipe_rating_update',
]);

/**
 * Check if an event should be buffered for offline users.
 * Ephemeral events (typing, status) are NOT buffered.
 */
export function isBufferableEvent(event: string): boolean {
	return BUFFERABLE_EVENTS.has(event);
}

/**
 * Store a message in the user's missed-message buffer.
 * Called when emitToUser is attempted but the user has no active sockets.
 */
export async function bufferMessage(userId: string, event: string, data: unknown): Promise<void> {
	if (!isBufferableEvent(event)) return;

	const key = `${BUFFER_KEY_PREFIX}${userId}`;
	const message: BufferedMessage = {
		event,
		data,
		bufferedAt: new Date().toISOString(),
	};

	try {
		await redis.rpush(key, JSON.stringify(message));

		await redis.ltrim(key, -MAX_BUFFERED_MESSAGES, -1);

		await redis.expire(key, BUFFER_TTL_SECONDS);
	} catch (err) {
		logger.error({ err, userId, event }, 'Failed to buffer message in Redis');
	}
}

/**
 * Retrieve and clear all buffered messages for a user.
 * Called when a user reconnects.
 *
 * Uses MULTI/EXEC for atomicity: read + delete in one round-trip.
 */
export async function drainBufferedMessages(userId: string): Promise<BufferedMessage[]> {
	const key = `${BUFFER_KEY_PREFIX}${userId}`;

	try {
		const pipeline = redis.multi();
		pipeline.lrange(key, 0, -1);
		pipeline.del(key);
		const results = await pipeline.exec();

		if (!results || !results[0] || results[0][0]) {
			return [];
		}

		const rawMessages = results[0][1] as string[];
		if (!rawMessages || rawMessages.length === 0) return [];

		const messages: BufferedMessage[] = [];
		for (const raw of rawMessages) {
			try {
				messages.push(JSON.parse(raw) as BufferedMessage);
			} catch {
			}
		}

		if (messages.length > 0) {
			logger.info({ userId, count: messages.length }, 'Drained buffered messages');
		}

		return messages;
	} catch (err) {
		logger.error({ err, userId }, 'Failed to drain buffered messages from Redis');
		return [];
	}
}
