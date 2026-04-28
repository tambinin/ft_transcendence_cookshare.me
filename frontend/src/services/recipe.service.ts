import api from './api.client';
import { RECIPE } from '../constants/recipe.const';
import type {
	NewRecipeData,
	RecipeResponse,
	RecipeSummary,
	RecipeQueryParams,
	ApiResponse,
	PaginatedResponse,
	RecipeComment,
	CommentDTO,
	RatingDTO,
	RecipeDietaryTag,
	RecipeCategory,
} from '../types/recipe.type';

const recipeService = {
	/**
	 * @param params - Paramètres de requête (page, limit, categoryId, etc.)
	 */
	async getRecipes(params?: RecipeQueryParams): Promise<PaginatedResponse<RecipeSummary>> {
		const hasPagination = params && (params.page || params.limit);
		const hasFilters = params && (params.categoryId || params.difficulty || params.search || params.sortBy);
		const useSearch = hasPagination || hasFilters;
		const endpoint = useSearch ? RECIPE.SEARCH : RECIPE.RECIPES;
		const queryParams = useSearch ? { ...params, q: params?.search } : params;
		const response = await api.get<any>(endpoint, { params: queryParams });
		const raw = response.data;
		const normalize = (r: any): RecipeSummary => ({
			...r,
			primaryImage: r.primaryImage ?? (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null),
		});

		let recipes: RecipeSummary[];
		let pagination: PaginatedResponse<RecipeSummary>['pagination'];

		if (Array.isArray(raw.data)) {
			recipes = raw.data.map(normalize);
			pagination = {
				total: recipes.length,
				page: 1,
				limit: recipes.length,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
		} else if (raw.data?.recipes) {
			recipes = raw.data.recipes.map(normalize);
			const pg = raw.data.pagination ?? {};
			pagination = {
				total: pg.total ?? recipes.length,
				page: pg.page ?? 1,
				limit: pg.limit ?? (params?.limit ?? 10),
				totalPages: pg.totalPages ?? 1,
				hasNextPage: pg.hasNext ?? pg.hasNextPage ?? false,
				hasPrevPage: pg.hasPrev ?? pg.hasPrevPage ?? false,
			};
		} else {
			recipes = [];
			pagination = { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false };
		}

		return {
			status: 'success',
			message: raw.message ?? '',
			data: recipes,
			pagination,
		};
	},

	/**
	 * @param id - ID de la recette
	 */
	async getRecipeById(id: string): Promise<RecipeResponse> {
		const response = await api.get<ApiResponse<RecipeResponse>>(RECIPE.RECIPE(id));
		return response.data.data;
	},
	async getRecommended(): Promise<RecipeSummary[]> {
		const response = await api.get<ApiResponse<RecipeSummary[]>>(RECIPE.RECOMMENDED);
		return response.data.data;
	},

	async getMyRecipes(): Promise<RecipeSummary[]> {
		const response = await api.get<ApiResponse<{ recipes: any[]; pagination: any }>>(RECIPE.ME_RECIPES);
		return response.data.data.recipes.map((r: any) => ({
			...r,
			primaryImage: r.primaryImage ?? (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null),
		}));
	},

	/**
	 * @param query - Terme de recherche
	 * @param params - Filtres additionnels
	 */
	async searchRecipes(query: string, params?: Omit<RecipeQueryParams, 'search'>): Promise<PaginatedResponse<RecipeSummary>> {
		const response = await api.get<PaginatedResponse<RecipeSummary>>(RECIPE.SEARCH, {
			params: { ...params, q: query }
		});
		return response.data;
	},

	/**
	 * @param slug - Slug de la recette
	 */
	async getRecipeBySlug(slug: string): Promise<RecipeResponse> {
		const response = await api.get<ApiResponse<RecipeResponse>>(RECIPE.BY_SLUG(slug));
		return response.data.data;
	},

	/**
	 * @param recipeId - ID de la recette
	 */
	async addToFavorites(recipeId: string): Promise<void> {
		await api.post(RECIPE.FAVORITE(recipeId));
	},

	/**
	 * @param recipeId - ID de la recette
	 */
	async removeFromFavorites(recipeId: string): Promise<void> {
		await api.delete(RECIPE.FAVORITE(recipeId));
	},

	async getMyFavorites(): Promise<RecipeSummary[]> {
		const response = await api.get<ApiResponse<{ recipes: any[]; pagination: any }>>(RECIPE.MY_FAVORITES);
		const data = response.data.data;
		const recipes = Array.isArray(data) ? data : (data?.recipes ?? []);
		return recipes.map((r: any) => ({
			...r,
			primaryImage: r.primaryImage ?? (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null),
		}));
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param rating - Note (1-5)
	 */
	async addRating(recipeId: string, rating: RatingDTO): Promise<void> {
		await api.post(RECIPE.RATINGS(recipeId), rating);
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param rating - Nouvelle note (1-5)
	 */
	async updateRating(recipeId: string, rating: RatingDTO): Promise<void> {
		await api.put(RECIPE.RATINGS(recipeId), rating);
	},

	/**
	 * @param recipeId - ID de la recette
	 */
	async deleteRating(recipeId: string): Promise<void> {
		await api.delete(RECIPE.RATINGS(recipeId));
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param page - Page (1-based)
	 * @param limit - Nombre de commentaires par page
	 */
	async getComments(recipeId: string, page: number = 1, limit: number = 10): Promise<{ comments: RecipeComment[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
		const response = await api.get<ApiResponse<any>>(RECIPE.COMMENTS(recipeId), { params: { page, limit } });
		const data = response.data.data;
		const comments = data?.comments ?? data;
		return {
			comments: Array.isArray(comments) ? comments : [],
			pagination: data?.pagination ?? { page, limit, total: 0, totalPages: 1 },
		};
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param comment - Contenu du commentaire
	 */
	async addComment(recipeId: string, comment: CommentDTO): Promise<RecipeComment> {
		const response = await api.post<ApiResponse<RecipeComment>>(RECIPE.COMMENTS(recipeId), comment);
		return response.data.data;
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param commentId - ID du commentaire
	 * @param comment - Nouveau contenu
	 */
	async updateComment(recipeId: string, commentId: string, comment: CommentDTO): Promise<RecipeComment> {
		const response = await api.put<ApiResponse<RecipeComment>>(RECIPE.COMMENT(recipeId, commentId), comment);
		return response.data.data;
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param commentId - ID du commentaire
	 */
	async deleteComment(recipeId: string, commentId: string): Promise<void> {
		await api.delete(RECIPE.COMMENT(recipeId, commentId));
	},

	/**
	 * Répond à un commentaire
	 * @param recipeId - ID de la recette
	 * @param commentId - ID du commentaire parent
	 * @param reply - Contenu de la Answer
	 */
	async replyToComment(recipeId: string, commentId: string, reply: CommentDTO): Promise<RecipeComment> {
		const response = await api.post<ApiResponse<RecipeComment>>(RECIPE.REPLY(recipeId, commentId), reply);
		return response.data.data;
	},

	/**
	 * @param categoryId - ID de la catégorie
	 */
	async getByCategory(categoryId: string, params?: RecipeQueryParams): Promise<PaginatedResponse<RecipeSummary>> {
		const response = await api.get<PaginatedResponse<RecipeSummary>>(RECIPE.BY_CATEGORY(categoryId), { params });
		return response.data;
	},

	/**
	 * @param authorId - ID de l'auteur
	 */
	async getByAuthor(authorId: string, params?: RecipeQueryParams): Promise<PaginatedResponse<RecipeSummary>> {
		const response = await api.get<PaginatedResponse<RecipeSummary>>(RECIPE.BY_AUTHOR(authorId), { params });
		return response.data;
	},

	/**
	 * @param difficulty - EASY | MEDIUM | HARD
	 */
	async getByDifficulty(difficulty: 'EASY' | 'MEDIUM' | 'HARD', params?: RecipeQueryParams): Promise<PaginatedResponse<RecipeSummary>> {
		const response = await api.get<PaginatedResponse<RecipeSummary>>(RECIPE.BY_DIFFICULTY(difficulty), { params });
		return response.data;
	},

	/**
	 * @param recipeId - ID de la recette de référence
	 */
	async getSimilar(recipeId: string): Promise<RecipeSummary[]> {
		const response = await api.get<ApiResponse<RecipeSummary[]>>(RECIPE.SIMILAR(recipeId));
		return response.data.data;
	},

	/**
	 * Récupère la liste des catégories de recettes
	 */
	async getCategories(): Promise<RecipeCategory[]> {
		const response = await api.get<ApiResponse<RecipeCategory[]>>(RECIPE.CATEGORIES);
		return response.data.data;
	},

	/**
	 * @param data - Données de la recette
	 */
	async createRecipe(data: NewRecipeData): Promise<RecipeResponse> {
		const response = await api.post<ApiResponse<RecipeResponse>>(RECIPE.CREATE, data);
		return response.data.data;
	},

	/**
	 * @param id - ID de la recette
	 * @param data - Données à mettre à jour
	 */
	async updateRecipe(id: string, data: Partial<NewRecipeData>): Promise<RecipeResponse> {
		const response = await api.put<ApiResponse<RecipeResponse>>(RECIPE.RECIPE(id), data);
		return response.data.data;
	},

	/**
	 * @param id - ID de la recette
	 */
	async deleteRecipe(id: string): Promise<void> {
		await api.delete(RECIPE.RECIPE(id));
	},

	/**
	 * @param recipeId - ID de la recette
	 * @param imageFile - Fichier image
	 */
	async uploadRecipeImage(recipeId: string, imageFile: File): Promise<void> {
		const formData = new FormData();
		formData.append('image', imageFile);
		await api.post(RECIPE.UPLOAD_IMAGE(recipeId), formData);
	},

	/**
	 * Récupère tous les tags diététiques disponibles
	 */
	async getDietaryTags(): Promise<RecipeDietaryTag[]> {
		const response = await api.get<ApiResponse<RecipeDietaryTag[]>>(RECIPE.DIETARY_TAGS);
		return response.data.data;
	},
};

export default recipeService;