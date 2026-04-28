import api from './api.client';
import { CHAT } from '../constants/chat.const';
import type {
	Message,
	ConversationPreview,
	MarkAsReadResponse,
	UnreadCountResponse,
} from '../types/chat.type';

interface ApiResponse<T> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}

const chatService = {
	async getConversations(): Promise<ConversationPreview[]> {
		const response = await api.get<ApiResponse<ConversationPreview[]>>(CHAT.CONVERSATIONS);
		const data = response.data.data;
		return Array.isArray(data) ? data : [];
	},

	async sendMessage(receiverId: string, content: string): Promise<Message> {
		const response = await api.post<ApiResponse<Message>>(CHAT.SEND, {
			receiverId,
			content,
		});
		return response.data.data;
	},

	async getMessages(otherUserId: string): Promise<Message[]> {
		const response = await api.get<ApiResponse<Message[]>>(
			CHAT.MESSAGES(otherUserId)
		);
		const data = response.data.data;
		return Array.isArray(data) ? data : [];
	},

	async markAsRead(conversationId: string): Promise<MarkAsReadResponse> {
		const response = await api.put<ApiResponse<MarkAsReadResponse>>(
			CHAT.MARK_READ(conversationId)
		);
		return response.data.data;
	},

	async getUnreadCount(): Promise<number> {
		const response = await api.get<ApiResponse<UnreadCountResponse>>(
			CHAT.UNREAD_COUNT
		);
		return response.data.data.unreadCount;
	},
};

export default chatService;
