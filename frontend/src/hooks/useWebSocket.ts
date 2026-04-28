// ═══════════════════════════════════════════════════════════════════════════
// useWebSocket.ts — React hook for WebSocket connection status
//
// Provides reactive access to the WebSocket connection status
// and common socket operations. Can be used in any component.
//
// Usage:
//   const { status, isConnected } = useWebSocket();
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
	getConnectionStatus,
	onConnectionStatusChange,
	getSocket,
	safeEmit,
	type WsConnectionStatus,
} from '../services/socket.service';

interface UseWebSocketReturn {
	/** Current connection status */
	status: WsConnectionStatus;
	/** Shorthand: true when status === 'OPEN' */
	isConnected: boolean;
	/** Shorthand: true when status === 'RECONNECTING' */
	isReconnecting: boolean;
	/** Send a message (queued if offline) */
	send: (event: string, data: unknown) => void;
	/** Raw socket (may be null) */
	socket: ReturnType<typeof getSocket>;
}

export function useWebSocket(): UseWebSocketReturn {
	const [status, setStatus] = useState<WsConnectionStatus>(getConnectionStatus);

	useEffect(() => {
		const off = onConnectionStatusChange(setStatus);
		return off;
	}, []);

	const send = useCallback((event: string, data: unknown) => {
		safeEmit(event, data);
	}, []);

	return {
		status,
		isConnected: status === 'OPEN',
		isReconnecting: status === 'RECONNECTING',
		send,
		socket: getSocket(),
	};
}

export default useWebSocket;
