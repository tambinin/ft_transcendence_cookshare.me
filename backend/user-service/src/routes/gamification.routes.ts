import { FastifyInstance } from 'fastify';
import { bodyValidator, internalApiKeyMiddleware } from '@transcendence/common';
import {
    internalGamificationEventHandler,
    getGamificationProfileHandler,
    eventSchema
} from '../controllers/gamification.controller';

export async function gamificationRoutes(app: FastifyInstance) {
    app.post("/internal/gamification/event", {
        preHandler: [internalApiKeyMiddleware, bodyValidator(eventSchema)]
    }, internalGamificationEventHandler);

    app.get("/users/:id/gamification", getGamificationProfileHandler);
}
