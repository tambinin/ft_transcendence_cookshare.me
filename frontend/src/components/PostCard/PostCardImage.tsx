import React from 'react';
import { IoFlameOutline } from 'react-icons/io5';
import { MdOutdoorGrill } from 'react-icons/md';
import type { PostCardImageProps } from './postCard.types';

const PostCardImage = React.memo(({
	imageUrl, title, averageScore, ratingCount, commentCount, difficulty, level, onClick,
}: PostCardImageProps) => (
	<div
		className="p-5 flex flex-col cursor-pointer group"
		onClick={onClick}
	>
		<div className="relative rounded-xl overflow-hidden">
			<img
				src={imageUrl}
				alt={title}
				loading="lazy"
				className="w-full aspect-[4/3] object-cover rounded-xl border border-white/10 shadow-2xl"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
				<span className="flex items-center gap-1.5 text-white text-[13px] font-semibold px-4 py-1.5 bg-orange-500/30 backdrop-blur-sm rounded-full border border-orange-500/40">
					<MdOutdoorGrill size={16} />
					View recipe
				</span>
			</div>
		</div>

		<div className="flex items-center justify-center gap-4 mt-3.5 py-2.5">
			<div className="flex flex-col items-center">
				<span className="text-lg font-extrabold text-white">{averageScore.toFixed(1)}</span>
				<span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold">Rating</span>
			</div>
			<div className="w-px h-7 bg-white/10" />
			<div className="flex flex-col items-center">
				<span className="text-lg font-extrabold text-white">{ratingCount}</span>
				<span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold">Votes</span>
			</div>
			<div className="w-px h-7 bg-white/10" />
			<div className="flex flex-col items-center">
				<span className="text-lg font-extrabold text-white">{commentCount}</span>
				<span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-semibold">Comments</span>
			</div>
		</div>

		<div className="flex items-center gap-2 mt-3 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/5">
			<IoFlameOutline size={14} className="text-orange-400 flex-shrink-0" />
			<span className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold flex-shrink-0">Difficulty</span>
			<div className="flex gap-1 flex-1">
				{[1, 2, 3].map(i => (
					<div key={i} className={`flex-1 h-1 rounded-full ${i <= level ? 'bg-orange-500' : 'bg-white/[0.08]'}`} />
				))}
			</div>
			<span className="text-[11px] font-bold text-orange-400">{difficulty}</span>
		</div>
	</div>
));

PostCardImage.displayName = 'PostCardImage';

export default PostCardImage;
