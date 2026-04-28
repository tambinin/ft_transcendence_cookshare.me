import pino from "pino";
import { NotificationType, fetchWithTimeout } from "@transcendence/common";

const logger = pino({ name: 'recipe-service:notifyUser' });

// Use Docker service hostname from Vault env var, with fallback
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `https://notification:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`;

export async function notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
) {
    try {
        const response = await fetchWithTimeout(`${NOTIFICATION_SERVICE_URL}/api/v1/internal/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': process.env.INTERNAL_API_KEY!
            },
            body: JSON.stringify({
                userId,
                type,
                title,
                message,
                data
            })
        });

        if (!response.ok) {
            logger.error({ status: response.status, userId }, 'Failed to send notification');
        }

        return response.ok;
    } catch (error) {
        logger.error({ err: error, userId }, 'Error sending notification');
        return false;
    }
}
