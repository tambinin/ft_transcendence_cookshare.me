import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { globalErrorHandler, validateEnv, getLoggerConfig, registerMetrics, silenceHealthLogs } from '@transcendence/common';
import { internalRoutes } from './routes/internal.routes';
import { initializeWebSocket } from './ws/ws.plugin';
import fs from 'fs';

const env = validateEnv();

const app = fastify({
    logger: getLoggerConfig('websocket-service'),
    disableRequestLogging: true,
    https: {
        key: fs.readFileSync(process.env.TLS_KEY_PATH || '/certs/key.pem'),
        cert: fs.readFileSync(process.env.TLS_CERT_PATH || '/certs/cert.pem'),
    },
});

app.setErrorHandler(globalErrorHandler);
silenceHealthLogs(app);

app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
});

app.get('/health', async () => ({
    status: 'ok',
    service: 'websocket-service',
    timestamp: new Date().toISOString(),
}));

const start = async () => {
    try {
        await registerMetrics(app, 'websocket-service');
        await app.register(internalRoutes);

        await app.ready();

        initializeWebSocket(app);

        await app.listen({
            port: env.WEBSOCKET_SERVICE_PORT,
            host: '0.0.0.0',
        });

        app.log.info(`WebSocket Service running on port ${env.WEBSOCKET_SERVICE_PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();