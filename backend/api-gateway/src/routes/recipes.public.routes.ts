import { FastifyInstance } from "fastify";
import { proxyHydrate } from "../utils/proxy";
import { commonResponses, createResponseSchema, recipeFullSchema, recipeSummarySchema, paginationSchema, categorySummarySchema } from "../utils/swagger.schemas";

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL;

if (!RECIPE_SERVICE_URL) {
    throw new Error("RECIPE_SERVICE_URL is not defined");
}

export async function recipesPublicRoutes(app: FastifyInstance) {
    app.get("/recipes", {
        schema: {
            tags: ["Recipes"],
            summary: "Get all recipes",
            description: "### Overview\nRetrieves a global list of published recipes.\n\n### Security\n- Publicly accessible.",
            security: [],
            querystring: {
                type: "object",
                properties: {
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 20 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        recipes: { type: "array", items: recipeSummarySchema },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/recipes", RECIPE_SERVICE_URL);
    });

    app.get("/recipes/:id", {
        schema: {
            tags: ["Recipes"],
            summary: "Get recipe by ID",
            description: "### Overview\nRetrieves the comprehensive details of a recipe using its unique ID.\n\n### Security\n- Publicly accessible.",
            security: [],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Unique recipe identifier" }
                },
            },
            response: {
                200: createResponseSchema(recipeFullSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/:id/similar", {
        schema: {
            tags: ["Recipes"],
            summary: "Get similar recipes",
            description: "### Overview\nRetrieves a list of similar recipes based on content similarity.",
            security: [],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Source Recipe ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: recipeSummarySchema
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/similar`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/by-slug/:slug", {
        schema: {
            tags: ["Recipes"],
            summary: "Get recipe by Slug",
            description: "### Overview\nRetrieves a recipe using its SEO-friendly slug.",
            security: [],
            params: {
                type: "object",
                required: ["slug"],
                properties: {
                    slug: { type: "string" }
                },
            },
            response: {
                200: createResponseSchema(recipeFullSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { slug } = request.params as { slug: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/by-slug/${slug}`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/search", {
        schema: {
            tags: ["Recipes"],
            summary: "Search recipes",
            description: "### Overview\nProvides a high-performance search and filtering interface.",
            security: [],
            querystring: {
                type: "object",
                properties: {
                    q: { type: "string" },
                    categoryId: { type: "string", format: "uuid" },
                    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 10 },
                    sortBy: { type: "string", default: "createdAt" },
                    sortOrder: { type: "string", default: "desc" },
                    minPrepTime: { type: "integer" },
                    maxPrepTime: { type: "integer" },
                    minCookTime: { type: "integer" },
                    maxCookTime: { type: "integer" },
                    servings: { type: "integer" },
                    dietaryTags: { type: "array", items: { type: "string" } }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        recipes: { type: "array", items: recipeSummarySchema },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/recipes/search", RECIPE_SERVICE_URL);
    });

    app.get("/recipes/category/:categoryId", {
        schema: {
            tags: ["Recipes"],
            summary: "Get recipes by category",
            description: "### Overview\nLists all published recipes belonging to a specific category.",
            security: [],
            params: {
                type: "object",
                required: ["categoryId"],
                properties: {
                    categoryId: { type: "string", format: "uuid" }
                }
            },
            querystring: {
                type: "object",
                properties: {
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 10 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        recipes: { type: "array", items: recipeSummarySchema },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { categoryId } = request.params as { categoryId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/category/${categoryId}`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/author/:authorId", {
        schema: {
            tags: ["Recipes"],
            summary: "Get recipes by author",
            description: "### Overview\nLists all published recipes created by a specific user.",
            security: [],
            params: {
                type: "object",
                required: ["authorId"],
                properties: {
                    authorId: { type: "string", format: "uuid" }
                }
            },
            querystring: {
                type: "object",
                properties: {
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 10 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        recipes: { type: "array", items: recipeSummarySchema },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { authorId } = request.params as { authorId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/author/${authorId}`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/difficulty/:difficulty", {
        schema: {
            tags: ["Recipes"],
            summary: "Get recipes by difficulty",
            description: "### Overview\nLists all published recipes with a specific difficulty level.",
            security: [],
            params: {
                type: "object",
                required: ["difficulty"],
                properties: {
                    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] }
                }
            },
            querystring: {
                type: "object",
                properties: {
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 10 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        recipes: { type: "array", items: recipeSummarySchema },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { difficulty } = request.params as { difficulty: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/difficulty/${difficulty}`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/:id/ratings", {
        schema: {
            tags: ["Recipes"],
            summary: "Get ratings summary",
            security: [],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        averageScore: { type: "number" },
                        totalRaters: { type: "integer" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/ratings`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/:id/comments", {
        schema: {
            tags: ["Comments"],
            summary: "Get comments",
            security: [],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        comments: {
                            type: "array",
                            items: {
                                type: "object",
                                additionalProperties: true
                            }
                        },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/comments`, RECIPE_SERVICE_URL);
    });

    app.get("/categories", {
        schema: {
            tags: ["Categories"],
            summary: "Get all categories",
            security: [],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: categorySummarySchema
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/categories", RECIPE_SERVICE_URL);
    });

    app.get("/categories/:id", {
        schema: {
            tags: ["Categories"],
            summary: "Get category by ID",
            security: [],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid" }
                }
            },
            response: {
                200: createResponseSchema(categorySummarySchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/categories/${id}`, RECIPE_SERVICE_URL);
    });

    app.get("/categories/by-slug/:slug", {
        schema: {
            tags: ["Categories"],
            summary: "Get category by slug",
            security: [],
            params: {
                type: "object",
                required: ["slug"],
                properties: {
                    slug: { type: "string" }
                }
            },
            response: {
                200: createResponseSchema(categorySummarySchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { slug } = request.params as { slug: string };
        return proxyHydrate(app, request, reply, `/api/v1/categories/by-slug/${slug}`, RECIPE_SERVICE_URL);
    });

    app.get("/dietary-tags", {
        schema: {
            tags: ["Dietary Tags"],
            summary: "Get all dietary tags",
            description: "### Overview\nRetrieves the complete catalog of dietary classifications (e.g., Keto, Paleo, Halal) supported by the platform.\n\n### Technical Details\n- Returns a normalized list of tags with associated iconography identifiers.\n- Publicly accessible.",
            security: [],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            name: { type: "string" },
                            slug: { type: "string" },
                            iconName: { type: "string", nullable: true }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/dietary-tags", RECIPE_SERVICE_URL);
    });

    app.get("/dietary-tags/:id", {
        schema: {
            tags: ["Dietary Tags"],
            summary: "Get dietary tag by ID",
            description: "### Overview\nRetrieves detailed information for a specific dietary tag using its UUID.\n\n### Security\n- Publicly accessible.",
            security: [],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Dietary Tag ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        iconName: { type: "string", nullable: true }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/dietary-tags/${id}`, RECIPE_SERVICE_URL);
    });
}
