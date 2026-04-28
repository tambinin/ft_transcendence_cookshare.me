import api from './api.client';
import { NOTIFICATION } from '../constants/notification.const';
import type { ApiResponse } from '../types/api.type';
import type {
	NotificationListResponse,
	NotificationResponse,
	UnreadCountResponse,
} from '../types/notification.type';

interface GetNotificationsParams {
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
}

const notificationService = {
	async getNotifications(params: GetNotificationsParams = {}): Promise<NotificationListResponse> {
		const queryParams = new URLSearchParams();
		if (params.page) queryParams.append('page', params.page.toString());
		if (params.limit) queryParams.append('limit', params.limit.toString());
		if (params.unreadOnly) queryParams.append('unreadOnly', 'true');

		const query = queryParams.toString();
		const url = query ? `${NOTIFICATION.BASE}?${query}` : NOTIFICATION.BASE;

		const response = await api.get<NotificationListResponse>(url);
		return response.data;
	},

	async markAsRead(notificationId: string): Promise<NotificationResponse> {
		const response = await api.put<NotificationResponse>(NOTIFICATION.MARK_READ(notificationId));
		return response.data;
	},

	async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
		const response = await api.put<ApiResponse<{ message: string }>>(NOTIFICATION.MARK_ALL_READ);
		return response.data;
	},

	async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
		const response = await api.delete<ApiResponse<{ message: string }>>(NOTIFICATION.DELETE(notificationId));
		return response.data;
	},
	
	async getUnreadCount(): Promise<UnreadCountResponse> {
		const response = await api.get<UnreadCountResponse>(NOTIFICATION.UNREAD_COUNT);
		return response.data;
	},
};

export default notificationService;
