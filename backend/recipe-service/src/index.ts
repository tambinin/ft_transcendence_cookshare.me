import fastify from 'fastify';
import db from './utils/db';
import { recipesRoutes } from './routes/recipe.routes';
import { categoryRoutes } from './routes/category.routes';
import { collectionRoutes } from './routes/collection.routes';
import { shoppingListRoutes } from './routes/shoppingList.routes';
import { imageRoutes } from './routes/image.routes';
import { dietaryTagRoutes } from './routes/dietaryTag.routes';
import { mealPlanRoutes } from './routes/mealPlan.routes';
import { reportRoutes } from './routes/report.routes';
import { ingredientRoutes } from './routes/ingredient.routes';
import { globalErrorHandler, internalApiKeyMiddleware, validateEnv, getLoggerConfig, registerMetrics, silenceHealthLogs } from '@transcendence/common';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fs from 'fs';

const env = validateEnv();

export const app = fastify({
    logger: getLoggerConfig("recipe-service"),
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
        files: 10
    }
});

app.get('/health', async () => ({ status: 'ok', service: 'recipe-service', timestamp: new Date().toISOString() }));

const start = async () => {
    try {
        app.decorate('prisma', db);
        await registerMetrics(app, "recipe-service");
        await app.register(async (api) => {
            api.addHook("preHandler", internalApiKeyMiddleware);
            await api.register(recipesRoutes, { prefix: '/api/v1' });
            await api.register(categoryRoutes, { prefix: '/api/v1' });
            await api.register(imageRoutes, { prefix: '/api/v1' });
            await api.register(dietaryTagRoutes, { prefix: '/api/v1' });
            await api.register(collectionRoutes, { prefix: '/api/v1' });
            await api.register(shoppingListRoutes, { prefix: '/api/v1' });
            await api.register(mealPlanRoutes, { prefix: '/api/v1' });
            await api.register(reportRoutes, { prefix: '/api/v1' });
            await api.register(ingredientRoutes, { prefix: '/api/v1' });
        });

        await app.ready();
        await app.listen({
            port: env.RECIPE_SERVICE_PORT,
            host: '0.0.0.0'
        });

        app.log.info(`Recipe Service running on ${process.env.DOMAIN}:${env.RECIPE_SERVICE_PORT}`);
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