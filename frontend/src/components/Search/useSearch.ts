import { useState, useEffect, useCallback } from 'react';
import socialService from '../../services/social.service';
import recipeService from '../../services/recipe.service';
import { useAuth } from '../../contexts/auth.context';
import logger from '../../utils/logger';
import {
	getSearchHistory,
	addSearchHistory,
	removeSearchHistoryItem,
	type SearchHistoryItem,
} from '../../utils/search-history.utils';
import type { SearchUser } from '../../types/social.type';
import type { RecipeSummary, RecipeDietaryTag, RecipeCategory } from '../../types/recipe.type';
import type { SearchTab, SearchResults } from './search.types';
import { EMPTY_RESULTS } from './search.types';

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);
	useEffect(() => {
		const h = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(h);
	}, [value, delay]);
	return debouncedValue;
}

export function useSearch() {
	const { user: currentUser } = useAuth();

	const [query, setQuery] = useState('');
	const [activeTab, setActiveTab] = useState<SearchTab>('all');
	const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
	const [isLoading, setIsLoading] = useState(false);
	const [allTags, setAllTags] = useState<RecipeDietaryTag[]>([]);
	const [allCategories, setAllCategories] = useState<RecipeCategory[]>([]);
	const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

	const debouncedQuery = useDebounce(query, 300);

	useEffect(() => {
		const load = async () => {
			try {
				const [tags, categories] = await Promise.all([
					recipeService.getDietaryTags(),
					recipeService.getCategories(),
				]);
				setAllTags(tags);
				setAllCategories(categories);
			} catch (err) {
				logger.error('[Search] Error loading tags/categories:', err);
			}
		};
		load();
		setSearchHistory(getSearchHistory(currentUser?.id));
	}, [currentUser?.id]);

	useEffect(() => {
		const performSearch = async () => {
			if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
				setResults(EMPTY_RESULTS);
				return;
			}

			setIsLoading(true);
			const lowerQ = debouncedQuery.toLowerCase();

			const matchedTags = allTags
				.filter(t => t.name.toLowerCase().includes(lowerQ))
				.slice(0, 5);

			const matchedCategories = allCategories
				.filter(c => c.name.toLowerCase().includes(lowerQ))
				.slice(0, 5);

			try {
				const [usersRes, recipesRes] = await Promise.all([
					socialService.searchUsers(debouncedQuery, 8),
					recipeService.searchRecipes(debouncedQuery, { limit: 8 }),
				]);

				const users: SearchUser[] = 'data' in usersRes ? usersRes.data : [];
				const recipesData: any = 'data' in recipesRes ? recipesRes.data : null;
				const baseRecipes: RecipeSummary[] = Array.isArray(recipesData)
					? recipesData
					: Array.isArray(recipesData?.recipes)
						? recipesData.recipes
						: [];

				const tagIds = matchedTags.map(t => t.id);
				const categoryIds = matchedCategories.map(c => c.id);
				const allRecipes = [...baseRecipes];

				if (tagIds.length > 0 || categoryIds.length > 0) {
					const extraPromises: Promise<any>[] = [];

					if (tagIds.length > 0) {
						extraPromises.push(
							recipeService.searchRecipes('', { limit: 5, dietaryTagIds: tagIds })
								.catch(() => ({ data: [] as RecipeSummary[] }))
						);
					}

					for (const catId of categoryIds.slice(0, 2)) {
						extraPromises.push(
							recipeService.getByCategory(catId, { limit: 3 })
								.catch(() => ({ data: [] as RecipeSummary[] }))
						);
					}

					if (extraPromises.length > 0) {
						const extraResults = await Promise.all(extraPromises);
						const existingIds = new Set(allRecipes.map(r => r.id));

						for (const res of extraResults) {
							const rawData = 'data' in res ? res.data : null;
							const items: RecipeSummary[] = Array.isArray(rawData)
								? rawData
								: Array.isArray(rawData?.recipes)
									? rawData.recipes
									: [];
							for (const r of items) {
								if (!existingIds.has(r.id)) {
									allRecipes.push(r);
									existingIds.add(r.id);
								}
							}
						}
					}
				}

				setResults({
					users,
					recipes: allRecipes,
					tags: matchedTags,
					categories: matchedCategories,
				});
			} catch (err) {
				logger.error('[Search] Error:', err);
			} finally {
				setIsLoading(false);
			}
		};

		performSearch();
	}, [debouncedQuery, allTags, allCategories]);

	const addToHistory = useCallback(
		(item: Omit<SearchHistoryItem, 'timestamp'>) => {
			addSearchHistory(item, currentUser?.id);
			setSearchHistory(getSearchHistory(currentUser?.id));
		},
		[currentUser?.id],
	);

	const removeFromHistory = useCallback(
		(id: string, type: string) => {
			removeSearchHistoryItem(id, type, currentUser?.id);
			setSearchHistory(getSearchHistory(currentUser?.id));
		},
		[currentUser?.id],
	);

	const filteredResults: SearchResults = {
		users: activeTab === 'all' || activeTab === 'users' ? results.users : [],
		recipes: activeTab === 'all' || activeTab === 'recipes' ? results.recipes : [],
		tags: activeTab === 'all' || activeTab === 'tags' ? results.tags : [],
		categories: activeTab === 'all' || activeTab === 'categories' ? results.categories : [],
	};

	const counts: Record<SearchTab, number> = {
		all: results.users.length + results.recipes.length + results.tags.length + results.categories.length,
		users: results.users.length,
		recipes: results.recipes.length,
		tags: results.tags.length,
		categories: results.categories.length,
	};

	const hasResults = counts.all > 0;
	const showNoResults = !isLoading && debouncedQuery.length >= 2 && !hasResults;

	return {
		query, setQuery,
		activeTab, setActiveTab,
		filteredResults, counts,
		isLoading, hasResults, showNoResults, debouncedQuery,
		searchHistory, addToHistory, removeFromHistory,
	};
}
