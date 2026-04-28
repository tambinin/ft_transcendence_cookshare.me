import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './ws.types';
import { checkTokenExpiry } from './ws.auth';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:heartbeat');

const HEARTBEAT_INTERVAL_MS = 30_000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the heartbeat loop. Should be called once after Socket.IO init.
 */
export function startHeartbeat(io: Server): void {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
	}

	heartbeatTimer = setInterval(() => {
		const sockets = io.sockets.sockets;

		sockets.forEach((raw) => {
			const socket = raw as unknown as AuthenticatedSocket;

			if (!socket.isAlive) {
				logger.info(
					{ userId: socket.userId, socketId: socket.id },
					'Heartbeat: no pong received — disconnecting ghost socket'
				);
				socket.disconnect(true);
				return;
			}

			if (!checkTokenExpiry(socket)) {
				logger.info(
					{ userId: socket.userId, socketId: socket.id },
					'Heartbeat: JWT expired mid-session — disconnecting'
				);
				socket.emit('token_expired', { type: 'TOKEN_EXPIRED' });
				socket.disconnect(true);
				return;
			}

			socket.isAlive = false;
			socket.emit('ws:ping');
		});
	}, HEARTBEAT_INTERVAL_MS);

	logger.info(`Heartbeat started (interval: ${HEARTBEAT_INTERVAL_MS}ms)`);
}

/**
 * Stop the heartbeat loop. Called during graceful shutdown.
 */
export function stopHeartbeat(): void {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
		heartbeatTimer = null;
		logger.info('Heartbeat stopped');
	}
}

/**
 * Register the pong listener on a single socket.
 * Called when a new client connects.
 */
export function registerPongHandler(socket: AuthenticatedSocket): void {
	socket.on('ws:pong', () => {
		socket.isAlive = true;
	});
}
