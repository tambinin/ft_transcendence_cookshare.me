import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { stopHeartbeat } from './ws.heartbeat';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:shutdown');

/** Max time to wait for all sockets to disconnect (ms) */
const SHUTDOWN_TIMEOUT_MS = 15_000;

let shutdownInProgress = false;

/**
 * Register signal handlers for graceful shutdown.
 * Should be called once after server and Socket.IO are initialized.
 */
export function registerShutdownHandlers(app: FastifyInstance, io: Server): void {
	const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

	for (const signal of signals) {
		process.on(signal, async () => {
			if (shutdownInProgress) return;
			shutdownInProgress = true;

			logger.info(`Received ${signal} — starting graceful shutdown`);

			stopHeartbeat();

			const sockets = await io.sockets.fetchSockets();
			logger.info(`Closing ${sockets.length} active WebSocket connection(s)`);

			for (const socket of sockets) {
				try {
					socket.emit('server_shutdown', {
						type: 'SERVER_SHUTDOWN',
						message: 'Server is restarting. You will be reconnected automatically.',
					});
					socket.disconnect(true);
				} catch {
				}
			}

			try {
				await new Promise<void>((resolve) => {
					io.close(() => {
						logger.info('Socket.IO server closed');
						resolve();
					});
				});
			} catch (err) {
				logger.error({ err }, 'Error closing Socket.IO server');
			}

			try {
				await app.close();
				logger.info('Fastify server closed');
			} catch (err) {
				logger.error({ err }, 'Error closing Fastify server');
			}

			logger.info('Graceful shutdown complete');
			process.exit(0);
		});
	}
}
