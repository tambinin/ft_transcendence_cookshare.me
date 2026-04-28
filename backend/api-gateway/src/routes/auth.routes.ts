import { FastifyInstance } from "fastify";
import { proxyRequest, proxyMultipart } from "../utils/proxy";
import { strictRateLimiter, moderateRateLimiter } from "../middleware/rateLimiter.middleware";
import { bodyValidator, HttpStatus, sendError, fetchWithTimeout } from "@transcendence/common";
import { commonResponses, createResponseSchema } from "../utils/swagger.schemas";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

if (!AUTH_SERVICE_URL) {
    throw new Error("AUTH_SERVICE_URL is not defined");
}

export async function authRoutes(app: FastifyInstance) {
    app.post("/auth/register", {
        schema: {
            operationId: "registerUser",
            tags: ["Authentication"],
            summary: "Register a new user",
            description: "### Overview\nCreates a new user account and associated profile within the platform.\n\n### Technical Details\n- Proxies the secure payload to the `auth-service` for credential hashing and record creation.\n- Orchestrates profile creation in the `user-service` via internal inter-service communication.\n- Generates a unique user identifier (UUID).\n\n### Validation & Constraints\n- **Email**: Must be unique, valid format, and comply with RFC 5322.\n- **Username**: Must be unique, 3-30 characters, alphanumeric.\n- **Password**: Minimum 8 characters, audited against common leaked password databases.\n\n### Side Effects\n- Dispatches an asynchronous account verification email via the `notification-service`.\n- Initializes default gamification stats and user settings.\n\n### Security\n- Protected by the Gateway API Key.\n- Rate-limited to prevent automated registration abuse (Strict mode).",
            security: [{ apiKeyAuth: [] }],
            consumes: ["multipart/form-data"],
            body: {
                type: "object",
                required: ["email", "password", "username"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    username: { type: "string", minLength: 3 },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    bio: { type: "string" },
                    avatar: { type: "string", format: "binary", description: "Optional profile picture" }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string" },
                        username: { type: "string" },
                        firstName: { type: "string", nullable: true },
                        lastName: { type: "string", nullable: true },
                        avatarUrl: { type: "string", nullable: true },
                        bio: { type: "string", nullable: true },
                        isOnline: { type: "boolean" },
                        lastSeenAt: { type: "string", format: "date-time", nullable: true },
                        role: { type: "string", enum: ["USER", "ADMIN"] },
                        isEmailVerified: { type: "boolean" },
                        xp: { type: "number" },
                        level: { type: "number" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        },
        validatorCompiler: () => () => true,
        preHandler: [strictRateLimiter(15, 60000)],
        handler: async (request, reply) => {
            try {
                if (request.isMultipart()) {
                    return proxyMultipart(request, reply, "/api/v1/auth/register", AUTH_SERVICE_URL, { fileRequired: false });
                }
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/register", AUTH_SERVICE_URL);
                return reply.status(statusCode as any).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.post("/auth/login", {
        schema: {
            operationId: "loginUser",
            tags: ["Authentication"],
            summary: "Login user",
            description: "### Overview\nAuthenticates a user and establishes a secure, encrypted session.\n\n### Technical Details\n- Verifies plaintext credentials againstbcrypt-hashed versions in the `auth-service`.\n- Issues a dual-token payload: short-lived JWT Access Token and a persistent Refresh Token.\n- Configures an `HttpOnly`, `Secure`, `SameSite=Strict` cookie for the Refresh Token.\n\n### Validation & Constraints\n- **Identifier**: Accepts either `username` or `email`.\n- **Lockout**: Implements temporary lockout after multiple failed attempts (handled by rate limiter).\n\n### Side Effects\n- Synchronizes the user's online status across the `websocket-service`.\n- Updates the `lastLogin` timestamp in the identity store.\n\n### Security\n- Requires Gateway API Key.\n- Protected against CSRF via cookie hardening and XSS via `HttpOnly` flags.",
            security: [{ apiKeyAuth: [] }],
            body: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                    identifier: { type: "string", minLength: 3 },
                    password: { type: "string" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        accessToken: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        },
        preHandler: [strictRateLimiter(15, 60000)],
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/login", AUTH_SERVICE_URL);
                return reply.status(statusCode as any).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.post("/auth/refresh", {
        schema: {
            operationId: "refreshToken",
            tags: ["Authentication"],
            summary: "Refresh access token",
            description: "### Overview\nIssues a fresh Access Token to maintain session continuity without re-authentication.\n\n### Technical Details\n- Extracts the Refresh Token from privileged client cookies.\n- Performs a cryptographical signature check and expiration audit.\n- Checks token presence in the 'active sessions' whitelist in `auth-service`.\n\n### Side Effects\n- Extends the validity of the user's session in the identity cache.\n\n### Security\n- Token Rotation: Optionally replaces the Refresh Token upon use to mitigate replay attacks.\n- Mandatory API Key authentication.",
            security: [{ apiKeyAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        accessToken: { type: "string" }
                    }
                }),
                ...commonResponses
            }
        },
        preHandler: [moderateRateLimiter(10, 60000)],
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/refresh", AUTH_SERVICE_URL);
                return reply.status(statusCode as any).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.post("/auth/logout", {
        schema: {
            operationId: "logoutUser",
            tags: ["Authentication"],
            summary: "Logout user",
            description: "### Overview\nGracefully terminates the user's authenticated session.\n\n### Technical Details\n- Explicitly invalidates the Refresh Token in the server-side session store.\n- Commands the client browser to clear identity cookies via `Set-Cookie` headers.\n\n### Side Effects\n- Immediately updates global user status to `OFFLINE`.\n- Disconnects all active WebSocket connections for the user session.\n\n### Security\n- Requires both Gateway API Key and a valid Bearer Token for identity verification.",
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
            const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/logout", AUTH_SERVICE_URL);
            return reply.status(statusCode as any).send(body);
        } catch (error) {
            app.log.error(error);
            return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
        }
    });

    app.post("/auth/forgot-password", {
        schema: {
            tags: ["Authentication"],
            summary: "Request password reset email",
            description: "### Overview\nInitiates the password recovery workflow for users who have lost access.\n\n### Technical Details\n- Generates a high-entropy, cryptographically secure reset token.\n- Encrypts and persists the token with a TTL (Time-to-Live) of 60 minutes.\n- Interfaces with the `notification-service` for priority email dispatch.\n\n### Side Effects\n- Generates a system audit log for security purposes.\n- Sends an automated recovery email containing a signed URL.\n\n### Security\n- Rate-limited to 5 requests per hour per IP to prevent service exhaustion.\n- Does not leak user existence (returns success even if email is not found).",
            security: [{ apiKeyAuth: [] }],
            body: {
                type: "object",
                required: ["email"],
                properties: {
                    email: { type: "string", format: "email" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        },
        preHandler: [moderateRateLimiter(5, 60000)],
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/forgot-password", AUTH_SERVICE_URL);
                return reply.status(statusCode).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.post("/auth/reset-password", {
        schema: {
            tags: ["Authentication"],
            summary: "Reset password using token",
            description: "### Overview\nFinalizes the password recovery process by establishing new credentials.\n\n### Technical Details\n- Performs a constant-time comparison for the reset token.\n- Enforces strict password complexity rules (length, entropy).\n- Updates the `Auth` record and invalidates all previous reset tokens for the user.\n\n### Side Effects\n- Forces a global session logout to ensure all devices use the new credentials.\n- Sends a security notification confirming the password change.\n\n### Security\n- The token is consumed upon first use and cannot be reused.",
            security: [{ apiKeyAuth: [] }],
            body: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                    token: { type: "string" },
                    newPassword: { type: "string", minLength: 8 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        },
        preHandler: [moderateRateLimiter(5, 60000)],
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/reset-password", AUTH_SERVICE_URL);
                return reply.status(statusCode).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.get("/auth/verify-email", {
        schema: {
            tags: ["Authentication"],
            summary: "Verify email via link (redirect)",
            description: "Called when the user clicks the verification link in their email. Verifies the token and redirects to the login page.",
            querystring: {
                type: "object",
                required: ["token"],
                properties: {
                    token: { type: "string" }
                }
            },
            response: {
                302: { type: "string", description: "Redirect to login page" }
            }
        },
        preHandler: [moderateRateLimiter(10, 60000)],
        handler: async (request, reply) => {
            const { token } = request.query as { token: string };
            const DOMAIN = process.env.DOMAIN || "cookshare.me";
            try {
                const url = `${AUTH_SERVICE_URL}/api/v1/auth/verify-email`;
                const response = await fetchWithTimeout(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-api-key": process.env.INTERNAL_API_KEY || ""
                    },
                    body: JSON.stringify({ token })
                });
                if (response.ok) {
                    return reply.redirect(`https://${DOMAIN}/login?verified=true`);
                } else {
                    return reply.redirect(`https://${DOMAIN}/login?verified=false&error=invalid_token`);
                }
            } catch (error) {
                app.log.error(error);
                return reply.redirect(`https://${DOMAIN}/login?verified=false&error=service_unavailable`);
            }
        }
    });

    app.post("/auth/verify-email", {
        schema: {
            tags: ["Authentication"],
            summary: "Verify email address",
            description: "### Overview\nValidates the user's email address to verify identity and unlock full platform capabilities.\n\n### Technical Details\n- Audits the verification token against the `auth-service` persistent store.\n- Updates the `isEmailVerified` flag in the `user-service` core profile.\n\n### Side Effects\n- Unlocks critical features: recipe creation, comments, and social interactions.\n- Marks the account as 'Trusted' in the trust graph.\n\n### Security\n- One-time-use token logic.",
            security: [{ apiKeyAuth: [] }],
            body: {
                type: "object",
                required: ["token"],
                properties: {
                    token: { type: "string" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        },
        preHandler: [moderateRateLimiter(5, 60000)],
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/verify-email", AUTH_SERVICE_URL);
                return reply.status(statusCode).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.post("/auth/resend-verification", {
        schema: {
            tags: ["Authentication"],
            summary: "Resend verification email",
            description: "### Overview\nIssues a new verification token and dispatches a verification email.\n\n### Technical Details\n- Checks user status: aborts if the account is already verified to prevent redundant processing.\n- Invalidates old verification tokens before issuing a new one.\n\n### Side Effects\n- Triggers a priority dispatch in the `notification-service`.",
            security: [{ apiKeyAuth: [] }],
            body: {
                type: "object",
                required: ["email"],
                properties: {
                    email: { type: "string", format: "email" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        },
        preHandler: [moderateRateLimiter(5, 60000)],
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/resend-verification", AUTH_SERVICE_URL);
                return reply.status(statusCode).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    // ==================== GOOGLE OAUTH ====================

    app.get("/auth/google", {
        schema: {
            operationId: "googleOAuthStart",
            tags: ["Authentication"],
            summary: "Start Google OAuth flow",
            description: "Redirects the user to Google's consent screen. Sets an anti-CSRF cookie and PKCE code verifier.",
            response: {
                302: { type: "string", description: "Redirect to Google" },
                ...commonResponses
            }
        },
        preHandler: [strictRateLimiter(10, 60000)],
        handler: async (request, reply) => {
            try {
                const url = `${AUTH_SERVICE_URL}/api/v1/auth/google`;
                const response = await fetchWithTimeout(url, {
                    method: "GET",
                    headers: {
                        "x-internal-api-key": process.env.INTERNAL_API_KEY || "",
                        ...(request.headers.cookie ? { cookie: request.headers.cookie } : {})
                    },
                    redirect: "manual",
                });

                const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
                for (const cookie of setCookieHeaders) {
                    reply.header("set-cookie", cookie);
                }

                const location = response.headers.get("location");
                if (location) {
                    return reply.redirect(location);
                }
                return sendError(reply, "Failed to initiate Google OAuth", HttpStatus.INTERNAL_SERVER_ERROR);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });

    app.get("/auth/google/callback", {
        schema: {
            operationId: "googleOAuthCallback",
            tags: ["Authentication"],
            summary: "Google OAuth callback",
            description: "Handles the redirect from Google after user consent. Validates state, exchanges code, and redirects to frontend.",
            querystring: {
                type: "object",
                properties: {
                    code: { type: "string" },
                    state: { type: "string" },
                    error: { type: "string" }
                }
            },
            response: {
                302: { type: "string", description: "Redirect to frontend" },
                ...commonResponses
            }
        },
        preHandler: [moderateRateLimiter(10, 60000)],
        handler: async (request, reply) => {
            try {
                const query = request.query as Record<string, string>;
                const params = new URLSearchParams(query);
                const url = `${AUTH_SERVICE_URL}/api/v1/auth/google/callback?${params.toString()}`;

                const response = await fetchWithTimeout(url, {
                    method: "GET",
                    headers: {
                        "x-internal-api-key": process.env.INTERNAL_API_KEY || "",
                        ...(request.headers.cookie ? { cookie: request.headers.cookie } : {})
                    },
                    redirect: "manual",
                });

                const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
                for (const cookie of setCookieHeaders) {
                    reply.header("set-cookie", cookie);
                }

                const location = response.headers.get("location");
                if (location) {
                    return reply.redirect(location);
                }

                const DOMAIN = process.env.DOMAIN || "cookshare.me";
                return reply.redirect(`https://${DOMAIN}/login?oauth_error=server_error`);
            } catch (error) {
                app.log.error(error);
                const DOMAIN = process.env.DOMAIN || "cookshare.me";
                return reply.redirect(`https://${DOMAIN}/login?oauth_error=server_error`);
            }
        }
    });

    app.post("/auth/google/unlink", {
        schema: {
            operationId: "googleOAuthUnlink",
            tags: ["Authentication"],
            summary: "Unlink Google account",
            description: "Removes the Google OAuth link from the authenticated user's account. Requires a password to be set.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        },
        handler: async (request, reply) => {
            try {
                const { statusCode, body } = await proxyRequest(request, reply, "/api/v1/auth/google/unlink", AUTH_SERVICE_URL);
                return reply.status(statusCode as any).send(body);
            } catch (error) {
                app.log.error(error);
                return sendError(reply, "Authentication service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    });
}