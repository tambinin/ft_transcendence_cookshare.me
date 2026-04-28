import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiFlag, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import OnlineAvatar from './OnlineAvatar';
import type { RecipeComment } from '../types/recipe.type';

interface CommentProps {
	comment: RecipeComment;
	onReply?: (commentId: string, content: string) => Promise<void>;
	onEdit?: (commentId: string, content: string) => Promise<void>;
	onDelete?: (commentId: string) => Promise<void>;
	onReport?: (commentId: string) => void;
	currentUserAvatar?: string;
	currentUserId?: string;
	isAuthenticated?: boolean;
	depth?: number;
}

const formatRelativeDate = (dateStr: string): string => {
	const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
	if (diff < 60) return "à l'instant";
	if (diff < 3600) return `${Math.floor(diff / 60)}m`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
	return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const Comment = ({ comment, onReply, onEdit, onDelete, onReport, currentUserAvatar, currentUserId, isAuthenticated, depth = 0 }: CommentProps) => {
	const [showReplyInput, setShowReplyInput] = useState(false);
	const [replyText, setReplyText] = useState('');
	const [showReplies, setShowReplies] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(comment.content);
	const [isEditSubmitting, setIsEditSubmitting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const isOwnComment = currentUserId === comment.author.id;

	const replies = comment.replies || [];
	const replyCount = comment.replyCount ?? replies.length;
	const maxDepth = 3;

	const handleSubmitReply = async () => {
		if (!replyText.trim() || !onReply || isSubmitting) return;
		setIsSubmitting(true);
		try {
			await onReply(comment.id, replyText);
			setReplyText('');
			setShowReplyInput(false);
			setShowReplies(true);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = async () => {
		if (!editText.trim() || !onEdit || isEditSubmitting) return;
		setIsEditSubmitting(true);
		try {
			await onEdit(comment.id, editText);
			setIsEditing(false);
		} finally {
			setIsEditSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!onDelete) return;
		await onDelete(comment.id);
		setShowDeleteConfirm(false);
	};

	return (
		<div 
			className={`${depth > 0 ? 'ml-4 sm:ml-8 border-l border-white/5 pl-2 sm:pl-4' : ''} group mb-2 text-left`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* RESPONSIVE FIX: reduce padding/gap on mobile for nested comments */}
			<div className="flex items-start gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-xl hover:bg-white/[0.03] transition-colors duration-200">
				<Link to={`/profile/${comment.author.id}`} className="shrink-0 transition-transform hover:scale-105">
					<div className="p-[1.5px] rounded-full bg-gradient-to-tr from-orange-500/20 to-pink-500/20 group-hover:from-orange-500/50 group-hover:to-pink-500/50 transition-all duration-300">
						<OnlineAvatar
							userId={comment.author.id}
							avatarUrl={comment.author.avatarUrl}
							username={comment.author.username}
							size="sm"
							className="w-8 h-8 rounded-full object-cover border border-black/20 shadow-sm"
						/>
					</div>
				</Link>
				<div className="flex-1 min-w-0">
					<div className="flex flex-col">
						<div className="flex items-baseline gap-2">
							<Link to={`/profile/${comment.author.id}`} className="text-[13px] font-bold text-white/95 hover:text-white transition-colors">
								{comment.author.username}
							</Link>
							<span className="text-[11px] text-white/40 font-medium">
								{formatRelativeDate(comment.createdAt)}
							</span>
							{comment.updatedAt && comment.updatedAt !== comment.createdAt && (
								<span className="text-[10px] text-white/25 italic">modifié</span>
							)}
						</div>
						{isEditing ? (
							<div className="flex items-center gap-2 mt-1">
								{/* RESPONSIVE FIX: ensure 16px font-size on mobile for edit input */}
								<input
									type="text"
									value={editText}
									onChange={e => setEditText(e.target.value)}
									onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') { setIsEditing(false); setEditText(comment.content); } }}
									className="flex-1 min-w-0 bg-white/[0.04] border border-orange-500/30 rounded-full px-3 py-1.5 text-base sm:text-[13px] text-white placeholder:text-white/30 outline-none focus:bg-white/[0.07] transition-all"
									autoFocus
								/>
								{/* RESPONSIVE FIX: touch-friendly confirm/cancel buttons */}
								<button onClick={handleEdit} disabled={!editText.trim() || isEditSubmitting} className="p-2 sm:p-1.5 text-green-400 hover:bg-green-500/10 rounded-full disabled:opacity-20 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
									<FiCheck size={14} className={isEditSubmitting ? 'animate-pulse' : ''} />
								</button>
								<button onClick={() => { setIsEditing(false); setEditText(comment.content); }} className="p-2 sm:p-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-full transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
									<FiX size={14} />
								</button>
							</div>
						) : (
							<p className="text-[13.5px] text-white/80 leading-[1.4] mt-0.5 break-words">
								{comment.content}
							</p>
						)}
					</div>

					{showDeleteConfirm && (
						<div className="flex items-center gap-2 mt-2">
							<span className="text-[12px] text-red-400">Delete this comment?</span>
							<button onClick={handleDelete} className="text-[12px] text-white bg-red-500 px-2 py-0.5 rounded hover:bg-red-600">
								Yes
							</button>
							<button onClick={() => setShowDeleteConfirm(false)} className="text-[12px] text-gray-400 hover:text-white">
								No
							</button>
						</div>
					)}

					{/* RESPONSIVE FIX: touch-friendly action buttons with min tap targets */}
					<div className={`flex items-center gap-3 sm:gap-4 mt-1.5 transition-opacity duration-200 ${isHovered || showReplyInput ? 'opacity-100' : 'opacity-80'}`}>
						{isAuthenticated && depth < maxDepth && onReply && !isEditing && (
							<button
								onClick={() => setShowReplyInput(!showReplyInput)}
								className="text-[12px] text-white/50 hover:text-white font-semibold transition-colors flex items-center gap-1 min-h-[32px]"
							>
								Reply							</button>
						)}
						{isOwnComment && isAuthenticated && onEdit && !isEditing && (
							<button
								onClick={() => setIsEditing(true)}
								className="text-[12px] text-white/40 hover:text-orange-400 transition-colors flex items-center gap-1 min-h-[32px] p-1"
								title="Modifier"
							>
								<FiEdit2 size={13} />
							</button>
						)}
						{isOwnComment && isAuthenticated && onDelete && !isEditing && (
							<button
								onClick={() => setShowDeleteConfirm(true)}
								className="text-[12px] text-white/40 hover:text-red-400 transition-colors flex items-center gap-1 min-h-[32px] p-1"
								title="Delete"
							>
								<FiTrash2 size={13} />
							</button>
						)}
						{replyCount > 0 && (
							<button
								onClick={() => setShowReplies(!showReplies)}
								className="text-[12px] text-orange-400 group-hover:text-orange-300 font-semibold transition-colors"
							>
								{showReplies ? 'Masquer' : `${replyCount} ${replyCount === 1 ? 'Answer' : 'Answers'}`}
							</button>
						)}
						{isAuthenticated && onReport && !isOwnComment && (
							<button
								onClick={() => onReport(comment.id)}
								className="text-white/20 hover:text-red-400/80 transition-all duration-200 hover:scale-110 ml-auto"
								title="Signaler"
							>
								<FiFlag size={12} />
							</button>
						)}
					</div>

					{showReplyInput && (
						<div className="flex items-center gap-2 sm:gap-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
							<div className="relative flex-1 min-w-0">
								{/* RESPONSIVE FIX: ensure 16px font-size on mobile for reply input */}
								<input
									type="text"
									value={replyText}
									onChange={e => setReplyText(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleSubmitReply()}
									placeholder={`Répondre à ${comment.author.username}...`}
									className="w-full bg-white/[0.04] border border-white/5 rounded-full px-4 py-2 text-base sm:text-[13px] text-white placeholder:text-white/30 outline-none focus:bg-white/[0.07] focus:border-orange-500/30 transition-all"
									autoFocus
								/>
							</div>
							{/* RESPONSIVE FIX: compact send button for inline reply */}
							<button
								onClick={handleSubmitReply}
								disabled={!replyText.trim() || isSubmitting}
								className="p-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-full disabled:opacity-20 transition-all flex items-center justify-center shrink-0"
							>
								<FiSend size={14} className={isSubmitting ? 'animate-pulse' : ''} />
							</button>
						</div>
					)}
				</div>
			</div>

			{showReplies && replies.length > 0 && (
				<div className="mt-1 transition-all duration-300">
					{replies.map(reply => (
						<Comment
							key={reply.id}
							comment={reply}
							onReply={onReply}
							onEdit={onEdit}
							onDelete={onDelete}
							onReport={onReport}
							currentUserAvatar={currentUserAvatar}
							currentUserId={currentUserId}
							isAuthenticated={isAuthenticated}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default Comment;
