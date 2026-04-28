import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { validateEnv, fetchWithTimeout } from '@transcendence/common';
import { authMiddleware } from './ws.auth';
import { registerConnectionHandler } from './ws.handler';
import { startHeartbeat } from './ws.heartbeat';
import { registerShutdownHandlers } from './ws.shutdown';
import { emitToUser as roomEmitToUser, emitToRoom as roomEmitToRoom } from './ws.rooms';
import { setupRedisAdapter } from './ws.adapter';
import type { AuthenticatedSocket } from './ws.types';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:plugin');
const env = validateEnv();

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || `https://recipe:${env.RECIPE_SERVICE_PORT}`;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${env.USER_SERVICE_PORT}`;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || `https://auth:${env.AUTH_SERVICE_PORT}`;
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || `https://chat:${env.CHAT_SERVICE_PORT}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `https://notification:${env.NOTIFICATION_SERVICE_PORT}`;

let io: Server | null = null;

/**
 * Initialize Socket.IO on the Fastify server.
 * This replaces the old `SocketService.initialize()` static class.
 */
export function initializeWebSocket(app: FastifyInstance): void {
	const DOMAIN = process.env.DOMAIN;
	const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
	const defaultOrigins = [
		'http://localhost:5173', 'https://localhost',
		'https://cookshare.me', 'https://www.cookshare.me',
	];
	if (DOMAIN && DOMAIN !== 'localhost' && DOMAIN !== 'cookshare.me') {
		defaultOrigins.push(`http://${DOMAIN}:5173`, `https://${DOMAIN}:5173`, `https://${DOMAIN}`);
	}
	const allowedOrigins = [...new Set([...corsOrigins, ...defaultOrigins])];

	function isLocalNetworkOrigin(origin: string): boolean {
		try {
			const url = new URL(origin);
			const host = url.hostname;
			return (
				host === 'localhost' ||
				host === '127.0.0.1' ||
				host.startsWith('10.') ||
				host.startsWith('192.168.') ||
				/^172\.(1[6-9]|2\d|3[01])\./.test(host)
			);
		} catch { return false; }
	}

	io = new Server(app.server, {
		cors: {
			origin: (origin, cb) => {
				if (!origin) return cb(null, true);
				if (allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
					cb(null, true);
				} else {
					cb(new Error('Not allowed by CORS'), false);
				}
			},
			methods: ['GET', 'POST'],
			credentials: true,
		},
		path: '/socket.io/',
		maxHttpBufferSize: 128 * 1024,
		pingTimeout: 30_000,
		pingInterval: 25_000,
		transports: ['websocket', 'polling'],
		allowUpgrades: true,
	});

	io.use(authMiddleware as (socket: any, next: (err?: Error) => void) => void);

	setupRedisAdapter(io).catch((err) => {
		logger.warn({ err }, 'Redis adapter setup skipped or failed — running in single-instance mode');
	});

	io.on('connection', (rawSocket) => {
		const socket = rawSocket as unknown as AuthenticatedSocket;
		if (!socket.userId) {
			socket.disconnect(true);
			return;
		}
		registerConnectionHandler(app, io!, socket);
	});

	startHeartbeat(io);

	startHealthBroadcast();

	registerShutdownHandlers(app, io);

	app.log.info('Socket.IO initialized with heartbeat, rate-limiting, and graceful shutdown');
}

export function getIO(): Server {
	if (!io) throw new Error('Socket.IO not initialized');
	return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
	if (!io) return;
	roomEmitToUser(io, userId, event, data);
}

export function emitToRoom(room: string, event: string, data: unknown): void {
	if (!io) return;
	roomEmitToRoom(io, room, event, data);
}

let healthTimer: ReturnType<typeof setInterval> | null = null;

function startHealthBroadcast(): void {
	const services = [
		{ name: 'auth-service', url: AUTH_SERVICE_URL },
		{ name: 'recipe-service', url: RECIPE_SERVICE_URL },
		{ name: 'user-service', url: USER_SERVICE_URL },
		{ name: 'chat-service', url: CHAT_SERVICE_URL },
		{ name: 'notification-service', url: NOTIFICATION_SERVICE_URL },
		{ name: 'websocket-service', url: `https://localhost:${env.WEBSOCKET_SERVICE_PORT}` },
	];

	healthTimer = setInterval(async () => {
		if (!io) return;

		const healthResults = await Promise.allSettled(
			services.map(async (service) => {
				try {
					const response = await fetchWithTimeout(`${service.url}/health`);
					return { name: service.name, status: response.ok ? 'UP' : 'DOWN' };
				} catch {
					return { name: service.name, status: 'DOWN' };
				}
			})
		);

		const results = healthResults.map(r => r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'DOWN' });

		io.to('system:health').emit('health_update', {
			status: results.every(r => r.status === 'UP') ? 'HEALTHY' : 'DEGRADED',
			services: results,
			timestamp: new Date().toISOString(),
		});
	}, 15_000);
}
