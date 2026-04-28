import { FastifyInstance } from "fastify";
import { proxyRequest } from "../utils/proxy";
import { HttpStatus, sendError } from "@transcendence/common";
import { commonResponses, createResponseSchema } from "../utils/swagger.schemas";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

if (!NOTIFICATION_SERVICE_URL) {
    throw new Error("NOTIFICATION_SERVICE_URL is not defined");
}

export async function notificationsRoutes(app: FastifyInstance) {

    app.get("/notifications", {
        schema: {
            tags: ["Notifications"],
            summary: "Get all notifications",
            description: "### Overview\nRetrieves a paginated list of system and social notifications for the authenticated user.\n\n### Technical Details\n- Fetches heterogeneous notification types (follows, comments, mentions) from the `notification-service`.\n- Maps relational metadata (e.g., `recipeId`, `senderId`) into the `data` payload for frontend hydration.\n\n### Validation & Constraints\n- **Pagination**: Clips `limit` to a maximum of 100 to protect service availability.\n\n### Side Effects\n- May trigger a background 'seen' update for delivery tracking.\n\n### Security\n- Strictly scoped to the authenticated user ID extracted from the JWT.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            querystring: {
                type: "object",
                properties: {
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 20 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        notifications: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string", format: "uuid" },
                                    type: { type: "string" },
                                    title: { type: "string" },
                                    message: { type: "string" },
                                    isRead: { type: "boolean" },
                                    data: { type: "object", additionalProperties: true, nullable: true },
                                    createdAt: { type: "string" }
                                }
                            }
                        },
                        pagination: {
                            type: "object",
                            properties: {
                                page: { type: "integer" },
                                limit: { type: "integer" },
                                total: { type: "integer" },
                                totalPages: { type: "integer" }
                            }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/notifications", NOTIFICATION_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "Notification service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });



    app.put("/notifications/:id/read", {
        schema: {
            tags: ["Notifications"],
            summary: "Mark notification as read",
            description: "### Overview\nTransitions a specific notification's state to 'read' to acknowledge receipt.\n\n### Technical Details\n- Performs an atomic update on the `isRead` boolean field in the `notification-service` database.\n- Validates resource ownership before state transition.\n\n### Side Effects\n- Immediately updates the user's synchronous unread notification count.\n- May trigger a WebSocket update to other active client sessions for the user.\n\n### Security\n- Requires active Bearer token with appropriate user scope.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/notifications/${id}/read`, NOTIFICATION_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "Notification service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.put("/notifications/read-all", {
        schema: {
            tags: ["Notifications"],
            summary: "Mark all notifications as read",
            description: "### Overview\nExecutes a bulk update to mark all unread notifications for the user as 'read'.\n\n### Technical Details\n- Executes a high-performance `updateMany` operation in the `notification-service` database.\n- Optimizes the process by targeting only records where `isRead: false` and `userId` matches the requester.\n\n### Side Effects\n- Resets the global unread badge counter for the user across all interfaces.\n- Potentially broadcasts a system-level status update via WebSocket.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/notifications/read-all", NOTIFICATION_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "Notification service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/notifications/:id", {
        schema: {
            tags: ["Notifications"],
            summary: "Delete notification",
            description: "### Overview\nPermanently removes a notification from the user's history.\n\n### Technical Details\n- Performs a hard-delete record removal from the primary notification store.\n- Validates that the record exists and belongs to the requester before execution.\n\n### Side Effects\n- Decrements total notification counts (if cached).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/notifications/${id}`, NOTIFICATION_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "Notification service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });
}
