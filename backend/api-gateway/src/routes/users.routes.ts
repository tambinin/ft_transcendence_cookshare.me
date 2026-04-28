import { FastifyInstance } from "fastify";
import { proxyRequest, proxyMultipart } from "../utils/proxy";
import { HttpStatus, sendError } from "@transcendence/common";
import { commonResponses, createResponseSchema } from "../utils/swagger.schemas";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

if (!USER_SERVICE_URL) {
    throw new Error("USER_SERVICE_URL is not defined");
}

export async function usersRoutes(app: FastifyInstance) {

    app.get("/users/me", {
        schema: {
            operationId: "getCurrentUser",
            tags: ["Users"],
            summary: "Get current user profile",
            description: "### Overview\nRetrieves the private, high-fidelity profile information of the authenticated user session.\n\n### Technical Details\n- Aggregates core identity data with extended profile metadata from the `user-service`.\n- Includes real-time online status and internal role permissions.\n\n### Security\n- Strictly isolated to the authenticated subject (JWT sub claim).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string" },
                        username: { type: "string" },
                        firstName: { type: "string", nullable: true },
                        lastName: { type: "string", nullable: true },
                        avatarUrl: { type: "string", nullable: true },
                        bio: { type: "string", nullable: true },
                        role: { type: "string" },
                        isOnline: { type: "boolean" },
                        isEmailVerified: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users", {
        schema: {
            tags: ["Users"],
            summary: "Get all users",
            description: "### Overview\nLists all registered users in the system.\n\n### Technical Details\n- Fetches basic profile data (username, avatar, role).\n- Supports pagination (default: page 1, limit 10).\n\n### Security\n- Publicly accessible, but sensitive fields (email, password) are excluded.",
            security: [{ apiKeyAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            email: { type: "string" },
                            firstName: { type: "string", nullable: true },
                            lastName: { type: "string", nullable: true },
                            avatarUrl: { type: "string", nullable: true },
                            role: { type: "string" },
                            bio: { type: "string", nullable: true },
                            isOnline: { type: "boolean" },
                            isEmailVerified: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/search", {
        schema: {
            tags: ["Users"],
            summary: "Search users",
            description: "### Overview\nFinds users based on a search query.\n\n### Technical Details\n- Performs a case-insensitive partial match on `username` and `email`.\n- Uses full-text search indexing in the `user-service` database.\n\n### Validation & Constraints\n- **q**: Minimum 1 character required.",
            security: [{ apiKeyAuth: [] }],
            querystring: {
                type: "object",
                properties: {
                    q: { type: "string" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string" },
                            email: { type: "string" },
                            firstName: { type: "string", nullable: true },
                            lastName: { type: "string", nullable: true }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/search", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/:id", {
        schema: {
            tags: ["Users"],
            summary: "Get specific user profile",
            description: "### Overview\nExposes the public identity and social footprint of any platform user.\n\n### Technical Details\n- Fetches public attributes: biography, avatar, and join date.\n- Aggregates social reach metrics (follower/following counts).\n\n### Security\n- Filtered to exclude sensitive PII (Personally Identifiable Information) like email or password hashes.",
            security: [{ apiKeyAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string" },
                        email: { type: "string" },
                        firstName: { type: "string", nullable: true },
                        lastName: { type: "string", nullable: true },
                        avatarUrl: { type: "string", nullable: true },
                        bio: { type: "string", nullable: true },
                        role: { type: "string" },
                        isOnline: { type: "boolean" },
                        isEmailVerified: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users", {
        schema: {
            hide: true
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/change-password", {
        schema: {
            tags: ["Users"],
            summary: "Change password",
            description: "### Overview\nAllows an authenticated user to update their password.\n\n### Technical Details\n1. Verifies the `currentPassword` against the `auth-service`.\n2. If correct, hashes and updates the `newPassword`.\n\n### Validation & Constraints\n- **newPassword**: Must be different from the current password and meet complexity rules.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["oldPassword", "newPassword"],
                properties: {
                    oldPassword: { type: "string" },
                    newPassword: { type: "string", minLength: 8 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        message: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/change-password", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/me/avatar", {
        schema: {
            tags: ["Users"],
            summary: "Update current user avatar",
            description: "### Overview\nProvides a dedicated endpoint for updating the authenticated user's profile picture.\n\n### Technical Details\n- Handles `multipart/form-data` uploads.\n- Automatically crops and optimizes the image for profile display.\n\n### Security\n- Accessible only to the authenticated session subject.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            consumes: ["multipart/form-data"],
            body: {
                type: "object",
                required: ["avatar"],
                properties: {
                    avatar: { type: "string", format: "binary", description: "Avatar image file" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        avatarUrl: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        },
        validatorCompiler: () => () => true
    }, async (request, reply) => {
        try {
            return proxyMultipart(request, reply, "/api/v1/users/me/avatar", USER_SERVICE_URL, { fileRequired: true });
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.put("/users/:id", {
        schema: {
            tags: ["Users"],
            summary: "Update user profile",
            description: "### Overview\nUpdates the profile details for a specific user.\n\n### Technical Details\n- Allows partial updates (PATCH-like behavior).\n- Validates that the requester has permission (Owner or Admin).\n\n### Side Effects\n- Updates the `updatedAt` timestamp.\n- May trigger a cache invalidation for the user profile.",
            consumes: ["multipart/form-data"],
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", description: "User ID (UUID)" }
                }
            },
            body: {
                type: "object",
                properties: {
                    username: { type: "string", minLength: 3 },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    bio: { type: "string" },
                    avatar: { type: "string", format: "binary", description: "Optional profile picture" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string" },
                        username: { type: "string" },
                        firstName: { type: "string", nullable: true },
                        lastName: { type: "string", nullable: true },
                        avatarUrl: { type: "string", nullable: true },
                        bio: { type: "string", nullable: true },
                        role: { type: "string" },
                        isOnline: { type: "boolean" },
                        isEmailVerified: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        },
        validatorCompiler: () => () => true
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            if (request.isMultipart()) {
                return proxyMultipart(request, reply, `/api/v1/users/${id}`, USER_SERVICE_URL, { fileRequired: false, method: 'PUT' });
            }
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/users/:id", {
        schema: {
            tags: ["Users"],
            summary: "Delete user",
            description: "### Overview\nDeletes a user account and all associated data.\n\n### Technical Details\n- Performs a permanent delete across multiple services (Auth, User, Recipe, etc.).\n- This is a destructive operation and cannot be undone.\n\n### Security\n- Requires Owner or Admin privileges.",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string" },
                        username: { type: "string" },
                        firstName: { type: "string", nullable: true },
                        lastName: { type: "string", nullable: true },
                        avatarUrl: { type: "string", nullable: true },
                        bio: { type: "string", nullable: true },
                        role: { type: "string" },
                        isOnline: { type: "boolean" },
                        isEmailVerified: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.put("/admin/users/:id/role", {
        schema: {
            tags: ["Admin"],
            summary: "Update user role",
            description: "### Overview\nUpdates the role of a specified user. This action is restricted to administrators. Note: Changing roles for existing Admins/Moderators requires Super Admin privileges.\n\n### Technical Details\n- Modifies the user's role in the database.\n- Roles: USER, MODERATOR, ADMIN.\n\n### Security\n- Requires Admin privileges (Super Admin if targeting an Admin).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "User ID" }
                }
            },
            body: {
                type: "object",
                required: ["role"],
                properties: {
                    role: { type: "string", enum: ["USER", "MODERATOR", "ADMIN"], description: "New role for the user" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string" },
                        role: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/admin/users/${id}/role`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/admin/users", {
        schema: {
            tags: ["Admin"],
            summary: "List all administrators and moderators",
            description: "### Overview\nLists all users with administrative or moderative roles.\n\n### Security\n- Restricted to users with ADMIN or MODERATOR roles.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            email: { type: "string" },
                            role: { type: "string" },
                            isSuperAdmin: { type: "boolean" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/admin/users", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/admin/users/:id/promote", {
        schema: {
            tags: ["Admin"],
            summary: "Promote user to Admin/Moderator",
            description: "### Overview\nPromotes a regular user to an administrative role.\n\n### Security\n- Restricted to Super Admin only.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            body: {
                type: "object",
                required: ["role"],
                properties: {
                    role: { type: "string", enum: ["ADMIN", "MODERATOR"] }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string" },
                        role: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/admin/users/${id}/promote`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/admin/users/:id/demote", {
        schema: {
            tags: ["Admin"],
            summary: "Demote admin to regular user",
            description: "### Overview\nRemoves administrative privileges from a user and resets them to the USER role.\n\n### Security\n- Restricted to Super Admin only.\n- Cannot demote a Super Admin.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string" },
                        role: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/admin/users/${id}/demote`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/:id/follow", {
        schema: {
            tags: ["Social"],
            summary: "Follow a user",
            description: "### Overview\nEstablishes a social subscription between the authenticated user and a target profile.\n\n### Technical Details\n- Inserts a directional link in the `Follows` relational table.\n- Implements a self-link safety check to prevent users from following their own accounts.\n\n### Side Effects\n- Dispatches a real-time 'new_follower' notification to the target user.\n- Updates the target user's 'Follower' leaderboard position.",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        followerId: { type: "string", format: "uuid" },
                        followingId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/follow`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/users/:id/follow", {
        schema: {
            tags: ["Social"],
            summary: "Unfollow a user",
            description: "### Overview\nTerminates a follow relationship.\n\n### Technical Details\n- Removes the specific record from the `Follows` table.\n\n### Side Effects\n- The unfollowed user will no longer see your updates in their feed (if applicable).",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        followerId: { type: "string", format: "uuid" },
                        followingId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/follow`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/me/followers", {
        schema: {
            tags: ["Social"],
            summary: "Get my followers",
            description: "### Overview\nRetrieves a list of users who are following the authenticated user.\n\n### Technical Details\n- Queries the `Follows` table where `followingId` is the current user.\n- Returns basic profile data for each follower.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string", nullable: true },
                            isOnline: { type: "boolean" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me/followers", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/me/following", {
        schema: {
            tags: ["Social"],
            summary: "Get people I follow",
            description: "### Overview\nRetrieves a list of users that the authenticated user is currently following.\n\n### Technical Details\n- Queries the `Follows` table where `followerId` is the current user.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string", nullable: true },
                            isOnline: { type: "boolean" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me/following", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/:id/followers", {
        schema: {
            tags: ["Social"],
            summary: "Get user's followers",
            description: "### Overview\nLists all users following a specific user profile.\n\n### Technical Details\n- Publicly accessible endpoint.\n- Returns basic profile summaries.",
            security: [{ apiKeyAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string", nullable: true },
                            isOnline: { type: "boolean" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/followers`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/:id/following", {
        schema: {
            tags: ["Social"],
            summary: "Get users followed by user",
            description: "### Overview\nLists all users that a specific user is currently following.",
            security: [{ apiKeyAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string", nullable: true },
                            isOnline: { type: "boolean" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/following`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/:id/is-following", {
        schema: {
            tags: ["Social"],
            summary: "Check if following",
            description: "### Overview\nVerifies if a follow relationship exists between the current user and another user.\n\n### Technical Details\n- Returns a boolean `isFollowing`.",
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
                    properties: {
                        isFollowing: { type: "boolean" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/is-following`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/friend-requests", {
        schema: {
            tags: ["Social"],
            summary: "Send friend request",
            description: "### Overview\nInitiates a formal friendship request to another user, requiring explicit approval.\n\n### Technical Details\n- Creates a high-priority `FriendRequest` record with `PENDING` status.\n- Performs an exhaustive check for existing friendships or blocked relationships.\n\n### Validation & Constraints\n- **Target**: Must be a valid, active user ID.\n\n### Side Effects\n- Triggers a system-level 'friend_request' notification and WebSocket event.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["receiverId"],
                properties: {
                    receiverId: { type: "string" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        senderId: { type: "string", format: "uuid" },
                        receiverId: { type: "string", format: "uuid" },
                        status: { type: "string" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/friend-requests", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.put("/users/friend-requests/:id/accept", {
        schema: {
            tags: ["Social"],
            summary: "Accept friend request",
            description: "### Overview\nApproves a pending friend request, establishing a mutual, bidirectional friendship.\n\n### Technical Details\n- Updates the `FriendRequest` status to `ACCEPTED`.\n- Synchronously creates bidirectional links in the `Friends` table for both parties.\n\n### Side Effects\n- Dispatches a real-time 'friendship_accepted' notification to the request initiator.\n- Unlocks direct messaging capabilities between the two users.",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        status: { type: "string" },
                        senderId: { type: "string", format: "uuid" },
                        receiverId: { type: "string", format: "uuid" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/friend-requests/${id}/accept`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.put("/users/friend-requests/:id/reject", {
        schema: {
            tags: ["Social"],
            summary: "Reject friend request",
            description: "### Overview\nDeclines a pending friend request.\n\n### Technical Details\n- Updates the request status to `REJECTED` or deletes the record (depending on policy).\n\n### Side Effects\n- The sender is NOT notified of the rejection (standard privacy practice).",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        status: { type: "string" },
                        senderId: { type: "string", format: "uuid" },
                        receiverId: { type: "string", format: "uuid" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/friend-requests/${id}/reject`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/users/friends/:friendId", {
        schema: {
            tags: ["Social"],
            summary: "Remove a friend",
            description: "### Overview\nEnds a mutual friendship between two users.\n\n### Technical Details\n- Removes the records from the `Friends` table.\n\n### Side Effects\n- Both users are removed from each other's friends lists.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                properties: {
                    friendId: { type: "string" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        message: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { friendId } = request.params as { friendId: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/friends/${friendId}`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/me/friends", {
        schema: {
            tags: ["Social"],
            summary: "Get my friends list",
            description: "### Overview\nRetrieves a list of all users who are currently friends with the authenticated user.\n\n### Technical Details\n- Returns basic profile data and online status for each friend.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string", nullable: true },
                            isOnline: { type: "boolean" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me/friends", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/me/friend-requests", {
        schema: {
            tags: ["Social"],
            summary: "Get pending friend requests",
            description: "### Overview\nLists all incoming friend requests that are currently in a `PENDING` state.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            senderId: { type: "string", format: "uuid" },
                            receiverId: { type: "string", format: "uuid" },
                            status: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            sender: {
                                type: "object",
                                properties: {
                                    id: { type: "string", format: "uuid" },
                                    username: { type: "string" },
                                    avatarUrl: { type: "string", nullable: true }
                                }
                            }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me/friend-requests", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/me/friend-requests/sent", {
        schema: {
            tags: ["Social"],
            summary: "Get sent friend requests",
            description: "### Overview\nLists all outgoing friend requests that are currently in a `PENDING` state.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            senderId: { type: "string", format: "uuid" },
                            receiverId: { type: "string", format: "uuid" },
                            status: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            receiver: {
                                type: "object",
                                properties: {
                                    id: { type: "string", format: "uuid" },
                                    username: { type: "string" },
                                    avatarUrl: { type: "string", nullable: true }
                                }
                            }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me/friend-requests/sent", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/users/friend-requests/:id/cancel", {
        schema: {
            tags: ["Social"],
            summary: "Cancel a sent friend request",
            description: "### Overview\nCancels a friend request that was sent by the authenticated user.",
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
                    properties: {
                        message: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/friend-requests/${id}/cancel`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/:id/block", {
        schema: {
            tags: ["Social"],
            summary: "Block a user",
            description: "### Overview\nTerminates all social interaction possibilities between the authenticated user and a target.\n\n### Technical Details\n- Inserts an entry in the `Blocks` table.\n- Performs an atomic cleanup: removes existing follows and friendships between the users.\n\n### Side Effects\n- Immediately hides the user from search results and feeds for the blocker.\n- Invalidate active peer-to-peer WebSocket rooms.",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        blockerId: { type: "string", format: "uuid" },
                        blockedId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/block`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.delete("/users/:id/block", {
        schema: {
            tags: ["Social"],
            summary: "Unblock a user",
            description: "### Overview\nRemoves a block restriction, allowing the user to interact with you again.\n\n### Technical Details\n- Deletes the record from the `Blocks` table.",
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
                    properties: {
                        id: { type: "string", format: "uuid" },
                        blockerId: { type: "string", format: "uuid" },
                        blockedId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/block`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/me/blocked", {
        schema: {
            tags: ["Social"],
            summary: "Get blocked users",
            description: "### Overview\nRetrieves a list of all users you have currently blocked.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            username: { type: "string" },
                            avatarUrl: { type: "string" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/me/blocked", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/api-key/generate", {
        schema: {
            tags: ["Users"],
            summary: "Generate API Key",
            description: "### Overview\nGenerates a unique API key for the user to access the platform programmatically.\n\n### Technical Details\n- Generates a secure random string.\n- Stores the hashed version in the database.\n- Returns the plain key ONLY ONCE upon generation.\n\n### Security\n- Requires active session. Treat the API key as a password.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        apiKey: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/users/api-key/generate", USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.get("/users/:id/export-data", {
        schema: {
            tags: ["GDPR"],
            summary: "Export user data",
            description: "### Overview\nComplies with GDPR 'Right of Access' by generating a portable, machine-readable archive of all user-associated data.\n\n### Technical Details\n- Aggregates structured data from Auth, User, Recipe, Chat, and Notification microservices.\n- Sanitizes and package metadata into a secure JSON download.\n\n### Security\n- Strictly limited to the authenticated subject profile.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "User ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        exportDate: { type: "string" },
                        profile: { type: "object" },
                        social: { type: "object" },
                        content: { type: "object" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/export-data`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/users/:id/request-deletion", {
        schema: {
            tags: ["GDPR"],
            summary: "Request account deletion",
            description: "### Overview\nInitiates the account deletion process.\n\n### Technical Details\n- Creates a secure deletion token.\n- Sends a confirmation email to the user.\n- Token expires after 24 hours.\n\n### Security\n- Users can only request deletion of their own account.\n- Deletion requires email confirmation.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "User ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        message: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/request-deletion`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });
    app.get("/users/:id/gamification", {
        schema: {
            tags: ["Users"],
            summary: "Get user gamification profile",
            description: "### Overview\nExposes the user's progression metrics, including experience points (XP), levels, and earned accolades.\n\n### Technical Details\n- Performs dynamic level calculation based on the current XP threshold algorithm.\n- Aggregates hard-earned badges with their corresponding metadata and iconography.\n\n### Side Effects\n- Used to determine eligibility for restricted community features or tiers.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "User ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string" },
                        xp: { type: "integer", description: "Total Experience Points" },
                        level: { type: "integer", description: "Current Level" },
                        badges: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    awardedAt: { type: "string", format: "date-time" },
                                    badge: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            slug: { type: "string" },
                                            name: { type: "string" },
                                            description: { type: "string" },
                                            iconUrl: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { statusCode, body } = await proxyRequest(request, reply, `/api/v1/users/${id}/gamification`, USER_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "User service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });
}
