import { Server } from 'socket.io';
import { validateEnv } from '@transcendence/common';
import { createWsLogger } from './ws.logger';

const logger = createWsLogger('ws:adapter');

export async function setupRedisAdapter(io: Server): Promise<void> {
	const enabled = process.env.WS_REDIS_ADAPTER === 'true';

	if (!enabled) {
		logger.info('Redis adapter disabled (WS_REDIS_ADAPTER !== "true") — single-instance mode');
		return;
	}

	try {
		const { createAdapter } = await import('@socket.io/redis-adapter');
		const Redis = (await import('ioredis')).default;

		const env = validateEnv();

		const pubClient = new Redis({
			host: env.REDIS_HOST,
			port: env.REDIS_PORT,
			password: env.REDIS_PASSWORD,
			keyPrefix: 'ws:adapter:',
			retryStrategy: (times) => Math.min(times * 100, 3000),
		});

		const subClient = pubClient.duplicate();

		await Promise.all([
			new Promise<void>((resolve, reject) => {
				pubClient.once('ready', resolve);
				pubClient.once('error', reject);
			}),
			new Promise<void>((resolve, reject) => {
				subClient.once('ready', resolve);
				subClient.once('error', reject);
			}),
		]);

		io.adapter(createAdapter(pubClient, subClient));

		logger.info('Socket.IO Redis adapter attached — multi-instance mode enabled');
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'MODULE_NOT_FOUND') {
			logger.warn(
				'@socket.io/redis-adapter not installed. ' +
				'Run: npm install @socket.io/redis-adapter — then restart.'
			);
		} else {
			logger.error({ err }, 'Failed to setup Redis adapter');
		}
	}
}
