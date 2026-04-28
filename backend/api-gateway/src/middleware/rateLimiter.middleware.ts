import rateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '@transcendence/common';

const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < max then
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('PEXPIRE', key, window)
    return {1, count + 1}
else
    redis.call('PEXPIRE', key, window)
    return {0, count}
end
`;

export async function registerRateLimiter(app: FastifyInstance) {
    await app.register(rateLimit, {
        max: 300,
        timeWindow: 60000,
        redis: redis,
        nameSpace: 'rate-limit:global:',
        errorResponseBuilder: (_request: FastifyRequest, context: any) => {
            return {
                status: 'error',
                message: `Too many requests. Retry in ${Math.ceil(context.ttl / 1000)} seconds.`
            };
        }
    });
}

function createAtomicRateLimiter(prefix: string, defaultMax: number, defaultTimeWindow: number) {
    return function (max: number = defaultMax, timeWindow: number = defaultTimeWindow) {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            const identifier = (request as any).user?.id || request.ip;
            const key = `rate-limit:${prefix}:${identifier}`;
            const now = Date.now();

            try {
                const result = await redis.eval(
                    SLIDING_WINDOW_LUA,
                    1,
                    key,
                    now.toString(),
                    timeWindow.toString(),
                    max.toString()
                ) as [number, number];

                const [allowed, count] = result;

                reply.header('X-RateLimit-Limit', max);
                reply.header('X-RateLimit-Remaining', Math.max(0, max - count));

                if (!allowed) {
                    return reply.status(429).send({
                        status: 'error',
                        message: 'Too many requests, please try again later.'
                    });
                }
            } catch (error) {
                request.log.error({ err: error }, 'Rate limiter Redis error');
            }
        };
    };
}

export const strictRateLimiter = createAtomicRateLimiter('strict', 15, 60000);
export const moderateRateLimiter = createAtomicRateLimiter('moderate', 20, 60000);
export const userRateLimiter = createAtomicRateLimiter('user', 30, 60000);