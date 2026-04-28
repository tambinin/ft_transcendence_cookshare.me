import { redis } from './redis.util';

export class RateLimiter {
    constructor(
        private max: number,
        private timeWindowMs: number,
        private prefix: string = 'rate-limit'
    ) { }

    async isRateLimited(key: string): Promise<boolean> {
        const fullKey = `${this.prefix}:${key}`;
        const count = await redis.llen(fullKey);
        return count >= this.max;
    }

    async recordAttempt(key: string): Promise<void> {
        const fullKey = `${this.prefix}:${key}`;
        const now = Date.now();

        await redis.multi()
            .rpush(fullKey, now)
            .pexpire(fullKey, this.timeWindowMs)
            .exec();

        const entries = await redis.lrange(fullKey, 0, -1);
        const validEntries = entries.filter(ts => now - parseInt(ts) < this.timeWindowMs);

        if (validEntries.length !== entries.length) {
            await redis.del(fullKey);
            if (validEntries.length > 0) {
                await redis.rpush(fullKey, ...validEntries);
                await redis.pexpire(fullKey, this.timeWindowMs);
            }
        }
    }

    async reset(key: string): Promise<void> {
        await redis.del(`${this.prefix}:${key}`);
    }
}

/**
 * Pre-configured rate limiter for password verification:
 * 3 attempts allowed within a 1-minute window.
 */
export const passwordRateLimiter = new RateLimiter(3, 60000, 'auth:login');