import { FiSend } from 'react-icons/fi';
import { StarRating } from './RecipeWidgets';

interface RecipeReviewProps {
	userRating: number;
	comment: string;
	typingCount: number;
	onRate: (score: number) => void;
	onCommentChange: (value: string) => void;
	onCommentSubmit: () => void;
	onCommentBlur: () => void;
}

// RESPONSIVE FIX: reduce padding on mobile, stack input + button on mobile
const RecipeReview = ({ userRating, comment, typingCount, onRate, onCommentChange, onCommentSubmit, onCommentBlur }: RecipeReviewProps) => (
	<section className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
		<h3 className="text-lg font-semibold mb-4">Leave a review</h3>
		{/* RESPONSIVE FIX: stack rating label and stars on very small screens */}
		<div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
			<span className="text-white/60">Your rating:</span>
			<StarRating rating={userRating} onRate={onRate} />
		</div>
		{typingCount > 0 && (
			<p className="text-sm text-slate-400 italic mb-2 animate-pulse">Someone is typing...</p>
		)}
		{/* RESPONSIVE FIX: stack input + button on mobile, ensure 16px font-size */}
		<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
			<input
				type="text"
				value={comment}
				onChange={(e) => onCommentChange(e.target.value)}
				onKeyDown={(e) => e.key === 'Enter' && onCommentSubmit()}
				onBlur={onCommentBlur}
				placeholder="Leave a comment..."
				className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base sm:text-sm focus:border-orange-400/50 outline-none transition-colors"
			/>
			{/* RESPONSIVE FIX: full-width send button on mobile, min touch target */}
			<button
				onClick={onCommentSubmit}
				disabled={!comment.trim()}
				className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
			>
				<FiSend size={20} />
			</button>
		</div>
	</section>
);

export default RecipeReview;
