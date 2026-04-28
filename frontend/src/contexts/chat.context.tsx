import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
} from 'react';
import { useAuth } from './auth.context';
import { getAccessToken } from '../services/auth.service';
import { connect, disconnect, onNewMessage, onMessagesRead } from '../services/socket.service';
import chatService from '../services/chat.service';
import logger from '../utils/logger';
import type { NewMessageEvent, ConversationPreview } from '../types/chat.type';

interface ChatContextType {
	unreadCount: number;
	badgeCount: number;
	conversations: ConversationPreview[];
	activeConversationUserId: string | null;
	setActiveConversationUserId: (userId: string | null) => void;
	refreshUnreadCount: () => Promise<void>;
	loadConversations: () => Promise<void>;
	addConversationPreview: (preview: ConversationPreview) => void;
	updateConversationPreview: (otherUserId: string, lastMessage: string, lastMessageDate: string) => void;
	markConversationAsRead: (otherUserId: string, conversationId: string) => Promise<void>;
	clearBadge: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user, isAuthenticated } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);
	const [badgeCount, setBadgeCount] = useState(0);
	const [conversations, setConversations] = useState<ConversationPreview[]>([]);
	const [activeConversationUserId, setActiveConversationUserId] = useState<string | null>(null);
	const badgeSendersRef = useRef<Set<string>>(new Set());

	const activeConversationRef = useRef<string | null>(null);
	activeConversationRef.current = activeConversationUserId;

	const loadConversations = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const data = await chatService.getConversations();
			setConversations(Array.isArray(data) ? data : []);
		} catch (error) {
			logger.error('[ChatContext] Failed to load conversations:', error);
		}
	}, [isAuthenticated]);

	const refreshUnreadCount = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const count = await chatService.getUnreadCount();
			setUnreadCount(count);
		} catch (error) {
			logger.error('[ChatContext] Failed to fetch unread count:', error);
		}
	}, [isAuthenticated]);

	const markConversationAsRead = useCallback(async (otherUserId: string, conversationId: string) => {
		try {
			await chatService.markAsRead(conversationId);
			setConversations(prev => {
				const arr: ConversationPreview[] = Array.isArray(prev) ? prev : [];
				return arr.map(c =>
					c.otherUserId === otherUserId
						? { ...c, unreadCount: 0 }
						: c
				);
			});
			await refreshUnreadCount();
		} catch (error) {
			logger.error('[ChatContext] Failed to mark as read:', error);
		}
	}, [refreshUnreadCount]);

	const clearBadge = useCallback(() => {
		setBadgeCount(0);
		badgeSendersRef.current.clear();
		refreshUnreadCount();
	}, [refreshUnreadCount]);

	const addConversationPreview = useCallback((preview: ConversationPreview) => {
		setConversations(prev => {
			const arr: ConversationPreview[] = Array.isArray(prev) ? prev : [];
			const exists = arr.find(c => c.otherUserId === preview.otherUserId);
			if (exists) {
				return arr.map(c =>
					c.otherUserId === preview.otherUserId
						? { ...c, lastMessage: preview.lastMessage, lastMessageDate: preview.lastMessageDate, unreadCount: preview.unreadCount }
						: c
				);
			}
			return [preview, ...arr];
		});
	}, []);

	const updateConversationPreview = useCallback((otherUserId: string, lastMessage: string, lastMessageDate: string) => {
		setConversations(prev => {
			const arr: ConversationPreview[] = Array.isArray(prev) ? prev : [];
			const isActive = activeConversationRef.current === otherUserId;
			const updated = arr.map(c =>
				c.otherUserId === otherUserId
					? { ...c, lastMessage, lastMessageDate, unreadCount: isActive ? 0 : c.unreadCount + 1 }
					: c
			);
			const target = updated.find(c => c.otherUserId === otherUserId);
			if (target) {
				return [target, ...updated.filter(c => c.otherUserId !== otherUserId)];
			}
			return updated;
		});
	}, []);

	// Main effect: connect socket and wire up listeners
	useEffect(() => {
		if (!isAuthenticated || !user) {
			disconnect();
			setUnreadCount(0);
			setBadgeCount(0);
			badgeSendersRef.current.clear();
			setConversations([]);
			return;
		}

		const token = getAccessToken();
		if (!token) return;
		connect(token);
		refreshUnreadCount();
		loadConversations().then(() => {
			setConversations(prev => {
				const withUnread = (Array.isArray(prev) ? prev : []).filter(c => c.unreadCount > 0);
				setBadgeCount(withUnread.length);
				withUnread.forEach(c => badgeSendersRef.current.add(c.otherUserId));
				return prev;
			});
		});
		const offNewMessage = onNewMessage((data: NewMessageEvent) => {
			const isActive = activeConversationRef.current === data.senderId;
			if (!isActive) {
				setUnreadCount(prev => prev + 1);
				if (!badgeSendersRef.current.has(data.senderId)) {
					badgeSendersRef.current.add(data.senderId);
					setBadgeCount(prev => prev + 1);
				}
			}
			updateConversationPreview(data.senderId, data.content, data.createdAt);
			setConversations(prev => {
				const arr: ConversationPreview[] = Array.isArray(prev) ? prev : [];
				const exists = arr.some(c => c.otherUserId === data.senderId);
				if (!exists) {
					loadConversations();
				}
				return arr;
			});
		});

		const offMessagesRead = onMessagesRead(() => {
			refreshUnreadCount();
		});

		return () => {
			offNewMessage();
			offMessagesRead();
		};
	}, [isAuthenticated, user]);

	// Resync unread count when tab becomes visible (handles missed events)
	useEffect(() => {
		if (!isAuthenticated) return;

		const handleVisibility = () => {
			if (document.visibilityState === 'visible') {
				refreshUnreadCount();
			}
		};

		document.addEventListener('visibilitychange', handleVisibility);
		return () => document.removeEventListener('visibilitychange', handleVisibility);
	}, [isAuthenticated, refreshUnreadCount]);

	return (
		<ChatContext.Provider
			value={{
				unreadCount,
				badgeCount,
				conversations,
				activeConversationUserId,
				setActiveConversationUserId,
				refreshUnreadCount,
				loadConversations,
				addConversationPreview,
				updateConversationPreview,
				markConversationAsRead,
				clearBadge,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
};

export function useChatContext(): ChatContextType {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error('useChatContext must be used within a <ChatProvider>');
	}
	return context;
}

export default ChatContext;
