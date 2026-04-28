import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import db from './utils/dbPlugin';
import { gamificationRoutes } from './routes/gamification.routes';
import { userRoutes } from './routes/user.routes';
import { startCleanupTask } from './services/cleanup.service';
import { globalErrorHandler, internalApiKeyMiddleware, validateEnv, getLoggerConfig, registerMetrics, silenceHealthLogs } from '@transcendence/common';
import fs from 'fs';

const env = validateEnv();

export const app = fastify({
    logger: getLoggerConfig("user-service"),
    disableRequestLogging: true,
    https: {
        key: fs.readFileSync(process.env.TLS_KEY_PATH || '/certs/key.pem'),
        cert: fs.readFileSync(process.env.TLS_CERT_PATH || '/certs/cert.pem'),
    }
});

app.setErrorHandler(globalErrorHandler);
silenceHealthLogs(app);

app.register(fastifyJwt, {
    secret: env.JWT_SECRET
});

app.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    }
});

app.get('/health', async () => ({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() }));

const start = async () => {
    try {
        app.decorate('db', db);
        startCleanupTask(app);
        await registerMetrics(app, "user-service");
        await app.register(async (api) => {
            api.addHook('preHandler', internalApiKeyMiddleware);
            await api.register(userRoutes, { prefix: '/api/v1' });
            await api.register(gamificationRoutes, { prefix: '/api/v1' });
        });

        await app.ready();

        await app.listen({
            port: env.USER_SERVICE_PORT,
            host: '0.0.0.0'
        });

        app.log.info(`User Service running on ${process.env.DOMAIN}:${env.USER_SERVICE_PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        app.log.info(`Received ${signal}, closing server...`);
        await app.close();
        process.exit(0);
    });
});

start();