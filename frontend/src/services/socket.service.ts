// ═══════════════════════════════════════════════════════════════════════════
// socket.service.ts — Client Socket.IO singleton (bulletproof edition)
//
// IMPROVEMENTS OVER PREVIOUS VERSION:
//   ✅ Connection status tracking (CONNECTING / OPEN / RECONNECTING / CLOSED)
//   ✅ Application-level heartbeat (ws:ping / ws:pong)
//   ✅ Token refresh before reconnect (prevents stale-token reconnect loops)
//   ✅ Offline message queue (queued while disconnected, flushed on reconnect)
//   ✅ Server shutdown detection (auto-reconnect on server restart)
//   ✅ Token expiry detection (server sends token_expired → auto-refresh)
//   ✅ All persistent listeners survive reconnections
// ═══════════════════════════════════════════════════════════════════════════

import { io, Socket } from 'socket.io-client';
import { getWsUrl, getWsPath } from './url-resolver';
import { getAccessToken } from './auth.service';
import authService from './auth.service';
import logger from '../utils/logger';
import type {
	NewMessageEvent,
	MessagesReadEvent,
	TypingEvent,
} from '../types/chat.type';

// ─── Connection status enum ───
export type WsConnectionStatus = 'CLOSED' | 'CONNECTING' | 'OPEN' | 'RECONNECTING';

// ─── Module state ───
let socket: Socket | null = null;
let currentStatus: WsConnectionStatus = 'CLOSED';

/** Listeners that want to know when the status changes */
type StatusCallback = (status: WsConnectionStatus) => void;
const statusListeners = new Set<StatusCallback>();

/** Offline message queue — messages queued while disconnected */
interface QueuedMessage {
	event: string;
	data: unknown;
}
const offlineQueue: QueuedMessage[] = [];
const MAX_QUEUE_SIZE = 50;

// ─── Persistent listener registry ───
type ListenerEntry = { event: string; callback: (...args: any[]) => void };
const persistentListeners: Set<ListenerEntry> = new Set();

function setStatus(status: WsConnectionStatus) {
	if (currentStatus === status) return;
	currentStatus = status;
	// logger.log(`[Socket.IO] Status: ${status}`);
	statusListeners.forEach(cb => {
		try { cb(status); } catch { /* ignore */ }
	});
}

function attachListener(entry: ListenerEntry) {
	if (socket) {
		socket.off(entry.event, entry.callback);
		socket.on(entry.event, entry.callback);
	}
}

function attachAllListeners() {
	persistentListeners.forEach(attachListener);
}

/** Flush offline queue when reconnected */
function flushOfflineQueue() {
	if (!socket?.connected || offlineQueue.length === 0) return;

	// logger.log(`[Socket.IO] Flushing ${offlineQueue.length} queued message(s)`);
	while (offlineQueue.length > 0) {
		const msg = offlineQueue.shift();
		if (msg) {
			socket.emit(msg.event, msg.data);
		}
	}
}

/**
 * Register a persistent listener that auto-attaches on (re)connect.
 * Returns an unsubscribe function.
 */
function registerListener(event: string, callback: (...args: any[]) => void): () => void {
	const entry: ListenerEntry = { event, callback };
	persistentListeners.add(entry);
	attachListener(entry);
	return () => {
		persistentListeners.delete(entry);
		socket?.off(event, callback);
	};
}

// ─── Public API ───

export function connect(token: string): Socket {
	if (socket?.connected) {
		return socket;
	}

	if (socket) {
		socket.disconnect();
		socket = null;
	}

	setStatus('CONNECTING');

	socket = io(getWsUrl(), {
		path: getWsPath(),
		auth: { token },
		transports: ['websocket', 'polling'],
		upgrade: true,
		reconnection: true,
		reconnectionAttempts: Infinity,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 30000,
		randomizationFactor: 0.5, // jitter for exponential backoff
	});

	// ── Connection lifecycle events ──

	socket.on('connect', () => {
		setStatus('OPEN');
		attachAllListeners();
		flushOfflineQueue();
	});

	socket.on('disconnect', (reason) => {
		// logger.log(`[Socket.IO] Disconnected: ${reason}`);
		if (reason === 'io server disconnect' || reason === 'io client disconnect') {
			setStatus('CLOSED');
		} else {
			// Transport error, ping timeout, etc. — will auto-reconnect
			setStatus('RECONNECTING');
		}
	});

	socket.on('connect_error', (_error) => {
    console.error('[Socket] Connection failed:', _error);
  });

	// ── Reconnect attempts — refresh token before each attempt ──
	socket.io.on('reconnect_attempt', () => {
		setStatus('RECONNECTING');
		// Update auth token in case it was refreshed during disconnect
		const freshToken = getAccessToken();
		if (freshToken && socket) {
			socket.auth = { token: freshToken };
		}
	});

	socket.io.on('reconnect', () => {
		setStatus('OPEN');
	});

	socket.io.on('reconnect_failed', () => {
		setStatus('CLOSED');
	});

	// ── Application-level heartbeat ──
	socket.on('ws:ping', () => {
		socket?.emit('ws:pong');
	});

	// ── Token expired — server is telling us to refresh and reconnect ──
	socket.on('token_expired', async () => {
		// logger.warn('[Socket.IO] Server reported token expired — attempting auto-refresh');
		try {
			await authService.refresh();
			const freshToken = getAccessToken();
			if (freshToken) {
				logger.log('[Socket.IO] Token refreshed — reconnecting with new token');
				if (socket) {
					socket.auth = { token: freshToken };
					socket.disconnect();
					socket.connect();
				}
				setStatus('RECONNECTING');
			} else {
				logger.warn('[Socket.IO] Token refresh failed — no new token available');
				disconnect();
				setStatus('CLOSED');
			}
		} catch (err) {
			logger.error('[Socket.IO] Token refresh failed:', err);
			disconnect();
			setStatus('CLOSED');
		}
	});

	// ── Server going away (graceful restart) — reconnect automatically ──
	socket.on('server_shutdown', () => {
		// logger.log('[Socket.IO] Server is shutting down — will reconnect automatically');
	});

	// ── Connection acknowledgement from server ──
	socket.on('connected', (_data: { sessionId: string; userId: string }) => {
    console.log('[Socket] Ready to receive real-time updates');
  });

  socket.on('missed_messages', (_data: { count: number; messages: unknown[] }) => {
		// logger.log(`[Socket.IO] Received ${data.count} missed message(s) from server — individual events will follow`);
		// Individual events are replayed by the server right after this batch envelope,
		// so existing listeners (notifications, chat, shopping list, etc.) fire automatically.
		// This handler is for logging/debugging; components can also listen for 'missed_messages'
		// to show a "You have X new updates" toast.
	});

	attachAllListeners();
	return socket;
}

export function disconnect(): void {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
	setStatus('CLOSED');
}

export function getSocket(): Socket | null {
	return socket;
}

/** Get current connection status */
export function getConnectionStatus(): WsConnectionStatus {
	return currentStatus;
}

/** Subscribe to connection status changes. Returns unsubscribe function. */
export function onConnectionStatusChange(callback: StatusCallback): () => void {
	statusListeners.add(callback);
	// Immediately fire with current status
	callback(currentStatus);
	return () => { statusListeners.delete(callback); };
}

/**
 * Safe emit — queues the message if offline.
 */
export function safeEmit(event: string, data: unknown): void {
	if (socket?.connected) {
		socket.emit(event, data);
	} else {
		if (offlineQueue.length < MAX_QUEUE_SIZE) {
			offlineQueue.push({ event, data });
		} else {
			logger.warn('[Socket.IO] Offline queue full — dropping message');
		}
	}
}

// ─── Typed event helpers (backwards-compatible) ───

export function onNewMessage(callback: (data: NewMessageEvent) => void): () => void {
	return registerListener('new_message', callback);
}

export function onMessagesRead(callback: (data: MessagesReadEvent) => void): () => void {
	return registerListener('messages_read', callback);
}

export function onTypingStart(callback: (data: TypingEvent) => void): () => void {
	return registerListener('typing_start', callback);
}

export function onTypingStop(callback: (data: TypingEvent) => void): () => void {
	return registerListener('typing_stop', callback);
}

export function emitTypingStart(receiverId: string): void {
	safeEmit('typing_start', { receiverId });
}

export function emitTypingStop(receiverId: string): void {
	safeEmit('typing_stop', { receiverId });
}

export interface NotificationEvent {
	id: string;
	type: string;
	title: string;
	message: string;
	data: Record<string, unknown> | null;
	createdAt: string;
}

export function onNotification(callback: (data: NotificationEvent) => void): () => void {
	return registerListener('notification', callback);
}

export function onNewFollower(callback: (data: { followerId: string; username: string }) => void): () => void {
	return registerListener('new_follower', callback);
}

export function onFriendRequest(callback: (data: { requestId: string; senderId: string; username: string }) => void): () => void {
	return registerListener('friend_request', callback);
}

export function onFriendRequestAccepted(callback: (data: { friendId: string; username: string }) => void): () => void {
	return registerListener('friend_request_accepted', callback);
}

export function onUserStatusChange(callback: (data: { userId: string; isOnline: boolean }) => void): () => void {
	return registerListener('user_status_change', callback);
}

export function onFeedUpdate(callback: (data: { type: string; recipeId?: string; userId?: string }) => void): () => void {
	return registerListener('feed_update', callback);
}

export function joinRecipeRoom(recipeId: string): void {
	safeEmit('join_recipe', { recipeId });
}

export function leaveRecipeRoom(recipeId: string): void {
	safeEmit('leave_recipe', { recipeId });
}

export function onNewComment(callback: (data: { recipeId: string; comment: any }) => void): () => void {
	return registerListener('new_comment', callback);
}

export function onCommentUpdated(callback: (data: { recipeId: string; comment: any }) => void): () => void {
	return registerListener('comment_updated', callback);
}

export function onCommentDeleted(callback: (data: { recipeId: string; commentId: string }) => void): () => void {
	return registerListener('comment_deleted', callback);
}

export function onShoppingListUpdate(callback: (data: any) => void): () => void {
	return registerListener('shopping_list_update', callback);
}

export function onMealPlanUpdate(callback: (data: any) => void): () => void {
	return registerListener('meal_plan_update', callback);
}

export function onCommentTypingStart(callback: (data: { senderId: string; recipeId: string }) => void): () => void {
	return registerListener('comment_typing_start', callback);
}

export function onCommentTypingStop(callback: (data: { senderId: string; recipeId: string }) => void): () => void {
	return registerListener('comment_typing_stop', callback);
}

export function emitCommentTyping(recipeId: string): void {
	safeEmit('comment_typing_start', { recipeId });
}

export function emitCommentStopTyping(recipeId: string): void {
	safeEmit('comment_typing_stop', { recipeId });
}

export function onFriendRequestRejected(callback: (data: { rejectorId: string; username: string }) => void): () => void {
	return registerListener('friend_request_rejected', callback);
}

export function onRecipeRatingUpdate(callback: (data: { recipeId: string; averageScore: number; ratingCount: number }) => void): () => void {
	return registerListener('recipe_rating_update', callback);
}

export function onMissedMessages(callback: (data: { count: number; messages: Array<{ event: string; data: unknown; bufferedAt: string }> }) => void): () => void {
	return registerListener('missed_messages', callback);
}

