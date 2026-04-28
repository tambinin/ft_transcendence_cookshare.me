import { useState, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import recipeService from '../services/recipe.service';
import type {
	RecipeSummary,
	RecipeQueryParams,
	PaginationMeta,
	Difficulty,
} from '../types/recipe.type';

interface UseRecipesOptions {
	limit?: number;
	categoryId?: string;
	difficulty?: Difficulty;
	search?: string;
	autoLoad?: boolean;
}

interface UseRecipesReturn {
	recipes: RecipeSummary[];
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	pagination: PaginationMeta | null;
	hasNextPage: boolean;
	loadRecipes: () => Promise<void>;
	loadMore: () => Promise<void>;
	refresh: () => void;
	setFilters: (filters: Partial<RecipeQueryParams>) => void;
	filters: RecipeQueryParams;
}

export function useRecipes(options: UseRecipesOptions = {}): UseRecipesReturn {
	const {
		limit = 10,
		categoryId,
		difficulty,
		search,
		autoLoad = true,
	} = options;

	const queryClient = useQueryClient();
	const [filters, setFiltersState] = useState<RecipeQueryParams>({
		page: 1,
		limit,
		categoryId,
		difficulty,
		search,
	});

	const {
		data,
		isLoading,
		error: queryError,
		fetchNextPage,
		hasNextPage: hasNext,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['recipes', filters],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await recipeService.getRecipes({ ...filters, page: pageParam });
			return response;
		},
		getNextPageParam: (lastPage) => {
			if (lastPage.pagination?.hasNextPage) {
				return (lastPage.pagination.page || 1) + 1;
			}
			return undefined;
		},
		initialPageParam: 1,
		enabled: autoLoad,
	});

	const allRecipes = data?.pages.flatMap(page =>
		page.data.filter(recipe => recipe.author?.id)
	) ?? [];
	const lastPage = data?.pages[data.pages.length - 1];

	const loadRecipes = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['recipes', filters] });
	}, [queryClient, filters]);

	const loadMore = useCallback(async () => {
		if (hasNext && !isFetchingNextPage) {
			await fetchNextPage();
		}
	}, [hasNext, isFetchingNextPage, fetchNextPage]);

	const refresh = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['recipes'] });
	}, [queryClient]);

	const setFilters = useCallback((newFilters: Partial<RecipeQueryParams>) => {
		setFiltersState(prev => ({
			...prev,
			...newFilters,
			page: 1,
		}));
	}, []);

	return {
		recipes: allRecipes,
		isLoading,
		isLoadingMore: isFetchingNextPage,
		error: queryError ? (queryError instanceof Error ? queryError.message : 'Error while loading') : null,
		pagination: lastPage?.pagination ?? null,
		hasNextPage: hasNext ?? false,
		loadRecipes,
		loadMore,
		refresh,
		setFilters,
		filters,
	};
}

interface UseRecipeOptions {
	id?: string;
	slug?: string;
	autoLoad?: boolean;
}

interface UseRecipeReturn {
	recipe: import('../types/recipe.type').RecipeResponse | null;
	isLoading: boolean;
	error: string | null;
	loadRecipe: () => Promise<void>;
	refresh: () => Promise<void>;
}

export function useRecipe(options: UseRecipeOptions = {}): UseRecipeReturn {
	const { id, slug, autoLoad = true } = options;
	const queryClient = useQueryClient();

	const { data: recipe = null, isLoading, error: queryError } = useQuery({
		queryKey: ['recipe', id || slug],
		queryFn: async () => {
			if (id) return recipeService.getRecipeById(id);
			if (slug) return recipeService.getRecipeBySlug(slug);
			throw new Error('ID or slug required');
		},
		enabled: autoLoad && !!(id || slug),
	});

	const loadRecipe = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['recipe', id || slug] });
	}, [queryClient, id, slug]);

	return {
		recipe,
		isLoading,
		error: queryError ? (queryError instanceof Error ? queryError.message : 'Error') : null,
		loadRecipe,
		refresh: loadRecipe,
	};
}

export function useIngredients(autoLoad = true) {
	const queryClient = useQueryClient();

	const { data, isLoading, error: queryError } = useQuery({
		queryKey: ['ingredients'],
		queryFn: () => recipeService.getIngredients(),
		enabled: autoLoad,
	});

	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
	}, [queryClient]);

	return {
		ingredients: data,
		isLoading,
		error: queryError ? (queryError instanceof Error ? queryError.message : 'Error') : null,
	};
}

export function useMealPlans(autoLoad = true) {
	const queryClient = useQueryClient();

	const { data, isLoading, error: queryError } = useQuery({
		queryKey: ['meal-plans'],
		queryFn: () => recipeService.getMealPlans(),
		enabled: autoLoad,
	});

	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
	}, [queryClient]);

	return {
		plans: data,
		isLoading,
		error: queryError ? (queryError instanceof Error ? queryError.message : 'Error') : null,
	};
}

export function useRecommendedRecipes(autoLoad = true) {
	const queryClient = useQueryClient();

	const { data: recipes = [], isLoading, error: queryError } = useQuery({
		queryKey: ['recommended'],
		queryFn: () => recipeService.getRecommended(),
		enabled: autoLoad,
	});

	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['recommended'] });
	}, [queryClient]);

	return {
		recipes,
		isLoading,
		error: queryError ? (queryError instanceof Error ? queryError.message : 'Error') : null,
		refresh,
	};
}

export function useMyRecipes(autoLoad = true) {
	const queryClient = useQueryClient();

	const { data: recipes = [], isLoading, error: queryError } = useQuery({
		queryKey: ['my-recipes'],
		queryFn: () => recipeService.getMyRecipes(),
		enabled: autoLoad,
	});

	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ['my-recipes'] });
	}, [queryClient]);

	return {
		recipes,
		isLoading,
		error: queryError ? (queryError instanceof Error ? queryError.message : 'Error') : null,
		refresh,
	};
}

export default useRecipes;
