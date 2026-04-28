import { NavLink } from 'react-router-dom';
import { FaCheck, FaUserPlus, FaUserMinus, FaTimes } from 'react-icons/fa';
import { MdBlock } from 'react-icons/md';
import { RiMessengerLine } from 'react-icons/ri';
import type { FriendRequest } from '../../types/social.type';

interface ProfileActionsProps {
	id?: string;
	actionLoading: boolean;
	isFriend: boolean;
	pendingRequest: FriendRequest | null;
	sentRequest: FriendRequest | null;
	isBlocked: boolean;
	blockLoading: boolean;
	onAddFriend: () => void;
	onCancelRequest: () => void;
	onRemoveFriend: () => void;
	onConfirmFriend: () => void;
	onToggleBlock: () => void;
}

const ProfileActions = ({
	id, actionLoading, isFriend, pendingRequest, sentRequest,
	isBlocked, blockLoading,
	onAddFriend, onCancelRequest, onRemoveFriend, onConfirmFriend, onToggleBlock,
}: ProfileActionsProps) => {
	const renderFriendButton = () => {
		if (pendingRequest && (pendingRequest.senderId === id || pendingRequest.sender?.id === id)) {
			return (
				<button onClick={onConfirmFriend} disabled={actionLoading} className="flex-1 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-green-500 hover:bg-green-600 text-white">
					<FaCheck size={16} />
					{actionLoading ? '...' : 'Confirm'}
				</button>
			);
		}
		if (isFriend) {
			return (
				<button onClick={onRemoveFriend} disabled={actionLoading} className="flex-1 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/20">
					<FaUserMinus size={16} />
					{actionLoading ? '...' : 'Remove'}
				</button>
			);
		}
		if (sentRequest) {
			return (
				<button onClick={onCancelRequest} disabled={actionLoading} className="flex-1 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/20">
					<FaTimes size={16} />
					{actionLoading ? '...' : 'Cancel'}
				</button>
			);
		}
		return (
			<button onClick={onAddFriend} disabled={actionLoading} className="flex-1 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 bg-orange-500 hover:bg-orange-600 text-white">
				<FaUserPlus size={16} />
				{actionLoading ? '...' : 'Add'}
			</button>
		);
	};

	return (
		// RESPONSIVE FIX: full width on mobile, constrained on desktop, touch-friendly
		<div className="flex gap-2 w-full max-w-[320px] md:max-w-100 mt-2 mb-4 px-2 sm:px-0">
			{renderFriendButton()}
			<NavLink
				to={`/messenger/${id}`}
				className="flex-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border border-white/5"
			>
				<RiMessengerLine size={18} />
				Chat
			</NavLink>
			<button
				onClick={onToggleBlock}
				disabled={blockLoading}
				className={`p-2.5 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 border ${
					isBlocked
						? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
						: 'bg-white/5 text-white/50 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
				}`}
				title={isBlocked ? 'Unblock' : 'Block'}
			>
				<MdBlock size={18} />
			</button>
		</div>
	);
};

export default ProfileActions;
