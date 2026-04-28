import { validateEnv, fetchWithTimeout } from '@transcendence/common';
import pino from 'pino';

const logger = pino({ name: 'notification-service:websocket' });

const env = validateEnv();

// Use Docker service hostname from Vault env var, with fallback
const WEBSOCKET_SERVICE_URL = process.env.WEBSOCKET_SERVICE_URL || `https://websocket:${env.WEBSOCKET_SERVICE_PORT}`;

export async function notifyUser(userId: string, event: string, data: any) {
    try {
        const websocketServiceUrl = `${WEBSOCKET_SERVICE_URL}/internal/trigger-event`;

        await fetchWithTimeout(websocketServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': env.INTERNAL_API_KEY
            },
            body: JSON.stringify({
                userId,
                event,
                data
            })
        });
    } catch (error) {
        logger.error({ err: error, userId }, `Failed to notify user ${userId}`);
    }
}
