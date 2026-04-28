
import { validateEnv, fetchWithTimeout } from "@transcendence/common";
import pino from "pino";

const logger = pino({ name: 'recipe-service:gamification' });

// Use Docker service hostname from Vault env var, with fallback
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${process.env.USER_SERVICE_PORT || 3004}`;

export enum GamificationEvent {
    RECIPE_CREATED = 'RECIPE_CREATED',
    REVIEW_GIVEN = 'REVIEW_GIVEN',
    FIRST_LOGIN = 'FIRST_LOGIN',
    FOLLOWER_GAINED = 'FOLLOWER_GAINED'
}

export async function triggerGamificationEvent(userId: string, event: GamificationEvent, data: any = {}) {
    try {
        await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/gamification/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': process.env.INTERNAL_API_KEY!
            },
            body: JSON.stringify({
                userId,
                event,
                data
            })
        });
    } catch (error) {
        logger.error({ err: error, event, userId }, 'Failed to trigger gamification event');
    }
}
