import db from "../utils/dbPlugin";
import { notifyUser } from "../utils/websocket.util";
import { NotFoundError, ForbiddenError, validateEnv, fetchWithTimeout } from "@transcendence/common";
import pino from "pino";

const logger = pino({ name: 'chat-service:message' });

const env = validateEnv();

// Use Docker service hostname from Vault env var, with fallback
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${env.USER_SERVICE_PORT}`;

export async function createMessage(senderId: string, receiverId: string, content: string) {
    try {
        const userServiceUrl = `${USER_SERVICE_URL}/api/v1/internal/users/${senderId}/block-status/${receiverId}`;
        const response = await fetchWithTimeout(userServiceUrl, {
            headers: { 'x-internal-api-key': env.INTERNAL_API_KEY }
        });
        const result = await response.json();

        if (result.status === 'success') {
            if (result.data.isBlockedBy) {
                throw new ForbiddenError("You cannot send messages to this user (Blocked)");
            }
            if (result.data.hasBlocked) {
                throw new ForbiddenError("You strictly blocked this user. Unblock to send message.");
            }
        }
    } catch (error) {
        if (error instanceof ForbiddenError) throw error;
        logger.error({ err: error, senderId, receiverId }, "Failed to check block status");
    }

    let conversation = await db.conversation.findFirst({
        where: {
            AND: [
                { participants: { some: { userId: senderId } } },
                { participants: { some: { userId: receiverId } } }
            ]
        },
        include: { participants: true }
    });

    if (!conversation) {
        conversation = await db.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: senderId },
                        { userId: receiverId }
                    ]
                }
            },
            include: { participants: true }
        });
    }

    const message = await db.message.create({
        data: {
            senderId,
            conversationId: conversation.id,
            content
        }
    });

    await notifyUser(receiverId, 'new_message', {
        id: message.id,
        conversationId: conversation.id,
        senderId,
        content,
        createdAt: message.createdAt
    });

    return message;
}

export async function getMessages(userId: string, otherUserId: string) {
    const conversation = await db.conversation.findFirst({
        where: {
            AND: [
                { participants: { some: { userId: userId } } },
                { participants: { some: { userId: otherUserId } } }
            ]
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });

    return conversation?.messages || [];
}

export async function markMessagesAsRead(userId: string, conversationId: string) {
    const conversation = await db.conversation.findFirst({
        where: {
            id: conversationId,
            participants: { some: { userId } }
        },
        include: { participants: true }
    });

    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }

    const unreadMessages = await db.message.findMany({
        where: {
            conversationId,
            senderId: { not: userId },
            isRead: false
        }
    });

    if (unreadMessages.length === 0) {
        return { markedCount: 0, messageIds: [] };
    }

    const messageIds = unreadMessages.map(m => m.id);
    const senderIds = [...new Set(unreadMessages.map(m => m.senderId))];

    await db.message.updateMany({
        where: {
            id: { in: messageIds }
        },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });

    for (const senderId of senderIds) {
        const senderMessageIds = unreadMessages
            .filter(m => m.senderId === senderId)
            .map(m => m.id);

        await notifyUser(senderId, 'messages_read', {
            conversationId,
            messageIds: senderMessageIds,
            readBy: userId,
            readAt: new Date().toISOString()
        });
    }

    return { markedCount: messageIds.length, messageIds };
}

export async function getConversations(userId: string) {
    const userConversations = await db.conversation.findMany({
        where: {
            participants: { some: { userId } }
        },
        include: {
            participants: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const conversations = await Promise.all(
        userConversations
            .filter(c => c.messages.length > 0)
            .map(async (conv) => {
                const otherParticipant = conv.participants.find(p => p.userId !== userId);
                if (!otherParticipant) return null;

                const unreadCount = await db.message.count({
                    where: {
                        conversationId: conv.id,
                        senderId: { not: userId },
                        isRead: false
                    }
                });

                const lastMsg = conv.messages[0];

                let otherUser = { username: 'Unknown', avatarUrl: null, isOnline: false };
                try {
                    const userServiceUrl = `${USER_SERVICE_URL}/api/v1/internal/users/${otherParticipant.userId}`;
                    const response = await fetchWithTimeout(userServiceUrl, {
                        headers: { 'x-internal-api-key': env.INTERNAL_API_KEY }
                    });
                    if (response.ok) {
                        const result = await response.json();
                        otherUser = result.data || otherUser;
                    }
                } catch (error) {
                    logger.error({ err: error, userId: otherParticipant.userId }, 'Failed to fetch user');
                }

                return {
                    conversationId: conv.id,
                    otherUserId: otherParticipant.userId,
                    otherUsername: otherUser.username,
                    otherAvatarUrl: otherUser.avatarUrl,
                    isOnline: otherUser.isOnline,
                    lastMessage: lastMsg.content,
                    lastMessageDate: lastMsg.createdAt.toISOString(),
                    unreadCount,
                };
            })
    );

    return conversations.filter(Boolean);
}

export async function getUnreadCount(userId: string) {
    const conversations = await db.conversation.findMany({
        where: {
            participants: { some: { userId } }
        },
        select: { id: true }
    });

    const conversationIds = conversations.map(c => c.id);

    const unreadCount = await db.message.count({
        where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            isRead: false
        }
    });

    return { unreadCount };
}
