import { FastifyInstance } from "fastify";
import { searchIngredientsHandler } from "../controllers/ingredient.controller";

export async function ingredientRoutes(app: FastifyInstance) {
    app.get("/ingredients/search", searchIngredientsHandler);
}
