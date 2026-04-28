import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './ws.types';
import { bufferMessage, isBufferableEvent } from './ws.redis';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:rooms');

/**
 * Maps userId → Set of socketIds.
 * A single user can have multiple tabs/devices connected.
 */
const userSockets = new Map<string, Set<string>>();

// ─── User ↔ Socket Mapping ───

export function addUserSocket(userId: string, socketId: string): boolean {
	let sockets = userSockets.get(userId);
	const isFirstConnection = !sockets;

	if (!sockets) {
		sockets = new Set();
		userSockets.set(userId, sockets);
	}
	sockets.add(socketId);

	return isFirstConnection;
}

export function removeUserSocket(userId: string, socketId: string): boolean {
	const sockets = userSockets.get(userId);
	if (!sockets) return false;

	sockets.delete(socketId);

	if (sockets.size === 0) {
		userSockets.delete(userId);
		return true; // True if this was the last socket *locally*
	}
	return false;
}

/**
 * Checks if the user is online globally across all instances.
 * This looks up the `user_${userId}` room in the Redis adapter.
 */
export async function checkUserOnlineGlobally(io: Server, userId: string): Promise<boolean> {
	try {
		const sockets = await io.in(`user_${userId}`).fetchSockets();
		return sockets.length > 0;
	} catch (error) {
		logger.error({ error, userId }, 'Error checking global user online status');
		// Fallback to local map if adapter fails
		const localSockets = userSockets.get(userId);
		return (localSockets?.size ?? 0) > 0;
	}
}

export function getUserSocketIds(userId: string): string[] {
	const sockets = userSockets.get(userId);
	return sockets ? Array.from(sockets) : [];
}

export function getConnectedUserCount(): number {
	return userSockets.size;
}

export function getTotalSocketCount(): number {
	let count = 0;
	userSockets.forEach(sockets => { count += sockets.size; });
	return count;
}

// ─── Safe Emit Methods ───

/**
 * Emit an event to all sockets of a specific user.
 * If the user has NO active sockets and the event is bufferable,
 * the message is stored in Redis for replay on reconnect.
 */
export async function emitToUser(io: Server, userId: string, event: string, data: unknown): Promise<void> {
	const isOnline = await checkUserOnlineGlobally(io, userId);

	if (!isOnline) {
		if (isBufferableEvent(event)) {
			bufferMessage(userId, event, data).catch((err) => {
				logger.error({ err, userId, event }, 'Failed to buffer message for offline user');
			});
		}
		return;
	}

	// Emit globally using the user room
	io.to(`user_${userId}`).emit(event, data);
}

/**
 * Emit an event to all sockets in a room.
 */
export function emitToRoom(io: Server, room: string, event: string, data: unknown): void {
	io.to(room).emit(event, data);
}

/**
 * Broadcast an event to ALL connected sockets.
 */
export function broadcast(io: Server, event: string, data: unknown): void {
	io.emit(event, data);
}

/**
 * Clean up all resources for a socket (rate limit state already handled separately).
 */
export function cleanupAllForUser(userId: string): void {
	userSockets.delete(userId);
}

/**
 * Get a snapshot of all connected user IDs (for graceful shutdown notifications).
 */
export function getAllConnectedUserIds(): string[] {
	return Array.from(userSockets.keys());
}
