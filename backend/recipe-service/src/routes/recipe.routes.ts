import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware, bodyValidator, paramValidator } from "@transcendence/common";
import { z } from "zod";

async function optionalAuthMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    try {
        const authHeader = request.headers.authorization;
        request.log.info({ optionalAuth: true, hasAuth: !!authHeader }, '[optionalAuth] middleware called');
        if (authHeader?.startsWith('Bearer ')) {
            await request.jwtVerify();
            request.log.info({ userId: request.user?.id }, '[optionalAuth] user authenticated');
        }
    } catch (err) {
        request.log.warn({ error: (err as Error).message }, '[optionalAuth] auth failed');
    }
}
import {
    // Schemas
    createRecipeSchema,
    updateRecipeSchema,
    ratingSchema,
    // CRUD handlers
    getAllRecipesHandler,
    createRecipeHandler,
    getRecipeByIdHandler,
    updateRecipeHandler,
    deleteRecipeHandler,
    getRecipeBySlugHandler,
    // Search & filter handlers
    searchRecipesHandler,
    getRecipesByCategoryHandler,
    getRecipesByAuthorHandler,
    getRecipesByDifficultyHandler,
    getMyRecipesHandler,
    // Rating handlers
    addRatingHandler,
    updateRatingHandler,
    getRatingsHandler,
    deleteRatingHandler,
    // Favorite handlers
    addToFavoritesHandler,
    removeFromFavoritesHandler,
    getUserFavoritesHandler,
    getSimilarRecipesHandler,
    getRecommendedRecipesHandler
} from "../controllers/recipe.controller";
import {
    getComments,
    createCommentHandler,
    updateCommentHandler,
    deleteCommentHandler,
    createReplyHandler
} from "../controllers/comment.controller";

const commentSchema = z.object({
    content: z.string().min(1, "Comment content is required").max(2000)
});

const idParamSchema = z.object({
    id: z.string().min(1)
});

export async function recipesRoutes(app: FastifyInstance) {
    // ==================== RECIPE CRUD ====================
    app.get("/recipes", { preHandler: optionalAuthMiddleware }, getAllRecipesHandler);

    app.post("/recipes", {
        preHandler: [authMiddleware, bodyValidator(createRecipeSchema)]
    }, createRecipeHandler);

    app.get("/recipes/:id", { preHandler: optionalAuthMiddleware }, getRecipeByIdHandler);

    app.put("/recipes/:id", {
        preHandler: [authMiddleware, bodyValidator(updateRecipeSchema)]
    }, updateRecipeHandler);

    app.delete("/recipes/:id", { preHandler: authMiddleware }, deleteRecipeHandler);

    app.get("/recipes/by-slug/:slug", getRecipeBySlugHandler);

    app.get("/recipes/recommended", { preHandler: authMiddleware }, getRecommendedRecipesHandler);
    app.get("/recipes/:id/similar", getSimilarRecipesHandler);

    // ==================== SEARCH & FILTER ====================
    app.get("/recipes/search", { preHandler: optionalAuthMiddleware }, searchRecipesHandler);

    app.get("/recipes/category/:categoryId", getRecipesByCategoryHandler);

    app.get("/recipes/author/:authorId", getRecipesByAuthorHandler);

    app.get("/recipes/difficulty/:difficulty", getRecipesByDifficultyHandler);

    app.get("/recipes/me", { preHandler: authMiddleware }, getMyRecipesHandler);

    // ==================== RATINGS ====================
    app.post("/recipes/:id/ratings", {
        preHandler: [authMiddleware, paramValidator(idParamSchema), bodyValidator(ratingSchema)]
    }, addRatingHandler);

    app.put("/recipes/:id/ratings", {
        preHandler: [authMiddleware, paramValidator(idParamSchema), bodyValidator(ratingSchema)]
    }, updateRatingHandler);

    app.get("/recipes/:id/ratings", {
        preHandler: [paramValidator(idParamSchema)]
    }, getRatingsHandler);

    app.delete("/recipes/:id/ratings", {
        preHandler: [authMiddleware, paramValidator(idParamSchema)]
    }, deleteRatingHandler);

    // ==================== COMMENTS ====================
    app.get("/recipes/:id/comments", getComments);

    app.post("/recipes/:id/comments", {
        preHandler: [authMiddleware, bodyValidator(commentSchema)]
    }, createCommentHandler);

    app.put("/recipes/:id/comments/:commentId", {
        preHandler: [authMiddleware, bodyValidator(commentSchema)]
    }, updateCommentHandler);

    app.delete("/recipes/:id/comments/:commentId", { preHandler: authMiddleware }, deleteCommentHandler);

    app.post("/recipes/:id/comments/:commentId/replies", {
        preHandler: [authMiddleware, bodyValidator(commentSchema)]
    }, createReplyHandler);

    // ==================== FAVORITES ====================
    app.post("/recipes/:id/favorite", { preHandler: authMiddleware }, addToFavoritesHandler);

    app.delete("/recipes/:id/favorite", { preHandler: authMiddleware }, removeFromFavoritesHandler);

    app.get("/me/favorites", { preHandler: authMiddleware }, getUserFavoritesHandler);
}
