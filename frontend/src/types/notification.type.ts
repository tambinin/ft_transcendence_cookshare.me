import type { ApiResponse } from './api.type';

export type NotificationType = 
	| 'NEW_FOLLOWER'
	| 'FRIEND_REQUEST'
	| 'NEW_FRIEND_REQUEST'
	| 'FRIEND_REQUEST_ACCEPTED'
	| 'NEW_MESSAGE'
	| 'NEW_COMMENT'
	| 'NEW_RATING'
	| 'RECIPE_LIKED'
	| 'RECIPE_FAVORITED'
	| 'NEW_RECIPE'
	| 'SYSTEM';

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	isRead: boolean;
	data: NotificationData | null;
	createdAt: string;
	updatedAt: string;
}

export interface NotificationData {
	userId?: string;
	username?: string;
	avatarUrl?: string;
	recipeId?: string;
	recipeTitle?: string;
	recipeSlug?: string;
	commentId?: string;
	messageId?: string;
	conversationId?: string;
	requestId?: string;
	score?: number;
	[key: string]: unknown;
}

export interface NotificationPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface NotificationListData {
	notifications: Notification[];
	pagination: NotificationPagination;
}

export interface NotificationListResponse {
	status: 'success' | 'error';
	message?: string;
	data: NotificationListData;
}

export type NotificationResponse = ApiResponse<Notification>;

export interface UnreadCountData {
	count: number;
}

export type UnreadCountResponse = ApiResponse<UnreadCountData>;

export interface NotificationEvent {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	data: NotificationData | null;
	createdAt: string;
}

export interface NewFollowerEvent {
	followerId: string;
	username: string;
	avatarUrl?: string;
}

export interface FriendRequestEvent {
	requestId: string;
	senderId: string;
	username: string;
	avatarUrl?: string;
}

export interface FriendRequestAcceptedEvent {
	friendId: string;
	username: string;
	avatarUrl?: string;
}

export interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	isLoading: boolean;
	refreshNotifications: () => Promise<void>;
	refreshUnreadCount: () => Promise<void>;
	markAsRead: (notificationId: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	deleteNotification: (notificationId: string) => Promise<void>;
	showToast: (title: string, message: string) => void;
}
