import React from 'react';
import { Link } from 'react-router-dom';
import { RiMessengerLine, RiUserFollowLine, RiUserFollowFill } from 'react-icons/ri';
import OnlineAvatar from '../OnlineAvatar';
import { formatRelativeDate } from './postCard.utils';
import type { PostCardAuthorProps } from './postCard.types';

const PostCardAuthor = React.memo(({
	authorId, username, avatarUrl, authorOnline, createdAt,
	isOwnRecipe, isAuthenticated, isFollowing, toggleFollow, onMessage,
}: PostCardAuthorProps) => (
	<div className="flex items-center justify-between">
		<Link to={`/profile/${authorId}`} className="flex items-center gap-2.5 group/author">
			<OnlineAvatar
				userId={authorId}
				avatarUrl={avatarUrl}
				username={username}
				isOnline={authorOnline}
				size="lg"
				className="w-11 h-11 rounded-full border-2 border-orange-400/30 object-cover shadow-lg shadow-orange-500/10"
				dotBorderClass="border-slate-900"
			/>
			<div>
				<p className="text-[13px] font-bold text-white group-hover/author:text-orange-400 transition-colors">{username}</p>
				<p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">{formatRelativeDate(createdAt)}</p>
			</div>
		</Link>

		{!isOwnRecipe && isAuthenticated && (
			<div className="flex items-center gap-2">
				<button
					onClick={toggleFollow}
					className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300 ${
						isFollowing
							? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600'
							: 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
					}`}
				>
					{isFollowing ? <RiUserFollowFill size={12} /> : <RiUserFollowLine size={12} />}
					<span>{isFollowing ? 'Following' : 'Follow'}</span>
				</button>
				<button
					onClick={onMessage}
					className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-orange-300 transition-all duration-300"
					title="Chat"
				>
					<RiMessengerLine size={18} />
				</button>
			</div>
		)}
	</div>
));

PostCardAuthor.displayName = 'PostCardAuthor';

export default PostCardAuthor;
