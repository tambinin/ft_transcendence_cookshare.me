import { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { validateEnv, fetchWithTimeout } from '@transcendence/common';
import type { AuthenticatedSocket } from './ws.types';
import { checkRateLimit, cleanupSocket } from './ws.ratelimit';
import {
	addUserSocket,
	removeUserSocket,
	checkUserOnlineGlobally,
	getUserSocketIds,
} from './ws.rooms';
import { registerPongHandler } from './ws.heartbeat';
import { drainBufferedMessages } from './ws.redis';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:handler');
const env = validateEnv();

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || `http://recipe:${env.RECIPE_SERVICE_PORT}`;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `http://user:${env.USER_SERVICE_PORT}`;

/**
 * Register all event handlers on a newly connected socket.
 */
export async function registerConnectionHandler(
	app: FastifyInstance,
	io: Server,
	socket: AuthenticatedSocket
): Promise<void> {
	const userId = socket.userId;
	const socketId = socket.id;

	socket.join(`user_${userId}`);
	socket.join(`shopping_list_${userId}`);

	const isFirstConnection = addUserSocket(userId, socketId);
	if (isFirstConnection) {
		await updateUserStatus(userId, true, io);
	}

	registerPongHandler(socket);

	socket.emit('connected', {
		type: 'CONNECTED',
		sessionId: socketId,
		userId,
	});

	await replayMissedMessages(socket, userId);

	app.log.info({ userId, socketId }, 'User connected');

	socket.on('typing_start', async (data: { receiverId: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.receiverId) return;
		io.to(`user_${data.receiverId}`).emit('typing_start', { senderId: userId });
	});

	socket.on('typing_stop', async (data: { receiverId: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.receiverId) return;
		io.to(`user_${data.receiverId}`).emit('typing_stop', { senderId: userId });
	});

	socket.on('join_recipe', (data: { recipeId: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.recipeId) return;
		socket.join(`recipe_${data.recipeId}`);
	});

	socket.on('leave_recipe', (data: { recipeId: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.recipeId) return;
		socket.leave(`recipe_${data.recipeId}`);
	});

	socket.on('comment_typing_start', (data: { recipeId: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.recipeId) return;
		socket.to(`recipe_${data.recipeId}`).emit('comment_typing_start', {
			senderId: userId,
			recipeId: data.recipeId,
		});
	});

	socket.on('comment_typing_stop', (data: { recipeId: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.recipeId) return;
		socket.to(`recipe_${data.recipeId}`).emit('comment_typing_stop', {
			senderId: userId,
			recipeId: data.recipeId,
		});
	});

	socket.on('shopping_list:add_item', async (data: { name: string; quantity?: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.name) {
			socket.emit('error', { type: 'ERROR', code: 'INVALID_PAYLOAD', details: 'name is required' });
			return;
		}

		try {
			const response = await fetchWithTimeout(`${RECIPE_SERVICE_URL}/api/v1/internal/shopping-list/items`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-internal-api-key': env.INTERNAL_API_KEY,
				},
				body: JSON.stringify({ userId, ...data }),
			});

			if (response.ok) {
				const result = (await response.json()) as { data: unknown };
				io.to(`shopping_list_${userId}`).emit('shopping_list_update', {
					action: 'ITEM_ADDED',
					item: result.data,
				});
			} else {
				socket.emit('error', { type: 'ERROR', code: 'SHOPPING_LIST_ERROR', details: 'Failed to add item' });
			}
		} catch (err) {
			logger.error({ err, userId }, 'shopping_list:add_item failed');
			socket.emit('error', { type: 'ERROR', code: 'INTERNAL_ERROR', details: 'Internal server error' });
		}
	});

	socket.on('shopping_list:update_item', async (data: { id: string; name?: string; quantity?: string; isChecked?: boolean }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.id) {
			socket.emit('error', { type: 'ERROR', code: 'INVALID_PAYLOAD', details: 'id is required' });
			return;
		}

		try {
			const response = await fetchWithTimeout(`${RECIPE_SERVICE_URL}/api/v1/internal/shopping-list/items/${data.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'x-internal-api-key': env.INTERNAL_API_KEY,
				},
				body: JSON.stringify({ userId, ...data }),
			});

			if (response.ok) {
				const result = (await response.json()) as { data: unknown };
				io.to(`shopping_list_${userId}`).emit('shopping_list_update', {
					action: 'ITEM_UPDATED',
					item: result.data,
				});
			} else {
				socket.emit('error', { type: 'ERROR', code: 'SHOPPING_LIST_ERROR', details: 'Failed to update item' });
			}
		} catch (err) {
			logger.error({ err, userId }, 'shopping_list:update_item failed');
			socket.emit('error', { type: 'ERROR', code: 'INTERNAL_ERROR', details: 'Internal server error' });
		}
	});

	socket.on('shopping_list:delete_item', async (data: { id: string }) => {
		if (!checkRateLimit(socket)) return;
		if (!data?.id) {
			socket.emit('error', { type: 'ERROR', code: 'INVALID_PAYLOAD', details: 'id is required' });
			return;
		}

		try {
			const response = await fetchWithTimeout(`${RECIPE_SERVICE_URL}/api/v1/internal/shopping-list/items/${data.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'x-internal-api-key': env.INTERNAL_API_KEY,
				},
			});

			if (response.ok) {
				io.to(`shopping_list_${userId}`).emit('shopping_list_update', {
					action: 'ITEM_DELETED',
					itemId: data.id,
				});
			} else {
				socket.emit('error', { type: 'ERROR', code: 'SHOPPING_LIST_ERROR', details: 'Failed to delete item' });
			}
		} catch (err) {
			logger.error({ err, userId }, 'shopping_list:delete_item failed');
			socket.emit('error', { type: 'ERROR', code: 'INTERNAL_ERROR', details: 'Internal server error' });
		}
	});

	socket.on('disconnect', async (reason) => {
		app.log.info({ userId, socketId, reason }, 'User disconnected');

		const wasLastSocketLocally = removeUserSocket(userId, socketId);
		cleanupSocket(socketId);

		// If this was the last socket locally, we should check globally before marking offline.
		if (wasLastSocketLocally) {
			// small delay to allow reconnects during quick navigation
			setTimeout(async () => {
				const isGloballyOnline = await checkUserOnlineGlobally(io, userId);
				if (!isGloballyOnline) {
					await updateUserStatus(userId, false, io);
				}
			}, 3000);
		}
	});
}

async function replayMissedMessages(socket: AuthenticatedSocket, userId: string): Promise<void> {
	try {
		const missed = await drainBufferedMessages(userId);
		if (missed.length === 0) return;

		logger.info({ userId, count: missed.length }, 'Replaying missed messages');

		socket.emit('missed_messages', {
			type: 'MISSED_MESSAGES',
			messages: missed,
			count: missed.length,
		});

		for (const msg of missed) {
			socket.emit(msg.event, msg.data);
		}
	} catch (err) {
		logger.error({ err, userId }, 'Failed to replay missed messages');
	}
}

function getReceiverSocketIds(receiverId: string, _io: Server): string[] {
	return getUserSocketIds(receiverId);
}

async function updateUserStatus(userId: string, isOnline: boolean, io: Server): Promise<void> {
	try {
		logger.info({ userId, isOnline }, 'Updating user status via user-service API.');
		const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/${userId}/status`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'x-internal-api-key': env.INTERNAL_API_KEY,
			},
			body: JSON.stringify({ isOnline }),
		});

		if (!response.ok) {
			const text = await response.text();
			logger.error({ userId, status: response.status, body: text }, `Failed to update user status API response`);
		}
	} catch (err) {
		logger.error({ err, userId }, 'Failed to fetch update user status');
	}

	io.emit('user_status_change', { userId, isOnline });
}
