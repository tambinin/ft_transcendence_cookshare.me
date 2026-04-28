import { useNotificationContext } from '../contexts/notification.context';
import type { NotificationContextType } from '../types/notification.type';

export function useNotification(): NotificationContextType {
	return useNotificationContext();
}

export default useNotification;
