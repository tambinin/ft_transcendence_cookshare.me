import { FastifyInstance } from "fastify";
import {
    sendResetEmailHandler,
    sendVerificationEmailHandler,
    sendDeletionEmailHandler,
    getNotificationsHandler,
    markAsReadHandler,
    markAllAsReadHandler,
    deleteNotificationHandler,
    createInternalNotificationHandler,
    resetEmailSchema,
    verifyEmailSchema,
    deletionEmailSchema,
    createNotificationSchema
} from "../controllers/notification.controller";
import { authMiddleware, bodyValidator } from "@transcendence/common";

export async function notificationRoutes(app: FastifyInstance) {

    // Internal Email Routes
    app.post("/internal/send-reset-email", {
        preHandler: bodyValidator(resetEmailSchema)
    }, sendResetEmailHandler);

    app.post("/internal/send-verification-email", {
        preHandler: bodyValidator(verifyEmailSchema)
    }, sendVerificationEmailHandler);

    app.post("/internal/send-deletion-email", {
        preHandler: bodyValidator(deletionEmailSchema)
    }, sendDeletionEmailHandler);

    // Notification Routes
    app.get("/notifications", { preHandler: authMiddleware }, getNotificationsHandler);

    app.put("/notifications/:id/read", { preHandler: authMiddleware }, markAsReadHandler);

    app.put("/notifications/read-all", { preHandler: authMiddleware }, markAllAsReadHandler);

    app.delete("/notifications/:id", { preHandler: authMiddleware }, deleteNotificationHandler);

    // Internal Notification Creation
    app.post("/internal/notifications", {
        preHandler: bodyValidator(createNotificationSchema)
    }, createInternalNotificationHandler);
}