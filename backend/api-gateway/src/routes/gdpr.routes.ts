import { FastifyInstance } from "fastify";
import { proxyRequest } from "../utils/proxy";
import { HttpStatus, sendError } from "@transcendence/common";
import { commonResponses, createResponseSchema } from "../utils/swagger.schemas";


const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export async function gdprRoutes(app: FastifyInstance) {
    app.delete("/gdpr/confirm-deletion", {
        schema: {
            tags: ["GDPR"],
            summary: "Confirm account deletion (Public)",
            description: "### Overview\nFinalizes the user's 'Right to be Forgotten' request by executing a permanent and irreversible account deletion.\n\n### Technical Details\n- Validates the high-security deletion token dispatched via email.\n- Orchestrates a cross-service purge: deletes credentials in `auth-service`, profile in `user-service`, and cascades to all user-generated content (recipes, comments, etc.).\n\n### Side Effects\n- Permanent loss of all account rankings, social connections, and history.\n- Immediate invalidation of all active session tokens and cookies.\n\n### Security\n- Token-based verification; no active Bearer token required for this specific public recovery action.\n- WARNING: This operation is non-recoverable.",
            body: {
                type: "object",
                required: ["token"],
                properties: {
                    token: { type: "string", description: "Deletion confirmation token received via email" }
                }
            },
            security: [{ apiKeyAuth: [] }],
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "success" },
                        message: { type: "string" },
                        data: {
                            type: "object",
                            properties: {
                                email: { type: "string" }
                            }
                        }
                    }
                },
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/gdpr/confirm-deletion`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });
}

