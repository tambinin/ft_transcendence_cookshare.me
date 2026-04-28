import pino from "pino";
import { fetchWithTimeout } from "@transcendence/common";

const logger = pino({ name: 'recipe-service:notifyWebsocket' });

const getWsUrl = () => process.env.WEBSOCKET_SERVICE_URL || `https://websocket:${process.env.WEBSOCKET_SERVICE_PORT || 3007}`;

async function emitToRoom(room: string, event: string, data: any) {
    const response = await fetchWithTimeout(`${getWsUrl()}/internal/trigger-room-event`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': process.env.INTERNAL_API_KEY!
        },
        body: JSON.stringify({ room, event, data })
    });
    if (!response.ok) {
        const text = await response.text();
        logger.error({ room, event, status: response.status }, `Failed to emit to room: ${text}`);
    }
}

async function emitToUser(userId: string, event: string, data: any) {
    const response = await fetchWithTimeout(`${getWsUrl()}/internal/trigger-event`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': process.env.INTERNAL_API_KEY!
        },
        body: JSON.stringify({ userId, event, data })
    });
    if (!response.ok) {
        const text = await response.text();
        logger.error({ userId, event, status: response.status }, `Failed to emit to user: ${text}`);
    }
}

export async function notifyShoppingListUpdate(userId: string, action: string, item: any) {
    logger.info({ userId, action }, 'Attempting to notify shopping list update');
    await emitToRoom(`shopping_list_${userId}`, 'shopping_list_update', {
        action,
        item,
        timestamp: new Date().toISOString()
    });
}

export async function notifyRecipeRoom(recipeId: string, event: string, data: any) {
    await emitToRoom(`recipe_${recipeId}`, event, data);
}

export async function broadcast(event: string, data: any) {
    try {
        const response = await fetchWithTimeout(`${getWsUrl()}/internal/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': process.env.INTERNAL_API_KEY!
            },
            body: JSON.stringify({ event, data })
        });
        if (!response.ok) {
            const text = await response.text();
            logger.error({ event, status: response.status }, `Failed to broadcast: ${text}`);
        }
    } catch (error) {
        logger.error({ err: error, event }, 'Failed to broadcast event');
    }
}

export async function notifyMealPlanUpdate(userId: string, action: string, data: any) {
    await emitToUser(userId, 'meal_plan_update', { action, ...data, timestamp: new Date().toISOString() });
}
