import React from 'react';
import { FiStar, FiFlag, FiFolder, FiShoppingCart } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { MdOutdoorGrill } from 'react-icons/md';
import type { PostCardActionsProps } from './postCard.types';

const PostCardActions = React.memo(({
	isOwnRecipe, isAuthenticated, isFavorite, toggleFavorite,
	averageScore, displayScore, setHoverRating, rateRecipe,
	onOpenModal, onSaveToCollection, onAddToShoppingList,
	addedToShoppingList, addingToShoppingList, isInShoppingList, onReport,
}: PostCardActionsProps) => (
	<div className="flex items-center justify-between pt-3.5 border-t border-white/5 mt-4">
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map(star => (
				<button
					key={star}
					onClick={() => !isOwnRecipe && rateRecipe(star)}
					onMouseEnter={() => !isOwnRecipe && setHoverRating(star)}
					onMouseLeave={() => !isOwnRecipe && setHoverRating(0)}
					className={`transition-colors ${isOwnRecipe ? 'cursor-default' : 'cursor-pointer'}`}
					disabled={isOwnRecipe}
				>
					{star <= displayScore
						? <FaStar size={14} className="text-orange-400" />
						: <FiStar size={14} className="text-slate-400" />}
				</button>
			))}
			<span className="text-xs text-slate-400 ml-1">{averageScore.toFixed(1)}</span>
		</div>

		<div className="flex items-center gap-2">
			<button
				onClick={toggleFavorite}
				className={`p-2 rounded-xl transition-all duration-300 ${isFavorite ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-orange-300'}`}
				title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				{isFavorite ? <BsBookmarkFill size={18} /> : <BsBookmark size={18} />}
			</button>
			{isAuthenticated && (
				<button
					onClick={onSaveToCollection}
					className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-orange-300 transition-all duration-300"
					title="Save to collection"
				>
					<FiFolder size={18} />
				</button>
			)}
			{isAuthenticated && (
				<button
					onClick={onAddToShoppingList}
					disabled={addingToShoppingList || addedToShoppingList || isInShoppingList}
					className={`p-2 rounded-xl transition-all duration-300 ${
						isInShoppingList
							? 'bg-orange-500/15 text-orange-400'
							: addedToShoppingList
								? 'bg-green-500/10 text-green-400'
								: addingToShoppingList
									? 'bg-white/5 text-white/20'
									: 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-orange-300'
					}`}
					title={isInShoppingList ? 'Already in shopping list' : addedToShoppingList ? 'Added to shopping list!' : 'Add ingredients to shopping list'}
				>
					<FiShoppingCart size={18} />
				</button>
			)}
			{isAuthenticated && !isOwnRecipe && (
				<button
					onClick={onReport}
					className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
					title="Report"
				>
					<FiFlag size={18} />
				</button>
			)}
			<button
				onClick={onOpenModal}
				className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-orange-300 transition-all duration-300"
				title="View recipe"
			>
				<MdOutdoorGrill size={18} />
			</button>
		</div>
	</div>
));

PostCardActions.displayName = 'PostCardActions';

export default PostCardActions;
