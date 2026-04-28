import Redis from 'ioredis';
import { validateEnv } from '../config';

const env = validateEnv();

class RedisClient {
    private static instance: Redis | null = null;

    public static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis({
                host: env.REDIS_HOST,
                port: env.REDIS_PORT,
                password: env.REDIS_PASSWORD,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });

            RedisClient.instance.on('error', (err) => {
                console.error('Redis connection error:', err.message);
            });
        }

        return RedisClient.instance;
    }
}

export const redis = RedisClient.getInstance();
