import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    INTERNAL_API_KEY: z.string().min(1, "INTERNAL_API_KEY is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET is required"),
    API_GATEWAY_KEY: z.string().optional(),
    GATEWAY_API_KEY: z.string().optional(),

    API_GATEWAY_PORT: z.coerce.number().default(3001),
    RECIPE_SERVICE_PORT: z.coerce.number().default(3002),
    AUTH_SERVICE_PORT: z.coerce.number().default(3003),
    USER_SERVICE_PORT: z.coerce.number().default(3004),
    CHAT_SERVICE_PORT: z.coerce.number().default(3005),
    NOTIFICATION_SERVICE_PORT: z.coerce.number().default(3006),
    WEBSOCKET_SERVICE_PORT: z.coerce.number().default(3007),

    DATABASE_URL: z.string().optional(),
    AUTH_DATABASE_URL: z.string().optional(),
    USER_DATABASE_URL: z.string().optional(),
    RECIPE_DATABASE_URL: z.string().optional(),
    NOTIFICATION_DATABASE_URL: z.string().optional(),
    CHAT_DATABASE_URL: z.string().optional(),
    WEBSOCKET_DATABASE_URL: z.string().optional(),

    REDIS_HOST: z.string().default('redis'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (): Env => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment variables:', result.error.format());
        process.exit(1);
    }

    return result.data;
};
