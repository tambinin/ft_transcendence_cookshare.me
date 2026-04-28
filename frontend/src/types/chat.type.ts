interface Message {
	id: string;
	content: string;
	isRead: boolean;
	readAt: string | null;
	createdAt: string;
	senderId: string;
	conversationId: string;
}

interface ConversationParticipant {
	id: string;
	lastReadAt: string | null;
	joinedAt: string;
	userId: string;
	conversationId: string;
}

interface Conversation {
	id: string;
	createdAt: string;
	updatedAt: string;
	participants: ConversationParticipant[];
	messages: Message[];
}

interface ConversationPreview {
	conversationId: string;
	otherUserId: string;
	otherUsername: string;
	otherAvatarUrl: string | null;
	isOnline: boolean;
	lastMessage: string;
	lastMessageDate: string;
	unreadCount: number;
}


interface MarkAsReadResponse {
	markedCount: number;
	messageIds: string[];
}

interface UnreadCountResponse {
	unreadCount: number;
}

// ─── WebSocket event payloads ───

interface NewMessageEvent {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: string;
}

interface MessagesReadEvent {
	conversationId: string;
	messageIds: string[];
	readBy: string;
	readAt: string;
}

interface TypingEvent {
	senderId: string;
}

export type {
	Message,
	ConversationParticipant,
	Conversation,
	ConversationPreview,
	MarkAsReadResponse,
	UnreadCountResponse,
	NewMessageEvent,
	MessagesReadEvent,
	TypingEvent,
};