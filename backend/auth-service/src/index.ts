import fastify from 'fastify';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.routes';
import { globalErrorHandler, validateEnv, getLoggerConfig, registerMetrics, silenceHealthLogs } from '@transcendence/common';
import fastifyMultipart from '@fastify/multipart';
import cookie from "@fastify/cookie";
import fs from 'fs';

const env = validateEnv();

const app = fastify({
    logger: getLoggerConfig("auth-service"),
    disableRequestLogging: true,
    https: {
        key: fs.readFileSync(process.env.TLS_KEY_PATH || '/certs/key.pem'),
        cert: fs.readFileSync(process.env.TLS_CERT_PATH || '/certs/cert.pem'),
    }
});

app.setErrorHandler(globalErrorHandler);
silenceHealthLogs(app);

app.register(jwt, {
    secret: env.JWT_SECRET
});

app.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    }
});

app.register(cookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {}
});

app.get('/health', async () => ({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() }));

const start = async () => {
    try {
        await registerMetrics(app, "auth-service");
        await app.register(authRoutes, { prefix: '/api/v1' });

        await app.ready();
        await app.listen({
            port: env.AUTH_SERVICE_PORT,
            host: '0.0.0.0'
        });

        app.log.info(`Auth Service running on ${process.env.DOMAIN}:${env.AUTH_SERVICE_PORT}`);
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