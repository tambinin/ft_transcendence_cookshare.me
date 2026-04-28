import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { useSearch } from './useSearch';
import { useRecipeModal } from '../../contexts/recipe.context';
import SearchInput from './SearchInput';
import SearchTabs from './SearchTabs';
import SearchHistory from './SearchHistory';
import SearchResultsView from './SearchResults';
import type { SearchHistoryItem } from '../../utils/search-history.utils';
import type { SearchUser } from '../../types/social.type';
import type { RecipeSummary, RecipeDietaryTag, RecipeCategory } from '../../types/recipe.type';

const Search = () => {
	const navigate = useNavigate();
	const { openRecipeModal } = useRecipeModal();
	const [isOpen, setIsOpen] = useState(false);
	const [isMobileExpanded, setIsMobileExpanded] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		query, setQuery,
		activeTab, setActiveTab,
		filteredResults, counts,
		isLoading, hasResults, showNoResults, debouncedQuery,
		searchHistory, addToHistory, removeFromHistory,
	} = useSearch();

	/* Close on outside click */
	useEffect(() => {
		const close = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setIsMobileExpanded(false);
			}
		};
		document.addEventListener('mousedown', close);
		return () => document.removeEventListener('mousedown', close);
	}, []);

	/* Reset mobile expansion on resize */
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 640 && isMobileExpanded) setIsMobileExpanded(false);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [isMobileExpanded]);

	/* ── Navigation helpers ───────────────────────────────────── */
	const closeAndReset = () => {
		setIsOpen(false);
		setQuery('');
		setIsMobileExpanded(false);
	};

	const handleUserClick = (userId: string, user: SearchUser) => {
		addToHistory({
			id: userId, query: user.username, type: 'user',
			metadata: { username: user.username, avatarUrl: user.avatarUrl || undefined },
		});
		closeAndReset();
		navigate(`/profile/${userId}`);
	};

	const handleRecipeClick = (recipeId: string, recipe: RecipeSummary) => {
		addToHistory({
			id: recipeId, query: recipe.title, type: 'recipe',
			metadata: { title: recipe.title, imageUrl: recipe.primaryImage?.url },
		});
		closeAndReset();
		openRecipeModal(recipeId);
	};

	const handleTagClick = (tag: RecipeDietaryTag) => {
		setQuery(tag.name);
		setActiveTab('recipes');
	};

	const handleCategoryClick = (category: RecipeCategory) => {
		closeAndReset();
		navigate(`/recipes?category=${category.id}`);
	};

	const handleHistoryItemClick = (item: SearchHistoryItem) => {
		if (item.type === 'user') navigate(`/profile/${item.id}`);
		else openRecipeModal(item.id);
		closeAndReset();
	};

	const handleRemoveHistoryItem = (e: React.MouseEvent, id: string, type: string) => {
		e.stopPropagation();
		removeFromHistory(id, type);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && query.trim()) closeAndReset();
		if (e.key === 'Escape') closeAndReset();
	};

	const showEmptyState = query.length < 2 && searchHistory.length === 0;

	return (
		<div
			className={`group flex items-center justify-center ${isMobileExpanded ? 'fixed inset-x-0 top-0 z-[70] px-3 pt-3' : 'w-auto sm:w-75 md:w-87.5 lg:w-112.5 relative'}`}
			ref={menuRef}
		>
			{/* Mobile search icon — compact button in navbar */}
			{!isMobileExpanded && (
				<button
					onClick={() => { setIsMobileExpanded(true); setIsOpen(true); }}
					className="sm:hidden flex items-center justify-center p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-orange-500 min-h-[40px] min-w-[40px]"
				>
					<FaSearch size={18} />
				</button>
			)}

			{/* Search bar — expanded mobile overlay or desktop inline */}
			<div className={`${isMobileExpanded
				? 'flex items-center w-full bg-[var(--cook-bg)] border border-white/10 rounded-2xl px-2 py-1.5 shadow-2xl gap-2'
				: 'hidden sm:flex relative w-full items-center'
			}`}>
				{/* Mobile close/back button */}
				{isMobileExpanded && (
					<button
						onClick={() => { setIsMobileExpanded(false); setIsOpen(false); setQuery(''); }}
						className="sm:hidden flex items-center justify-center p-2 text-gray-400 hover:text-white shrink-0 min-h-[40px] min-w-[40px]"
						aria-label="Close search"
					>
						<IoClose size={22} />
					</button>
				)}

				<SearchInput
					query={query}
					setQuery={setQuery}
					isLoading={isLoading}
					isMobileExpanded={isMobileExpanded}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					onMobileBack={() => { setIsMobileExpanded(false); setIsOpen(false); setQuery(''); }}
					inputRef={inputRef}
				/>

				{/* Dropdown */}
				{isOpen && (
					<div className="absolute left-0 w-full mt-2.5 bg-[var(--cook-bg)] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-70 top-full">
						<SearchTabs activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />

						<div className="max-h-100 overflow-y-auto">
							{/* History (when no query) */}
							{!isLoading && query.length === 0 && (
								<SearchHistory
									items={searchHistory}
									onItemClick={handleHistoryItemClick}
									onRemoveItem={handleRemoveHistoryItem}
								/>
							)}

							{/* Results / empty / no-results */}
							<SearchResultsView
								results={filteredResults}
								isLoading={isLoading}
								showNoResults={showNoResults}
								showEmptyState={showEmptyState && query.length === 0 && searchHistory.length === 0}
								debouncedQuery={debouncedQuery}
								onUserClick={handleUserClick}
								onRecipeClick={handleRecipeClick}
								onTagClick={handleTagClick}
								onCategoryClick={handleCategoryClick}
							/>
						</div>

						{/* Footer */}
						{hasResults && (
							<div className="bg-orange-500/5 px-4 py-2 text-center border-t border-gray-800">
								<p className="text-xs text-gray-400">
									Appuyez sur <kbd className="bg-gray-800 px-1 rounded text-orange-500">Entrée</kbd> pour voir tous les résultats
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Search;
