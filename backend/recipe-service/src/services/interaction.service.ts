import db from "../utils/db";
import { InteractionType } from "../generated/prisma";
import pino from "pino";

const logger = pino({ name: 'recipe-service:interaction' });

export async function logInteraction(userId: string, type: InteractionType, payload?: any) {
    try {
        await db.userInteraction.create({
            data: {
                userId,
                type,
                payload: payload ? payload : undefined
            }
        });
    } catch (error) {
        logger.error({ err: error, userId, type }, "Failed to log interaction");
    }
}
