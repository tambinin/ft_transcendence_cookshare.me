// ═══════════════════════════════════════════════════════════════════════════
// WsStatusBadge.tsx — Visual indicator of WebSocket connection status
//
// Shows a small badge in the UI:
//   🟢 Connected (green dot)
//   🟡 Reconnecting (yellow pulsing dot + banner)
//   🔴 Disconnected (red dot + retry button)
//
// Designed to be placed in the Navbar or sidebar.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
	onConnectionStatusChange,
	type WsConnectionStatus,
} from '../services/socket.service';

interface WsStatusBadgeProps {
	/** Show as a compact dot only (no text). Default: false */
	compact?: boolean;
}

const statusConfig: Record<WsConnectionStatus, { color: string; pulse: boolean; label: string }> = {
	CLOSED: { color: 'bg-red-500', pulse: false, label: 'Disconnected' },
	CONNECTING: { color: 'bg-yellow-500', pulse: true, label: 'Connecting...' },
	OPEN: { color: 'bg-green-500', pulse: false, label: 'Connected' },
	RECONNECTING: { color: 'bg-yellow-500', pulse: true, label: 'Reconnecting...' },
};

export default function WsStatusBadge({ compact = false }: WsStatusBadgeProps) {
	const [status, setStatus] = useState<WsConnectionStatus>('CLOSED');

	useEffect(() => {
		const off = onConnectionStatusChange(setStatus);
		return off;
	}, []);

	const config = statusConfig[status];

	// Don't show anything when connected and compact (less visual noise)
	if (compact && status === 'OPEN') return null;

	return (
		<div className="flex items-center gap-2" title={config.label}>
			{/* Status dot */}
			<span className="relative flex h-2.5 w-2.5">
				{config.pulse && (
					<span
						className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
					/>
				)}
				<span
					className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`}
				/>
			</span>

			{/* Label (only in non-compact mode) */}
			{!compact && (
				<span className="text-xs text-white/50">{config.label}</span>
			)}

			{/* Reconnecting banner */}
			{status === 'RECONNECTING' && !compact && (
				<span className="text-xs text-yellow-400/80 animate-pulse ml-1">
					⟳
				</span>
			)}
		</div>
	);
}
