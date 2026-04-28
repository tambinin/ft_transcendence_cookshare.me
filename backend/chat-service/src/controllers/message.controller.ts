import { FastifyRequest, FastifyReply } from "fastify";
import { createMessage, getMessages, getConversations, markMessagesAsRead, getUnreadCount } from "../services/message.service";
import { sendSuccess, sendCreated, BadRequestError } from "@transcendence/common";
import { z } from "zod";

const createMessageSchema = z.object({
    receiverId: z.string().min(1),
    content: z.string().min(1)
});

export async function sendMessageController(request: FastifyRequest, reply: FastifyReply) {
    const senderId = request.user.id;
    const body = createMessageSchema.parse(request.body);

    if (senderId === body.receiverId) {
        throw new BadRequestError("Cannot send message to self");
    }

    const message = await createMessage(senderId, body.receiverId, body.content);
    sendCreated(reply, message, "Message sent successfully");
}

export async function getMessagesController(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const { otherUserId } = request.params as { otherUserId: string };

    const messages = await getMessages(userId, otherUserId);
    sendSuccess(reply, messages, "Messages retrieved successfully");
}

export async function markAsReadController(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const { conversationId } = request.params as { conversationId: string };

    const result = await markMessagesAsRead(userId, conversationId);
    sendSuccess(reply, result, "Messages marked as read");
}

export async function getConversationsController(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const conversations = await getConversations(userId);
    sendSuccess(reply, conversations, "Conversations retrieved successfully");
}

export async function getUnreadCountController(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;

    const result = await getUnreadCount(userId);
    sendSuccess(reply, result, "Unread count retrieved");
}
