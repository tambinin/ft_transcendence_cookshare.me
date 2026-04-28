import { useRef } from 'react';
import { FiSend, FiChevronDown } from 'react-icons/fi';
import { TfiComments } from 'react-icons/tfi';
import { getAvatarUrl } from '../../utils/avatar.utils';
import Comment from '../Comment';
import type { PostCardCommentsProps } from './postCard.types';

const PostCardComments = ({
	comments, isLoadingComments, commentText, setCommentText,
	handleSubmitComment, handleCommentInputChange, handleCommentInputBlur,
	loadComments, replyToComment, editComment, deleteComment,
	hasMoreComments, isLoadingMoreComments, loadMoreComments,
	typingUsers,
	isAuthenticated, currentUser, commentCount,
	onReportComment, variant, showComments, handleToggleComments,
}: PostCardCommentsProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	if (variant === 'desktop') {
		return (
			<div className="p-4 flex flex-col h-full max-h-[500px] overflow-hidden">
				<div className="flex-none">
					<div className="flex items-center gap-2 text-lg font-semibold text-orange-200 mb-2.5">
						<TfiComments size={18} />
						Comments
						{comments.length > 0 && (
							<span className="text-xs font-normal text-slate-400">({comments.length})</span>
						)}
					</div>
					<div className="w-full h-px bg-white/10 mb-2.5" />
				</div>

				<div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/10">
					{isLoadingComments ? (
						<div className="flex justify-center py-4">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" />
						</div>
					) : comments.length > 0 ? (
						<>
							{comments.map(c => (
								<Comment
									key={c.id}
									comment={c}
									onReply={replyToComment}
									onEdit={editComment}
									onDelete={deleteComment}
									currentUserAvatar={currentUser?.avatarUrl ?? undefined}
									currentUserId={currentUser?.id}
									isAuthenticated={isAuthenticated}
									onReport={(commentId) => onReportComment(commentId)}
								/>
							))}
							{hasMoreComments && (
								<button
									onClick={loadMoreComments}
									disabled={isLoadingMoreComments}
									className="flex items-center justify-center gap-1.5 w-full py-2 text-orange-400 text-xs font-medium hover:text-orange-300 transition-colors disabled:opacity-50"
								>
									{isLoadingMoreComments ? (
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
									) : (
										<>
											<FiChevronDown size={14} />
											<span>Load more comments</span>
										</>
									)}
								</button>
							)}
						</>
					) : (
						<p className="text-left text-white/30 text-sm py-4">No comments. Silence speaks volumes.</p>
					)}
				</div>

				<div className="flex-none mt-auto">
					{typingUsers.size > 0 && (
						<p className="text-[11px] text-slate-400 italic px-1 pt-1 animate-pulse text-left">Une personne écrit...</p>
					)}
					{isAuthenticated && (
						<div className="pt-3 border-t border-white/5 mt-3">
							<div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-full border border-white/5 shadow-inner">
								<img
									src={getAvatarUrl(currentUser?.avatarUrl)}
									alt=""
									className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/10"
								/>
								<input
									ref={inputRef}
									type="text"
									value={commentText}
									onChange={e => { setCommentText(e.target.value); handleCommentInputChange(); }}
									onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
									onBlur={handleCommentInputBlur}
									placeholder="Write..."
									className="flex-1 min-w-0 bg-transparent px-1 text-[13px] text-white placeholder:text-white/30 outline-none"
								/>
								<button
									onClick={handleSubmitComment}
									disabled={!commentText.trim()}
									className="p-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-full transition-all disabled:opacity-20"
								>
									<FiSend size={16} />
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	// variant === 'collapsible' (tablet & mobile)
	const totalCount = Math.max(comments.length, commentCount ?? 0);

	return (
		<div className="border-t border-white/5 px-4 py-3">
			{typingUsers.size > 0 && (
				<p className="text-[11px] text-slate-400 italic px-1 mb-1 animate-pulse">Someone is typing...</p>
			)}

			{isAuthenticated && (
				<div className="flex items-center gap-2 mb-3">
					<img src={getAvatarUrl(currentUser?.avatarUrl)} alt="" loading="lazy" className="w-8 h-8 rounded-full object-cover" />
					<input
						type="text"
						value={commentText}
						onChange={e => { setCommentText(e.target.value); handleCommentInputChange(); }}
						onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
						onFocus={() => { if (comments.length === 0) loadComments(); }}
						onBlur={handleCommentInputBlur}
						placeholder="Write a comment..."
						className="flex-1 min-w-0 bg-white/[0.06] rounded-full px-4 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:bg-white/[0.08] transition-colors"
					/>
					<button onClick={handleSubmitComment} className="p-2 text-orange-400 hover:text-orange-300 transition-colors">
						<FiSend size={18} />
					</button>
				</div>
			)}

			<button
				onClick={handleToggleComments}
				className="flex items-center justify-center gap-1.5 w-full py-2 text-slate-400 text-xs font-medium hover:text-orange-400 transition-colors"
			>
				<TfiComments size={14} />
				<span>{showComments ? 'Hide comments' : `View comments${totalCount ? ` (${totalCount})` : ''}`}</span>
			</button>

			{showComments && (
				<div className="max-h-[250px] overflow-y-auto mt-2 space-y-0.5">
					{isLoadingComments ? (
						<div className="flex justify-center py-3">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" />
						</div>
					) : comments.length > 0 ? (
						<>
							{comments.map(c => (
								<Comment
									key={c.id}
									comment={c}
									onReply={replyToComment}
									onEdit={editComment}
									onDelete={deleteComment}
									onReport={(commentId) => onReportComment(commentId)}
									currentUserAvatar={currentUser?.avatarUrl ?? undefined}
									currentUserId={currentUser?.id}
									isAuthenticated={isAuthenticated}
								/>
							))}
							{hasMoreComments && (
								<button
									onClick={loadMoreComments}
									disabled={isLoadingMoreComments}
									className="flex items-center justify-center gap-1.5 w-full py-2 text-orange-400 text-xs font-medium hover:text-orange-300 transition-colors disabled:opacity-50"
								>
									{isLoadingMoreComments ? (
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
									) : (
										<>
											<FiChevronDown size={14} />
											<span>Charger plus</span>
										</>
									)}
								</button>
							)}
						</>
					) : (
						<p className="text-left text-white/30 text-sm py-3">No comments yet</p>
					)}
				</div>
			)}
		</div>
	);
};

export default PostCardComments;
