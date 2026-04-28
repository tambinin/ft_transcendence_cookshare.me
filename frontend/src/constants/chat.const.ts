export const CHAT = {
	SEND: 'messages',
	CONVERSATIONS: 'conversations',
	MESSAGES: (otherUserId: string) => `messages/${otherUserId}`,
	MARK_READ: (conversationId: string) => `messages/${conversationId}/read`,
	UNREAD_COUNT: 'messages/unread/count',
} as const;
