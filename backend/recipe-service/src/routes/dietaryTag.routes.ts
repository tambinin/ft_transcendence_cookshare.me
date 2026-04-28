import { FastifyInstance } from "fastify";
import {
    createDietaryTagHandler,
    deleteDietaryTagHandler,
    getAllDietaryTagsHandler,
    getDietaryTagByIdHandler,
    updateDietaryTagHandler,
    createDietaryTagSchema,
    updateDietaryTagSchema
} from "../controllers/dietaryTag.controller";
import {
    authMiddleware,
    adminMiddleware,
    bodyValidator
} from "@transcendence/common";

export async function dietaryTagRoutes(app: FastifyInstance) {

    app.post("/dietary-tags", {
        preHandler: [authMiddleware, adminMiddleware, bodyValidator(createDietaryTagSchema)]
    }, createDietaryTagHandler);

    app.get("/dietary-tags", getAllDietaryTagsHandler);

    app.get("/dietary-tags/:id", getDietaryTagByIdHandler);

    app.put("/dietary-tags/:id", {
        preHandler: [authMiddleware, adminMiddleware, bodyValidator(updateDietaryTagSchema)]
    }, updateDietaryTagHandler);

    app.delete("/dietary-tags/:id", {
        preHandler: [authMiddleware, adminMiddleware]
    }, deleteDietaryTagHandler);
}
