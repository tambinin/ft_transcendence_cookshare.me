import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendResetPasswordEmail, sendVerificationEmail, sendDeletionConfirmationEmail } from "../services/email.service";
import {
    createNotification,
    deleteNotification,
    getNotifications,
    markAllAsRead,
    markAsRead
} from "../services/notification.service";
import {
    sendSuccess,
    ForbiddenError,
    NotificationType
} from "@transcendence/common";

export const resetEmailSchema = z.object({
    email: z.string().email(),
    resetToken: z.string().min(1)
});

export const verifyEmailSchema = z.object({
    email: z.string().email(),
    verificationToken: z.string().min(1)
});

export const deletionEmailSchema = z.object({
    email: z.string().email(),
    deletionToken: z.string().min(1),
    username: z.string().min(1)
});

export const createNotificationSchema = z.object({
    userId: z.string().min(1),
    type: z.nativeEnum(NotificationType),
    title: z.string().min(1),
    message: z.string().min(1),
    data: z.record(z.string(), z.any()).optional()
});

// ==================== EMAIL HANDLERS ====================

export async function sendResetEmailHandler(request: FastifyRequest, reply: FastifyReply) {
    const { email, resetToken } = request.body as z.infer<typeof resetEmailSchema>;
    await sendResetPasswordEmail(email, resetToken);
    sendSuccess(reply, {}, 'Email sent');
}

export async function sendVerificationEmailHandler(request: FastifyRequest, reply: FastifyReply) {
    const { email, verificationToken } = request.body as z.infer<typeof verifyEmailSchema>;
    await sendVerificationEmail(email, verificationToken);
    sendSuccess(reply, {}, 'Verification email sent');
}

export async function sendDeletionEmailHandler(request: FastifyRequest, reply: FastifyReply) {
    const { email, deletionToken, username } = request.body as z.infer<typeof deletionEmailSchema>;
    await sendDeletionConfirmationEmail(email, deletionToken, username);
    sendSuccess(reply, {}, 'Deletion confirmation email sent');
}

// ==================== NOTIFICATION HANDLERS ====================

export async function getNotificationsHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenError("Authentication required");

    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const result = await getNotifications(userId, Number(page), Number(limit));
    sendSuccess(reply, result, 'Notifications retrieved successfully');
}

export async function markAsReadHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenError("Authentication required");

    const { id } = request.params as { id: string };
    await markAsRead(id, userId);
    sendSuccess(reply, {}, 'Notification marked as read successfully');
}

export async function markAllAsReadHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenError("Authentication required");

    await markAllAsRead(userId);
    sendSuccess(reply, {}, 'All notifications marked as read successfully');
}

export async function deleteNotificationHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenError("Authentication required");

    const { id } = request.params as { id: string };
    await deleteNotification(id, userId);
    sendSuccess(reply, {}, 'Notification deleted successfully');
}

export async function createInternalNotificationHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId, type, title, message, data } = request.body as z.infer<typeof createNotificationSchema>;
    const notification = await createNotification(userId, type, title, message, data);
    sendSuccess(reply, notification, 'Notification created successfully');
}