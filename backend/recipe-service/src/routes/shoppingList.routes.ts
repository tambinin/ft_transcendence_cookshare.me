import { FastifyInstance } from "fastify";
import {
    addItemHandler,
    addRecipeToShoppingListHandler,
    getShoppingListHandler,
    updateItemHandler,
    deleteItemHandler,
    clearCheckedItemsHandler,
    clearAllItemsHandler,
    internalAddItemHandler,
    internalUpdateItemHandler,
    internalDeleteItemHandler,
    addItemSchema,
    updateItemSchema
} from "../controllers/shoppingList.controller";
import {
    authMiddleware,
    bodyValidator
} from "@transcendence/common";

export async function shoppingListRoutes(app: FastifyInstance) {
    app.post("/shopping-list/items", {
        preHandler: [authMiddleware, bodyValidator(addItemSchema)]
    }, addItemHandler);

    app.post("/recipes/:id/shopping-list", {
        preHandler: [authMiddleware]
    }, addRecipeToShoppingListHandler);

    app.get("/shopping-list", {
        preHandler: [authMiddleware]
    }, getShoppingListHandler);

    app.put("/shopping-list/items/:id", {
        preHandler: [authMiddleware, bodyValidator(updateItemSchema)]
    }, updateItemHandler);

    app.delete("/shopping-list/items/:id", {
        preHandler: [authMiddleware]
    }, deleteItemHandler);

    app.delete("/shopping-list/checked", {
        preHandler: [authMiddleware]
    }, clearCheckedItemsHandler);

    app.delete("/shopping-list", {
        preHandler: [authMiddleware]
    }, clearAllItemsHandler);

    app.post("/internal/shopping-list/items", internalAddItemHandler);

    app.put("/internal/shopping-list/items/:id", internalUpdateItemHandler);

    app.delete("/internal/shopping-list/items/:id", internalDeleteItemHandler);
}
