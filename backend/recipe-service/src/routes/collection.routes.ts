import { FastifyInstance } from "fastify";
import {
    createCollectionHandler,
    getUserCollectionsHandler,
    getCollectionByIdHandler,
    updateCollectionHandler,
    deleteCollectionHandler,
    addRecipeToCollectionHandler,
    removeRecipeFromCollectionHandler,
    createCollectionSchema,
    updateCollectionSchema,
    addRecipeSchema
} from "../controllers/collection.controller";
import {
    authMiddleware,
    bodyValidator,
} from "@transcendence/common";

export async function collectionRoutes(app: FastifyInstance) {
    app.post("/collections", {
        preHandler: [authMiddleware, bodyValidator(createCollectionSchema)]
    }, createCollectionHandler);

    app.get("/collections", {
        preHandler: [authMiddleware]
    }, getUserCollectionsHandler);

    app.get("/collections/:id", {
        preHandler: [authMiddleware]
    }, getCollectionByIdHandler);

    app.put("/collections/:id", {
        preHandler: [authMiddleware, bodyValidator(updateCollectionSchema)]
    }, updateCollectionHandler);

    app.delete("/collections/:id", {
        preHandler: [authMiddleware]
    }, deleteCollectionHandler);

    app.post("/collections/:id/recipes", {
        preHandler: [authMiddleware, bodyValidator(addRecipeSchema)]
    }, addRecipeToCollectionHandler);

    app.delete("/collections/:id/recipes/:recipeId", {
        preHandler: [authMiddleware]
    }, removeRecipeFromCollectionHandler);
}
