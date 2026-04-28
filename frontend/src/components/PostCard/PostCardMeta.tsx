import React from 'react';
import { BiTimeFive } from 'react-icons/bi';
import { GiCampCookingPot } from 'react-icons/gi';
import { IoFlameOutline } from 'react-icons/io5';
import { HiOutlineTag } from 'react-icons/hi';
import type { PostCardMetaProps } from './postCard.types';

const PostCardMeta = React.memo(({
	title, time, difficulty, dietaryTags, category, description, maxTags,
}: PostCardMetaProps) => {
	const visibleTags = maxTags ? dietaryTags?.slice(0, maxTags) : dietaryTags;

	return (
		<>
			<div className="flex items-center gap-2 mb-2">
				<GiCampCookingPot size={22} className="text-orange-400 flex-shrink-0 drop-shadow" />
				<h3 className="text-xl font-bold text-orange-200 truncate">{title}</h3>
			</div>

			<div className="flex items-center gap-2 mb-2.5">
				<span className="flex items-center gap-1 px-2.5 py-0.5 border border-white/10 bg-white/5 rounded-full text-xs text-slate-300">
					<BiTimeFive className="text-blue-300" size={14} />
					{time}
				</span>
				<span className="flex items-center gap-1 px-2.5 py-0.5 border border-white/10 bg-white/5 rounded-full text-xs text-slate-300">
					<IoFlameOutline className="text-emerald-300" size={14} />
					{difficulty}
				</span>
			</div>

			<div className="flex flex-wrap gap-1.5 mb-2.5">
				{visibleTags?.map(tag => (
					<span key={tag.id} className="flex items-center gap-1 px-2 py-0.5 border border-white/10 bg-white/5 rounded-lg text-[11px] text-slate-300 hover:bg-white/10 transition-colors cursor-pointer">
						<HiOutlineTag size={12} className="text-violet-300" />
						{tag.name}
					</span>
				))}
				{category && (
					<span className="px-2.5 py-0.5 bg-orange-500/80 text-white text-[11px] font-medium rounded-lg">
						{category.name}
					</span>
				)}
			</div>

			<p className="text-[13px] text-slate-300 leading-relaxed line-clamp-2 mb-auto">
				{description}
			</p>
		</>
	);
});

PostCardMeta.displayName = 'PostCardMeta';

export default PostCardMeta;
