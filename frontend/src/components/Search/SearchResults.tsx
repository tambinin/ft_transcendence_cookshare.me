import { FaSearch, FaUser, FaTag } from 'react-icons/fa';
import { MdRestaurantMenu, MdCategory } from 'react-icons/md';
import OnlineAvatar from '../OnlineAvatar';
import type { SearchResults } from './search.types';
import type { SearchUser } from '../../types/social.type';
import type { RecipeSummary, RecipeDietaryTag, RecipeCategory } from '../../types/recipe.type';

interface SearchResultsViewProps {
	results: SearchResults;
	isLoading: boolean;
	showNoResults: boolean;
	showEmptyState: boolean;
	debouncedQuery: string;
	onUserClick: (id: string, user: SearchUser) => void;
	onRecipeClick: (id: string, recipe: RecipeSummary) => void;
	onTagClick: (tag: RecipeDietaryTag) => void;
	onCategoryClick: (category: RecipeCategory) => void;
}

/* ── Section component ────────────────────────────────────────── */
const Section = ({
	icon, title, count, children,
}: {
	icon: React.ReactNode; title: string; count?: number; children: React.ReactNode;
}) => (
	<div>
		<div className="px-4 py-2 border-b border-gray-800/50">
			<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
				{icon} {title}{count !== undefined ? ` (${count})` : ''}
			</span>
		</div>
		<ul className="py-1">{children}</ul>
	</div>
);

/* ── Main results view ────────────────────────────────────────── */
const SearchResultsView = ({
	results, isLoading, showNoResults, showEmptyState, debouncedQuery,
	onUserClick, onRecipeClick, onTagClick, onCategoryClick,
}: SearchResultsViewProps) => {
	if (isLoading) {
		return (
			<div className="px-4 py-8 text-center">
				<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto" />
				<p className="text-gray-500 text-sm mt-2">Searching... chill out</p>
			</div>
		);
	}

	if (showEmptyState) {
		return (
			<div className="py-8">
				<div className="flex flex-col items-center justify-center gap-3 text-center px-4">
					<div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
						<FaSearch className="text-orange-500/60 text-lg" />
					</div>
					<div>
						<p className="text-sm font-medium text-white/70 mb-1">Start typing to search</p>
						<p className="text-xs text-gray-500">Tapez au moins 2 caractères pour trouver des recettes, utilisateurs, tags ou catégories</p>
					</div>
					<div className="flex gap-2 mt-2 flex-wrap justify-center">
						<span className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-500">@username</span>
						<span className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-500">Poulet rôti</span>
						<span className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-500">#vegan</span>
						<span className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-500">Desserts</span>
					</div>
				</div>
			</div>
		);
	}

	if (showNoResults) {
		return (
			<div className="px-4 py-8 text-center">
				<FaSearch className="text-gray-600 text-2xl mx-auto mb-2" />
				<p className="text-gray-500 text-sm">Big blank. Nothing found for &quot;{debouncedQuery}&quot;</p>
			</div>
		);
	}

	return (
		<>
			{/* Tags */}
			{results.tags.length > 0 && (
				<Section icon={<FaTag size={10} />} title="Tags">
					{results.tags.map(tag => (
						<li
							key={tag.id}
							onClick={() => onTagClick(tag)}
							className="px-4 py-2 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors"
						>
							<div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
								<FaTag className="text-orange-400 text-xs" />
							</div>
							<div className="grow min-w-0">
								<p className="text-sm font-medium text-white truncate">#{tag.name}</p>
								<p className="text-xs text-gray-500 truncate">Voir les recettes avec ce tag</p>
							</div>
						</li>
					))}
				</Section>
			)}

			{/* Categories */}
			{results.categories.length > 0 && (
				<Section icon={<MdCategory size={12} />} title="Catégories">
					{results.categories.map(cat => (
						<li
							key={cat.id}
							onClick={() => onCategoryClick(cat)}
							className="px-4 py-2 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors"
						>
							<div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
								<MdCategory className="text-violet-400 text-sm" />
							</div>
							<div className="grow min-w-0">
								<p className="text-sm font-medium text-white truncate">{cat.name}</p>
								<p className="text-xs text-gray-500 truncate">Voir les recettes de cette catégorie</p>
							</div>
						</li>
					))}
				</Section>
			)}

			{/* Users */}
			{results.users.length > 0 && (
				<Section icon={<FaUser size={10} />} title="Utilisateurs" count={results.users.length}>
					{results.users.map(user => (
						<li
							key={user.id}
							onClick={() => onUserClick(user.id, user)}
							className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-all duration-200 active:bg-white/10"
						>
							<OnlineAvatar
								userId={user.id}
								avatarUrl={user.avatarUrl}
								username={user.username}
								size="md"
								className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 hover:border-orange-500/50 transition-colors"
							/>
							<div className="grow min-w-0">
								<p className="text-sm font-semibold text-white truncate">{user.username}</p>
								<p className="text-xs text-gray-500 truncate">{user.firstName || ''} {user.lastName || ''}</p>
							</div>
							<div className="shrink-0 text-xs text-gray-600 hover:text-orange-500 transition-colors">→</div>
						</li>
					))}
				</Section>
			)}

			{/* Recipes */}
			{results.recipes.length > 0 && (
				<Section icon={<MdRestaurantMenu size={12} />} title="Recettes" count={results.recipes.length}>
					{results.recipes.map(recipe => (
						<li
							key={recipe.id}
							onClick={() => onRecipeClick(recipe.id, recipe)}
							className="px-4 py-2 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors"
						>
							{recipe.primaryImage?.url ? (
								<img
									src={recipe.primaryImage.url}
									alt={recipe.title}
									className="w-10 h-10 rounded-lg object-cover border border-gray-700"
								/>
							) : (
								<div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
									<MdRestaurantMenu className="text-gray-600" />
								</div>
							)}
							<div className="grow min-w-0">
								<p className="text-sm font-medium text-white truncate">{recipe.title}</p>
								<div className="flex items-center gap-2 text-xs text-gray-500">
									<span className="truncate">par {recipe.author?.username || 'Anonyme'}</span>
									{recipe.category && (
										<span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 shrink-0">
											{recipe.category.name}
										</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-1 text-xs text-orange-400 shrink-0">
								<span>★</span>
								<span>{recipe.averageScore?.toFixed(1) || '-'}</span>
							</div>
						</li>
					))}
				</Section>
			)}
		</>
	);
};

export default SearchResultsView;
