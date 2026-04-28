import { FastifyInstance } from "fastify";
import {
    addMealPlanHandler,
    getMealPlansHandler,
    getMealPlanByDateHandler,
    updateMealPlanHandler,
    deleteMealPlanHandler,
    addMealPlanSchema,
    updateMealPlanSchema
} from "../controllers/mealPlan.controller";
import {
    authMiddleware,
    bodyValidator
} from "@transcendence/common";

export async function mealPlanRoutes(app: FastifyInstance) {

    app.post("/meal-plans", {
        preHandler: [authMiddleware, bodyValidator(addMealPlanSchema)]
    }, addMealPlanHandler);

    app.get("/meal-plans", {
        preHandler: [authMiddleware]
    }, getMealPlansHandler);

    app.get("/meal-plans/:date", {
        preHandler: [authMiddleware]
    }, getMealPlanByDateHandler);

    app.put("/meal-plans/:id", {
        preHandler: [authMiddleware, bodyValidator(updateMealPlanSchema)]
    }, updateMealPlanHandler);

    app.delete("/meal-plans/:id", {
        preHandler: [authMiddleware]
    }, deleteMealPlanHandler);
}
