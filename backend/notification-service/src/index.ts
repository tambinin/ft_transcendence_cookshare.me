import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { notificationRoutes } from './routes/notification.routes';
import { globalErrorHandler, internalApiKeyMiddleware, validateEnv, getLoggerConfig, registerMetrics, silenceHealthLogs } from '@transcendence/common';
import fs from 'fs';

const env = validateEnv();

const app = fastify({
    logger: getLoggerConfig("notification-service"),
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

app.get('/health', async () => ({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() }));

const start = async () => {
    try {
        await registerMetrics(app, "notification-service");
        await app.register(async (api) => {
            api.addHook('preHandler', internalApiKeyMiddleware);
            await api.register(notificationRoutes, { prefix: '/api/v1' });
        });

        await app.ready();
        await app.listen({
            port: env.NOTIFICATION_SERVICE_PORT,
            host: '0.0.0.0'
        });

        app.log.info(`Notification Service running on ${process.env.DOMAIN}:${env.NOTIFICATION_SERVICE_PORT}`);
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