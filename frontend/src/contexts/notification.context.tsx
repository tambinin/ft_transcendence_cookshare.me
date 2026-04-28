import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { useAuth } from './auth.context';
import { onNotification, type NotificationEvent } from '../services/socket.service';
import notificationService from '../services/notification.service';
import logger from '../utils/logger';
import type { Notification, NotificationContextType } from '../types/notification.type';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user, isAuthenticated } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

	const showToast = useCallback((title: string, message: string) => {
		setToast({ title, message });
		setTimeout(() => setToast(null), 4000);
	}, []);

	const refreshNotifications = useCallback(async () => {
		if (!isAuthenticated) return;
		setIsLoading(true);
		try {
			const response = await notificationService.getNotifications({ limit: 50 });
			if (response.status === 'success') {
				const notifs = response.data.notifications ?? [];
				setNotifications(notifs);
				const unread = notifs.filter(n => !n.isRead).length;
				setUnreadCount(unread);
			}
		} catch (error) {
			logger.error('[NotificationContext] Failed to fetch notifications:', error);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	const refreshUnreadCount = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const response = await notificationService.getUnreadCount();
			if (response.status === 'success') {
				setUnreadCount(response.data.count);
			}
		} catch (error) {
			logger.error('[NotificationContext] Failed to fetch unread count:', error);
		}
	}, [isAuthenticated]);

	const markAsRead = useCallback(async (notificationId: string) => {
		try {
			const response = await notificationService.markAsRead(notificationId);
			if (response.status === 'success') {
				setNotifications(prev =>
					prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
				);
				setUnreadCount(prev => Math.max(0, prev - 1));
			}
		} catch (error) {
			logger.error('[NotificationContext] Failed to mark as read:', error);
		}
	}, []);

	const markAllAsRead = useCallback(async () => {
		try {
			const response = await notificationService.markAllAsRead();
			if (response.status === 'success') {
				setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
				setUnreadCount(0);
			}
		} catch (error) {
			logger.error('[NotificationContext] Failed to mark all as read:', error);
		}
	}, []);

	const deleteNotification = useCallback(async (notificationId: string) => {
		try {
			const response = await notificationService.deleteNotification(notificationId);
			if (response.status === 'success') {
				setNotifications(prev => {
					const removed = prev.find(n => n.id === notificationId);
					if (removed && !removed.isRead) {
						setUnreadCount(c => Math.max(0, c - 1));
					}
					return prev.filter(n => n.id !== notificationId);
				});
			}
		} catch (error) {
			logger.error('[NotificationContext] Failed to delete notification:', error);
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated && user) {
			refreshNotifications();
		} else {
			setNotifications([]);
			setUnreadCount(0);
		}
	}, [isAuthenticated, user, refreshNotifications]);

	useEffect(() => {
		if (!user) return;

		const offNotification = onNotification((data: NotificationEvent) => {
			const newNotification: Notification = {
				id: data.id,
				userId: user.id,
				type: data.type as Notification['type'],
				title: data.title,
				message: data.message,
				isRead: false,
				data: data.data,
				createdAt: data.createdAt,
				updatedAt: data.createdAt,
			};
			setNotifications(prev => [newNotification, ...(Array.isArray(prev) ? prev : [])]);
			setUnreadCount(prev => prev + 1);
			setToast({ title: data.title, message: data.message });
			setTimeout(() => setToast(null), 4000);
		});

		return offNotification;
	}, [user]);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				isLoading,
				refreshNotifications,
				refreshUnreadCount,
				markAsRead,
				markAllAsRead,
				deleteNotification,
				showToast,
			}}
		>
			{children}
			{toast && (
				<div className="toast toast-end toast-top z-[9999]">
					<div className="alert bg-slate-800 border border-orange-500/30 shadow-lg shadow-orange-500/10">
						<div>
							<p className="font-semibold text-orange-400 text-sm">{toast.title}</p>
							<p className="text-white/70 text-xs">{toast.message}</p>
						</div>
						<button onClick={() => setToast(null)} className="text-white/40 hover:text-white text-xs">✕</button>
					</div>
				</div>
			)}
		</NotificationContext.Provider>
	);
};

export function useNotificationContext(): NotificationContextType {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotificationContext must be used within a <NotificationProvider>');
	}
	return context;
}

export default NotificationContext;
