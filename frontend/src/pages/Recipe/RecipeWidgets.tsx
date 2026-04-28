import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

export const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
	const config = {
		EASY: { label: 'Easy', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
		MEDIUM: { label: 'Medium', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
		HARD: { label: 'Hard', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
	};
	const { label, color } = config[difficulty as keyof typeof config] || config.MEDIUM;

	return (
		<span className={`px-3 py-1 rounded-full text-sm font-medium border ${color}`}>
			{label}
		</span>
	);
};

export const StarRating = ({ rating, onRate }: { rating: number; onRate?: (score: number) => void }) => {
	const [hover, setHover] = useState(0);

	return (
		<div className="flex items-center gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					onClick={() => onRate?.(star)}
					onMouseEnter={() => setHover(star)}
					onMouseLeave={() => setHover(0)}
					className={`transition-colors ${onRate ? 'cursor-pointer' : 'cursor-default'}`}
					disabled={!onRate}
				>
					<FiStar
						size={20}
						className={(hover || rating) >= star ? 'fill-orange-400 text-orange-400' : 'text-white/30'}
					/>
				</button>
			))}
		</div>
	);
};
