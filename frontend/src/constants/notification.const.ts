export const NOTIFICATION = {
	BASE: "notifications",
	MARK_READ: (notificationId: string) => `notifications/${notificationId}/read`,
	MARK_ALL_READ: "notifications/read-all",
	DELETE: (notificationId: string) => `notifications/${notificationId}`,
	UNREAD_COUNT: "notifications/unread/count",
} as const;
