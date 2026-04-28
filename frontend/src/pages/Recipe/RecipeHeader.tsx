import { Link } from 'react-router-dom';
import { BiTimeFive } from 'react-icons/bi';
import { TbUsers } from 'react-icons/tb';
import OnlineAvatar from '../../components/OnlineAvatar';
import { DifficultyBadge, StarRating } from './RecipeWidgets';

interface RecipeHeaderProps {
	difficulty: string;
	category?: { name: string } | null;
	title: string;
	author: { id: string; username: string; avatarUrl?: string };
	createdAt: string;
	totalTime: number;
	servings: number;
	averageScore: number;
	ratingCount: number;
	viewCount: number;
}

const RecipeHeader = ({ difficulty, category, title, author, createdAt, totalTime, servings, averageScore, ratingCount, viewCount }: RecipeHeaderProps) => (
	<div className="mb-8">
		<div className="flex items-center gap-3 mb-3">
			<DifficultyBadge difficulty={difficulty} />
			{category && (
				<span className="px-3 py-1 rounded-full text-sm font-medium text-orange-400 bg-orange-400/10 border border-orange-400/30">
					{category.name}
				</span>
			)}
		</div>

		{/* RESPONSIVE FIX: responsive title sizing */}
		<h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">{title}</h1>

		<Link to={`/profile/${author.id}`} className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
			<OnlineAvatar
				userId={author.id}
				avatarUrl={author.avatarUrl}
				username={author.username}
				size="lg"
				className="w-12 h-12 rounded-full border-2 border-orange-400/50 object-cover"
			/>
			<div>
				<p className="font-semibold">{author.username}</p>
				<p className="text-white/60 text-sm">
					Published on {new Date(createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
				</p>
			</div>
		</Link>

		<div className="flex flex-wrap gap-6">
			<div className="flex items-center gap-2">
				<BiTimeFive size={20} className="text-blue-400" />
				<span className="text-white/80">{totalTime} min</span>
			</div>
			<div className="flex items-center gap-2">
				<TbUsers size={20} className="text-green-400" />
				<span className="text-white/80">{servings} servings</span>
			</div>
			<div className="flex items-center gap-2">
				<StarRating rating={averageScore} />
				<span className="text-white/80">({ratingCount} reviews)</span>
			</div>
			<div className="flex items-center gap-2 text-white/60">
				<span>{viewCount} views</span>
			</div>
		</div>
	</div>
);

export default RecipeHeader;
