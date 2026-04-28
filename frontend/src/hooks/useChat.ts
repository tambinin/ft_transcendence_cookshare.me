import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/auth.context';
import chatService from '../services/chat.service';
import logger from '../utils/logger';
import {
	onNewMessage,
	onMessagesRead,
	onTypingStart,
	onTypingStop,
	emitTypingStart,
	emitTypingStop,
} from '../services/socket.service';
import type { Message, NewMessageEvent } from '../types/chat.type';

/**
 * Custom Hook for managing chat with another user.
 * 
 * @param otherUserId - ID of the user we chat with (optional)
 * @returns 
 *  - messages           : chat history
 *  - isLoading          : loading status
 *  - sendMessage        : send a message function
 *  - isTyping           : other user is typing
 *  - handleTyping       : indicate we are typing
 */
export function useChat(otherUserId: string | undefined) {
	const { user } = useAuth();
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isTypingEmittedRef = useRef(false);
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	const loadMessages = useCallback(async () => {
		if (!otherUserId) return;

		setIsLoading(true);
		try {
			const data = await chatService.getMessages(otherUserId);
			setMessages(Array.isArray(data) ? data : []);
		} catch (error) {
			logger.error('[useChat] Error loading messages:', error);
		} finally {
			setIsLoading(false);
		}
	}, [otherUserId]);

	const sendMessage = useCallback(async (content: string) => {
		if (!otherUserId || !content.trim()) return;

		try {
			const newMessage = await chatService.sendMessage(otherUserId, content.trim());
			setMessages(prev => [...(Array.isArray(prev) ? prev : []), newMessage]);
			if (isTypingEmittedRef.current) {
				emitTypingStop(otherUserId);
				isTypingEmittedRef.current = false;
			}
			setTimeout(scrollToBottom, 50);
		} catch (error) {
			logger.error('[useChat] Error sending message:', error);
			throw error;
		}
	}, [otherUserId, scrollToBottom]);
	const handleTyping = useCallback(() => {
		if (!otherUserId) return;
		if (!isTypingEmittedRef.current) {
			emitTypingStart(otherUserId);
			isTypingEmittedRef.current = true;
		}
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
		typingTimeoutRef.current = setTimeout(() => {
			emitTypingStop(otherUserId);
			isTypingEmittedRef.current = false;
		}, 2000);
	}, [otherUserId]);
	useEffect(() => {
		if (otherUserId) {
			loadMessages();
		} else {
			setMessages([]);
		}
	}, [otherUserId, loadMessages]);
	useEffect(() => {
		if (!user) return;

		const offNewMessage = onNewMessage((data: NewMessageEvent) => {
			if (data.senderId === otherUserId) {
				const message: Message = {
					id: data.id,
					content: data.content,
					isRead: false,
					readAt: null,
					createdAt: data.createdAt,
					senderId: data.senderId,
					conversationId: data.conversationId,
				};
				setMessages(prev => [...(Array.isArray(prev) ? prev : []), message]);
				setTimeout(scrollToBottom, 50);
			}
		});

		return offNewMessage;
	}, [user, otherUserId, scrollToBottom]);
	useEffect(() => {
		if (!user) return;

		const offRead = onMessagesRead((data) => {
			setMessages(prev =>
				(Array.isArray(prev) ? prev : []).map(msg =>
					data.messageIds.includes(msg.id)
						? { ...msg, isRead: true, readAt: data.readAt }
						: msg
				)
			);
		});

		return offRead;
	}, [user]);
	useEffect(() => {
		if (!otherUserId) return;

		const offStart = onTypingStart((data) => {
			if (data.senderId === otherUserId) {
				setIsTyping(true);
			}
		});

		const offStop = onTypingStop((data) => {
			if (data.senderId === otherUserId) {
				setIsTyping(false);
			}
		});

		return () => {
			offStart();
			offStop();
		};
	}, [otherUserId]);
	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, []);

	return {
		messages,
		isLoading,
		isTyping,
		sendMessage,
		loadMessages,
		handleTyping,
		messagesEndRef,
	};
}
