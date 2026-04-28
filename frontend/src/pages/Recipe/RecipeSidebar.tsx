import { GiCampCookingPot } from 'react-icons/gi';
import { FiShoppingCart } from 'react-icons/fi';

interface Ingredient {
	id: string;
	name: string;
	quantityText: string;
	isOptional?: boolean;
}

interface DietaryTag {
	id: string;
	name: string;
}

interface RecipeSidebarProps {
	servings: number;
	ingredients?: Ingredient[];
	dietaryTags?: DietaryTag[];
	isAuthenticated: boolean;
	shoppingAdded: boolean;
	onAddToShoppingList: () => void;
}

const RecipeSidebar = ({ servings, ingredients, dietaryTags, isAuthenticated, shoppingAdded, onAddToShoppingList }: RecipeSidebarProps) => (
	// RESPONSIVE FIX: sidebar not sticky on mobile (stacks under content)
	<div className="space-y-6">
		{/* RESPONSIVE FIX: reduce padding on mobile */}
		<section className="bg-white/5 rounded-xl p-3 sm:p-4 md:p-6 border border-white/10 lg:sticky lg:top-6">
			<h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-3">
				<GiCampCookingPot className="text-orange-400" />
				Ingredients
			</h2>
			<p className="text-white/60 text-sm mb-4">For {servings} servings</p>
			{/* RESPONSIVE FIX: ingredient list with readable text */}
			<ul className="space-y-2 sm:space-y-3">
				{ingredients?.map((ingredient) => (
					<li key={ingredient.id} className="flex items-center gap-3">
						{/* RESPONSIVE FIX: checkbox stays compact */}
						<input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-400 focus:ring-orange-400/50 shrink-0" />
						<span className="text-sm sm:text-base text-white/80 break-words">
							<span className="font-medium text-orange-300">{ingredient.quantityText}</span>
							{' '}{ingredient.name}
							{ingredient.isOptional && <span className="text-white/40 text-sm ml-2">(optional)</span>}
						</span>
					</li>
				))}
			</ul>

			{isAuthenticated && (
				<button
					onClick={onAddToShoppingList}
					className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
						shoppingAdded
							? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
							: 'bg-orange-500 hover:bg-orange-600 text-white'
					}`}
				>
					<FiShoppingCart size={18} />
					{shoppingAdded ? 'Added to list!' : 'Add to shopping list'}
				</button>
			)}

			{dietaryTags && dietaryTags.length > 0 && (
				<div className="mt-6 pt-6 border-t border-white/10">
					<p className="text-white/60 text-sm mb-3">Tags</p>
					<div className="flex flex-wrap gap-2">
						{dietaryTags.map((tag) => (
							<span key={tag.id} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10">
								{tag.name}
							</span>
						))}
					</div>
				</div>
			)}
		</section>
	</div>
);

export default RecipeSidebar;
