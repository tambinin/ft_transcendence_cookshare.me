import { FastifyInstance } from "fastify";
import {
    createCategoryHandler,
    deleteCategoryHandler,
    getAllCategoriesHandler,
    getCategoryByIdHandler,
    getCategoryBySlugHandler,
    updateCategoryHandler,
    createCategorySchema,
    updateCategorySchema
} from "../controllers/category.controller";
import {
    authMiddleware,
    adminMiddleware,
    bodyValidator
} from "@transcendence/common";

export async function categoryRoutes(app: FastifyInstance) {

    app.post("/categories", {
        preHandler: [authMiddleware, adminMiddleware, bodyValidator(createCategorySchema)]
    }, createCategoryHandler);

    app.get("/categories", getAllCategoriesHandler);

    app.get("/categories/:id", getCategoryByIdHandler);

    app.get("/categories/by-slug/:slug", getCategoryBySlugHandler);

    app.put("/categories/:id", {
        preHandler: [authMiddleware, adminMiddleware, bodyValidator(updateCategorySchema)]
    }, updateCategoryHandler);

    app.delete("/categories/:id", {
        preHandler: [authMiddleware, adminMiddleware]
    }, deleteCategoryHandler);
}