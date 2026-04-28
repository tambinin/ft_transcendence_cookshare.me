import { BiArrowBack } from 'react-icons/bi';
import { FiHeart, FiShare2, FiEdit2, FiFlag } from 'react-icons/fi';

interface RecipeHeroProps {
	imageUrl: string;
	title: string;
	isFavorite: boolean;
	isOwnRecipe: boolean | '' | undefined;
	isAuthenticated: boolean;
	recipeId: string;
	onBack: () => void;
	onEdit: () => void;
	onToggleFavorite: () => void;
	onReport: (type: string, id: string) => void;
}

const RecipeHero = ({ imageUrl, title, isFavorite, isOwnRecipe, isAuthenticated, recipeId, onBack, onEdit, onToggleFavorite, onReport }: RecipeHeroProps) => (
	// RESPONSIVE FIX: reduce hero height on mobile
	<div className="relative h-56 sm:h-80 md:h-96">
		<img src={imageUrl} alt={title} loading="lazy" className="w-full h-full object-cover" />
		<div className="absolute inset-0 bg-linear-to-t from-(--cook-bg) via-(--cook-bg)/50 to-transparent" />

		{/* RESPONSIVE FIX: adjust back button position on mobile */}
	<button onClick={onBack} className="absolute top-4 left-3 sm:top-6 sm:left-6 p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
			<BiArrowBack size={24} />
		</button>

		{/* RESPONSIVE FIX: adjust action buttons position on mobile */}
	<div className="absolute top-4 right-3 sm:top-6 sm:right-6 flex gap-2 sm:gap-3">
			{isOwnRecipe && (
				<button onClick={onEdit} className="p-3 bg-black/40 hover:bg-orange-500/80 rounded-full backdrop-blur-sm transition-colors" title="Edit recipe">
					<FiEdit2 size={24} />
				</button>
			)}
			<button
				onClick={onToggleFavorite}
				className={`p-3 rounded-full backdrop-blur-sm transition-colors ${isFavorite ? 'bg-red-500 text-white' : 'bg-black/40 hover:bg-black/60'}`}
			>
				<FiHeart size={24} className={isFavorite ? 'fill-current' : ''} />
			</button>
			<button onClick={() => navigator.clipboard.writeText(window.location.href)} className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors">
				<FiShare2 size={24} />
			</button>
			{isAuthenticated && !isOwnRecipe && (
				<button onClick={() => onReport('RECIPE', recipeId)} className="p-3 bg-black/40 hover:bg-red-500/40 rounded-full backdrop-blur-sm transition-colors" title="Report recipe">
					<FiFlag size={24} />
				</button>
			)}
		</div>
	</div>
);

export default RecipeHero;
