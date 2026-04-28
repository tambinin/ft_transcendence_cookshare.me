import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendSuccess } from '@transcendence/common';
import { processGamificationEvent, getUserGamificationProfile, GamificationEvent } from '../services/gamification.service';

export const eventSchema = z.object({
    userId: z.string().uuid(),
    event: z.nativeEnum(GamificationEvent),
    data: z.any().optional()
});

export async function internalGamificationEventHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId, event, data } = request.body as z.infer<typeof eventSchema>;
    const result = await processGamificationEvent(userId, event, data);
    sendSuccess(reply, result);
}

export async function getGamificationProfileHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const profile = await getUserGamificationProfile(id);
    sendSuccess(reply, profile);
}
