import { FastifyInstance } from 'fastify';
import { bodyValidator, internalApiKeyMiddleware } from '@transcendence/common';
import {
    triggerEventHandler,
    triggerRoomEventHandler,
    triggerBroadcastHandler,
    triggerEventSchema,
    triggerRoomEventSchema,
    triggerBroadcastSchema
} from '../controllers/socket.controller';

export async function internalRoutes(app: FastifyInstance) {
    app.post("/internal/trigger-event", {
        preHandler: [internalApiKeyMiddleware, bodyValidator(triggerEventSchema)]
    }, triggerEventHandler);

    app.post("/internal/trigger-room-event", {
        preHandler: [internalApiKeyMiddleware, bodyValidator(triggerRoomEventSchema)]
    }, triggerRoomEventHandler);

    app.post("/internal/broadcast", {
        preHandler: [internalApiKeyMiddleware, bodyValidator(triggerBroadcastSchema)]
    }, triggerBroadcastHandler);
}
