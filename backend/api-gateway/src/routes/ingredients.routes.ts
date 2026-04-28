import { FastifyInstance } from "fastify";
import { proxyHydrate } from "../utils/proxy";
import { commonResponses, createResponseSchema } from "../utils/swagger.schemas";

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || "";

export async function ingredientsRoutes(app: FastifyInstance) {
    app.get("/ingredients/search", {
        schema: {
            tags: ["Ingredients"],
            summary: "Search ingredients",
            description: "### Overview\nAutocomplete search for ingredients based on existing recipes.\n\n### Technical Details\n- Returns unique ingredient names matching the query.\n- Case-insensitive substring match.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            querystring: {
                type: "object",
                properties: {
                    q: { type: "string", minLength: 2, description: "Search term" },
                    limit: { type: "integer", default: 10 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: { type: "string", example: "Salt" }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/ingredients/search", RECIPE_SERVICE_URL);
    });
}
