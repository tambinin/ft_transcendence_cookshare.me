import { z } from 'zod';

export const TypingSchema = z.object({
	type: z.literal('TYPING_START').or(z.literal('TYPING_STOP')),
	receiverId: z.string().min(1),
});

export const JoinLeaveRecipeSchema = z.object({
	type: z.literal('JOIN_RECIPE').or(z.literal('LEAVE_RECIPE')),
	recipeId: z.string().min(1),
});

export const CommentTypingSchema = z.object({
	type: z.literal('COMMENT_TYPING_START').or(z.literal('COMMENT_TYPING_STOP')),
	recipeId: z.string().min(1),
});

export const ShoppingListAddSchema = z.object({
	type: z.literal('SHOPPING_LIST_ADD'),
	name: z.string().min(1).max(500),
	quantity: z.string().max(100).optional(),
});

export const ShoppingListUpdateSchema = z.object({
	type: z.literal('SHOPPING_LIST_UPDATE'),
	id: z.string().min(1),
	name: z.string().min(1).max(500).optional(),
	quantity: z.string().max(100).optional(),
	isChecked: z.boolean().optional(),
});

export const ShoppingListDeleteSchema = z.object({
	type: z.literal('SHOPPING_LIST_DELETE'),
	id: z.string().min(1),
});

export const PingSchema = z.object({
	type: z.literal('PING'),
});

export const JoinSystemHealthSchema = z.object({
	type: z.literal('JOIN_SYSTEM_HEALTH'),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
	TypingSchema,
	JoinLeaveRecipeSchema,
	CommentTypingSchema,
	ShoppingListAddSchema,
	ShoppingListUpdateSchema,
	ShoppingListDeleteSchema,
	PingSchema,
	JoinSystemHealthSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;


export interface ServerPong {
	type: 'PONG';
}

export interface ServerConnected {
	type: 'CONNECTED';
	sessionId: string;
	userId: string;
}

export interface ServerError {
	type: 'ERROR';
	code: string;
	details?: string;
}

export interface ServerTokenExpired {
	type: 'TOKEN_EXPIRED';
}

export interface ServerShoppingListUpdate {
	type: 'SHOPPING_LIST_UPDATE';
	action: string;
	item?: Record<string, unknown>;
	itemId?: string;
	timestamp: string;
}

export interface ServerTypingEvent {
	type: 'TYPING_START' | 'TYPING_STOP';
	senderId: string;
}

export interface ServerCommentTypingEvent {
	type: 'COMMENT_TYPING_START' | 'COMMENT_TYPING_STOP';
	senderId: string;
	recipeId: string;
}

export interface ServerUserStatusChange {
	type: 'USER_STATUS_CHANGE';
	userId: string;
	isOnline: boolean;
}

export interface ServerHealthUpdate {
	type: 'HEALTH_UPDATE';
	status: 'HEALTHY' | 'DEGRADED';
	services: Array<{ name: string; status: string }>;
	timestamp: string;
}

export interface ServerMissedMessages {
	type: 'MISSED_MESSAGES';
	messages: Array<{ event: string; data: unknown; bufferedAt: string }>;
	count: number;
}

export interface ServerRecipeRatingUpdate {
	type: 'RECIPE_RATING_UPDATE';
	recipeId: string;
	averageScore: number;
	ratingCount: number;
}

export interface ServerShutdown {
	type: 'SERVER_SHUTDOWN';
	message: string;
}

export type ServerMessage =
	| ServerPong
	| ServerConnected
	| ServerError
	| ServerTokenExpired
	| ServerShoppingListUpdate
	| ServerTypingEvent
	| ServerCommentTypingEvent
	| ServerUserStatusChange
	| ServerHealthUpdate
	| ServerMissedMessages
	| ServerRecipeRatingUpdate
	| ServerShutdown;

import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
	userId: string;
	lastTokenCheck: number;
	isAlive: boolean;
}
