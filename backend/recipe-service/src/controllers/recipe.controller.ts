import { FastifyRequest, FastifyReply } from "fastify";
import {
    createRecipe,
    getAllRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    getRecipeBySlug,
    rateRecipe,
    getRecipeRatings,
    removeRecipeRating,
    getAllRecipesBySearch,
    addToFavorites,
    removeFromFavorites,
    getUserFavorites,
    getRecipesByCategory,
    getRecipesByAuthor,
    getRecipesByDifficulty,
    getMyRecipes
} from "../services/recipe.service";
import {
    getSimilarRecipes,
    getRecommendedRecipes
} from "../services/recommendation.service";
import { getCategoryById } from "../services/category.service";
import { logInteraction } from "../services/interaction.service";
import { InteractionType } from "../generated/prisma";

import {
    sendSuccess,
    sendCreated,
    sendDeleted,
    ForbiddenError,
    NotFoundError
} from "@transcendence/common";
import { z } from "zod";

// ==================== SCHEMAS ====================

export const createRecipeSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
    ingredients: z.array(z.object({
        name: z.string().min(1),
        quantityText: z.string().min(1),
        isOptional: z.boolean().optional()
    })),
    instructions: z.array(z.object({
        stepNumber: z.number().int().min(1),
        description: z.string().min(1)
    })),
    prepTime: z.number().int().min(0),
    cookTime: z.number().int().min(0),
    servings: z.number().int().min(1),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    categoryId: z.string().min(1, "Category is required"),
    isPublished: z.boolean().optional(),
    dietaryTagIds: z.array(z.string()).optional()
});

export const updateRecipeSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    ingredients: z.array(z.object({
        name: z.string().min(1),
        quantityText: z.string().min(1),
        isOptional: z.boolean().optional()
    })).optional(),
    instructions: z.array(z.object({
        stepNumber: z.number().int().min(1),
        description: z.string().min(1)
    })).optional(),
    prepTime: z.number().int().min(0).optional(),
    cookTime: z.number().int().min(0).optional(),
    servings: z.number().int().min(1).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    categoryId: z.string().optional(),
    isPublished: z.boolean().optional(),
    dietaryTagIds: z.array(z.string()).optional()
});

export const ratingSchema = z.object({
    score: z.number().min(1).max(5)
});

// ==================== HELPERS ====================

const validSortBy = ['createdAt', 'title', 'prepTime', 'cookTime', 'viewCount', 'rating'] as const;
const validSortOrder = ['asc', 'desc'] as const;
const validDifficulties = ['EASY', 'MEDIUM', 'HARD'] as const;

function parsePagination(query: any) {
    return {
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 10,
        sortBy: query.sortBy && validSortBy.includes(query.sortBy) ? query.sortBy as typeof validSortBy[number] : 'createdAt',
        sortOrder: query.sortOrder && validSortOrder.includes(query.sortOrder) ? query.sortOrder as typeof validSortOrder[number] : 'desc'
    };
}

// ==================== RECIPE CRUD ====================

export async function getAllRecipesHandler(request: FastifyRequest, reply: FastifyReply) {
    request.log.info({ userId: request.user?.id, url: request.url }, '[getAllRecipesHandler] called');
    const query = request.query as { page?: string; limit?: string };
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const data = await getAllRecipes(request.user?.id, page, limit);
    sendSuccess(reply, data, 'Recipes retrieved successfully');
}

export async function createRecipeHandler(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof createRecipeSchema>;
    const recipe = await createRecipe({
        ...body,
        authorId: request.user!.id
    });
    sendCreated(reply, recipe, 'Recipe created successfully');
}

export async function getRecipeByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const recipe = await getRecipeById(id, request.user?.id);
    if (!recipe) {
        throw new NotFoundError('Recipe not found');
    }

    if (request.user) {
        logInteraction(request.user.id, InteractionType.VIEW_RECIPE, { recipeId: id });
    }

    sendSuccess(reply, recipe, 'Recipe retrieved successfully');
}

export async function updateRecipeHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const existingRecipe = await getRecipeById(id);
    if (!existingRecipe) {
        throw new NotFoundError('Recipe not found');
    }
    if (existingRecipe.authorId !== request.user!.id) {
        throw new ForbiddenError('You do not have access to update this recipe');
    }
    const body = request.body as z.infer<typeof updateRecipeSchema>;
    const recipe = await updateRecipe(id, body);
    sendSuccess(reply, recipe, 'Recipe updated successfully');
}

export async function deleteRecipeHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const existingRecipe = await getRecipeById(id);
    if (!existingRecipe) {
        throw new NotFoundError('Recipe not found');
    }
    if (existingRecipe.authorId !== request.user!.id) {
        throw new ForbiddenError('You do not have access to delete this recipe');
    }
    const recipe = await deleteRecipe(id);
    sendDeleted(reply, recipe, 'Recipe deleted successfully');
}

export async function getRecipeBySlugHandler(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const recipe = await getRecipeBySlug(slug);
    if (!recipe) {
        throw new NotFoundError('Recipe not found');
    }
    sendSuccess(reply, recipe, 'Recipe retrieved successfully');
}

// ==================== SEARCH & FILTER ====================

export async function searchRecipesHandler(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
        q?: string;
        categoryId?: string;
        difficulty?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
        minPrepTime?: string;
        maxPrepTime?: string;
        minCookTime?: string;
        maxCookTime?: string;
        servings?: string;
        dietaryTags?: string | string[];
    };

    const { page, limit, sortBy, sortOrder } = parsePagination(query);
    const difficultyEnum = query.difficulty && validDifficulties.includes(query.difficulty.toUpperCase() as any)
        ? query.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD'
        : undefined;
    const dietaryTagsArray = query.dietaryTags
        ? (Array.isArray(query.dietaryTags) ? query.dietaryTags : [query.dietaryTags])
        : undefined;

    const data = await getAllRecipesBySearch(
        page,
        limit,
        query.categoryId,
        difficultyEnum,
        query.q,
        undefined,
        undefined,
        sortBy,
        sortOrder,
        query.minPrepTime ? parseInt(query.minPrepTime, 10) : undefined,
        query.maxPrepTime ? parseInt(query.maxPrepTime, 10) : undefined,
        query.minCookTime ? parseInt(query.minCookTime, 10) : undefined,
        query.maxCookTime ? parseInt(query.maxCookTime, 10) : undefined,
        query.servings ? parseInt(query.servings, 10) : undefined,
        dietaryTagsArray,
        request.user?.id
    );

    const message = data.recipes.length > 0 ? 'Recipes found' : 'No recipes found';

    if (request.user && query.q) {
        logInteraction(request.user.id, InteractionType.SEARCH, {
            query: query.q,
            filters: {
                categoryId: query.categoryId,
                difficulty: difficultyEnum,
                dietaryTags: dietaryTagsArray
            }
        });
    }

    sendSuccess(reply, data, message);
}

export async function getRecipesByCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
    const { categoryId } = request.params as { categoryId: string };
    const category = await getCategoryById(categoryId);
    if (!category) {
        throw new NotFoundError('Category not found');
    }

    const { page, limit, sortBy, sortOrder } = parsePagination(request.query);
    const data = await getRecipesByCategory(categoryId, page, limit, sortBy, sortOrder);
    const message = data.recipes.length > 0 ? 'Recipes found' : 'No recipes found';
    sendSuccess(reply, data, message);
}

export async function getRecipesByAuthorHandler(request: FastifyRequest, reply: FastifyReply) {
    const { authorId } = request.params as { authorId: string };
    const { page, limit, sortBy, sortOrder } = parsePagination(request.query);
    const data = await getRecipesByAuthor(authorId, page, limit, undefined, sortBy, sortOrder);
    const message = data.recipes.length > 0 ? 'Recipes found' : 'No recipes found';
    sendSuccess(reply, data, message);
}

export async function getRecipesByDifficultyHandler(request: FastifyRequest, reply: FastifyReply) {
    const { difficulty } = request.params as { difficulty: string };
    if (!validDifficulties.includes(difficulty.toUpperCase() as any)) {
        throw new NotFoundError('Invalid difficulty level');
    }

    const { page, limit, sortBy, sortOrder } = parsePagination(request.query);
    const data = await getRecipesByDifficulty(
        difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
        page, limit, sortBy, sortOrder
    );
    const message = data.recipes.length > 0 ? 'Recipes found' : 'No recipes found';
    sendSuccess(reply, data, message);
}

export async function getMyRecipesHandler(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page?: string; limit?: string; sortBy?: string; sortOrder?: string; publishedOnly?: string };
    const { page, limit, sortBy, sortOrder } = parsePagination(query);
    const publishedOnly = query.publishedOnly === 'true';

    const data = await getMyRecipes(request.user!.id, page, limit, publishedOnly, sortBy, sortOrder);
    sendSuccess(reply, data, 'Your recipes retrieved');
}

// ==================== RATINGS ====================

export async function addRatingHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { score } = request.body as { score: number };
    const rating = await rateRecipe(id, request.user!.id, score);
    sendCreated(reply, rating, 'Rating added successfully');
}

export async function updateRatingHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { score } = request.body as { score: number };
    const rating = await rateRecipe(id, request.user!.id, score);
    sendSuccess(reply, rating, 'Rating updated successfully');
}

export async function getRatingsHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const ratings = await getRecipeRatings(id);
    sendSuccess(reply, ratings, 'Ratings retrieved');
}

export async function deleteRatingHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await removeRecipeRating(id, request.user!.id);
    sendSuccess(reply, result, 'Rating removed successfully');
}

// ==================== FAVORITES ====================

export async function addToFavoritesHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const favorite = await addToFavorites(request.user!.id, id);
    sendCreated(reply, favorite, "Recipe added to favorites");
}

export async function removeFromFavoritesHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await removeFromFavorites(request.user!.id, id);
    sendSuccess(reply, result, "Recipe removed from favorites");
}

export async function getUserFavoritesHandler(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page?: string; limit?: string; sortBy?: string; sortOrder?: string };
    const { page, limit, sortBy, sortOrder } = parsePagination(query);
    const favorites = await getUserFavorites(request.user!.id, page, limit, sortBy, sortOrder);
    sendSuccess(reply, favorites, "User favorites retrieved successfully");
}

export async function getSimilarRecipesHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const recipes = await getSimilarRecipes(id);
    sendSuccess(reply, recipes);
}

export async function getRecommendedRecipesHandler(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
        throw new ForbiddenError('Authentication required for recommendations');
    }
    const recipes = await getRecommendedRecipes(request.user.id);
    sendSuccess(reply, recipes, 'Recommended recipes retrieved');
}
