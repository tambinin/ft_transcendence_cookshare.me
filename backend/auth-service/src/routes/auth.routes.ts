import { FastifyInstance } from "fastify";
import { bodyValidator, authMiddleware } from "@transcendence/common";
import {
    registerHandler,
    loginHandler,
    refreshHandler,
    logoutHandler,
    resetPasswordHandler,
    forgotPasswordHandler,
    verifyEmailHandler,
    resendVerificationHandler,
    loginSchema,
    resetPasswordSchema,
    emailSchema,
    tokenSchema
} from "../controllers/auth.controller";
import {
    googleAuthHandler,
    googleCallbackHandler,
    googleUnlinkHandler,
} from "../controllers/oauth.controller";

export async function authRoutes(app: FastifyInstance) {
    app.post("/auth/register", registerHandler);

    app.post("/auth/login", {
        preHandler: bodyValidator(loginSchema)
    }, loginHandler);

    app.post("/auth/refresh", refreshHandler);

    app.post("/auth/logout", {
        preHandler: [authMiddleware]
    }, logoutHandler);

    app.post("/auth/reset-password", {
        preHandler: bodyValidator(resetPasswordSchema)
    }, resetPasswordHandler);

    app.post("/auth/forgot-password", {
        preHandler: bodyValidator(emailSchema)
    }, forgotPasswordHandler);

    app.post("/auth/verify-email", {
        preHandler: bodyValidator(tokenSchema)
    }, verifyEmailHandler);

    app.post("/auth/resend-verification", {
        preHandler: bodyValidator(emailSchema)
    }, resendVerificationHandler);

    app.get("/auth/google", googleAuthHandler);

    app.get("/auth/google/callback", googleCallbackHandler);

    app.post("/auth/google/unlink", {
        preHandler: [authMiddleware]
    }, googleUnlinkHandler);
}