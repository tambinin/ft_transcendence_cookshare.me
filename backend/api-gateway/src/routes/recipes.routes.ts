import { FastifyInstance } from "fastify";
import { proxyHydrate, proxyMultipart } from "../utils/proxy";
import { commonResponses, createResponseSchema, recipeFullSchema, recipeSummarySchema, paginationSchema, categorySummarySchema, imageSchema } from "../utils/swagger.schemas";

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL;

if (!RECIPE_SERVICE_URL) {
    throw new Error("RECIPE_SERVICE_URL is not defined");
}

export async function recipesRoutes(app: FastifyInstance) {


    app.get("/recipes/recommended", {
        schema: {
            tags: ["Recipes"],
            summary: "Get recommended recipes",
            description: "### Overview\nRetrieves personalized recipe recommendations based on user interaction history (views, searches).\n\n### Technical Details\n- Analyzes last 30 days of activity.\n- Identifies top categories and dietary tags.\n- Returns top 10 relevant recipes excluding those already viewed.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: recipeSummarySchema
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/recipes/recommended", RECIPE_SERVICE_URL);
    });

    app.post("/recipes", {
        schema: {
            tags: ["Recipes"],
            summary: "Create a new recipe",
            description: "### Overview\nAuthors a new culinary recipe with structured ingredients, instructions, and metadata.\n\n### Technical Details\n- Generates a unique, URL-friendly `slug` based on the title using a collision-resistant algorithm.\n- Persists core recipe data in the `recipe-service` with relational links to categories and dietary tags.\n- Initializes default ratings and view counters.\n\n### Validation & Constraints\n- **Title**: Mandatory, 3-200 characters.\n- **PreparationTime**: Non-negative integer representing minutes.\n\n### Side Effects\n- Triggers a real-time 'new_recipe' event for followers of the author.\n- Hydrates author metadata via internal API Gateway lookups for the response payload.\n\n### Security\n- Requires synchronous Gateway API Key and JWT Bearer authentication.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["title", "description", "prepTime", "cookTime", "servings", "categoryId"],
                properties: {
                    title: { type: "string", minLength: 3, maxLength: 200, example: "Poulet Tikka Masala" },
                    description: { type: "string", minLength: 10, maxLength: 2000, example: "Un délicieux plat indien crémeux et épicé..." },
                    ingredients: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "object",
                            required: ["name", "quantityText"],
                            properties: {
                                name: { type: "string", example: "Poulet" },
                                quantityText: { type: "string", example: "500g" },
                                isOptional: { type: "boolean", default: false }
                            }
                        }
                    },
                    instructions: {
                        type: "array",
                        minItems: 1,
                        items: {
                            type: "object",
                            required: ["stepNumber", "description"],
                            properties: {
                                stepNumber: { type: "integer", example: 1 },
                                description: { type: "string", example: "Couper le poulet en morceaux..." }
                            }
                        }
                    },
                    prepTime: { type: "integer", minimum: 0, description: "Preparation time in minutes", example: 30 },
                    cookTime: { type: "integer", minimum: 0, description: "Cooking time in minutes", example: 45 },
                    servings: { type: "integer", minimum: 1, example: 4 },
                    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"], default: "MEDIUM" },
                    categoryId: { type: "string", format: "uuid", example: "76201871-6a2c-4060-a112-e91dee221b75" },
                    isPublished: { type: "boolean", default: false },
                    dietaryTagIds: { type: "array", items: { type: "string", format: "uuid" } }
                }
            },
            response: {
                201: createResponseSchema(recipeFullSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/recipes", RECIPE_SERVICE_URL);
    });

    app.put("/recipes/:id", {
        schema: {
            tags: ["Recipes"],
            summary: "Update recipe",
            description: "### Overview\nUpdates an existing recipe's content or metadata.\n\n### Technical Details\n- Employs partial update logic (PATCH behavior).\n- Recalculates the SEO `slug` if the title is modified.\n- Updates associated category and tag relations.\n\n### Security\n- Strictly restricted to the original author or system administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Unique recipe identifier" }
                },
            },
            body: {
                type: "object",
                properties: {
                    title: { type: "string", minLength: 3, maxLength: 200 },
                    description: { type: "string", minLength: 10, maxLength: 2000 },
                    ingredients: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["name", "quantityText"],
                            properties: {
                                id: { type: "string", format: "uuid" },
                                name: { type: "string" },
                                quantityText: { type: "string" },
                                isOptional: { type: "boolean" }
                            }
                        }
                    },
                    instructions: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["stepNumber", "description"],
                            properties: {
                                id: { type: "string", format: "uuid" },
                                stepNumber: { type: "integer" },
                                description: { type: "string" }
                            }
                        }
                    },
                    prepTime: { type: "integer", minimum: 0 },
                    cookTime: { type: "integer", minimum: 0 },
                    servings: { type: "integer", minimum: 1 },
                    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                    categoryId: { type: "string", format: "uuid" },
                    isPublished: { type: "boolean" },
                    dietaryTagIds: { type: "array", items: { type: "string", format: "uuid" } }
                }
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

    app.delete("/recipes/:id", {
        schema: {
            tags: ["Recipes"],
            summary: "Delete recipe",
            description: "### Overview\nRemoves a recipe from the platform.\n\n### Technical Details\n- Performs a permanent delete from the database.\n- All associated ingredients and instructions are also removed.\n\n### Security\n- Requires Owner or Admin privileges.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Unique recipe identifier" }
                },
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Recipe deleted successfully" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:id/ratings", {
        schema: {
            tags: ["Recipes"],
            summary: "Rate a recipe",
            description: "### Overview\nAllows users to rate a recipe on a scale of 1 to 5 stars.\n\n### Technical Details\n- Uses an upsert operation: creates a new rating or updates an existing one.\n- Recalculates the average score for the recipe.\n\n### Validation & Constraints\n- **score**: Must be an integer between 1 and 5.\n- **author**: Users cannot rate their own recipes.\n\n### Side Effects\n- Sends a notification to the recipe author.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["score"],
                properties: { score: { type: "number", minimum: 1, maximum: 5, example: 5 } }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        score: { type: "number" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/ratings`, RECIPE_SERVICE_URL);
    });

    app.put("/recipes/:id/ratings", {
        schema: {
            tags: ["Recipes"],
            summary: "Update rating",
            description: "### Overview\nChanges the score of an existing rating.\n\n### Technical Details\n- Updates the `score` field in the `Ratings` table.\n- Triggers a recalculation of the recipe's average score.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: { type: "object", required: ["score"], properties: { score: { type: "number", minimum: 1, maximum: 5 } } },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        score: { type: "number" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/ratings`, RECIPE_SERVICE_URL);
    });

    app.delete("/recipes/:id/ratings", {
        schema: {
            tags: ["Recipes"],
            summary: "Delete rating",
            description: "### Overview\nRemoves a user's rating from a recipe.\n\n### Technical Details\n- Deletes the rating record from the database.\n- Triggers a recalculation of the recipe's average score and total raters.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
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

    app.post("/categories", {
        schema: {
            tags: ["Categories"],
            summary: "Create category",
            description: "### Overview\nAdds a new category for recipe classification.\n\n### Technical Details\n- Generates a unique slug from the category name.\n- Used for filtering and organization.\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", minLength: 2, example: "Dessert" },
                    description: { type: "string", example: "Sweet treats and pastries" }
                }
            },
            response: {
                201: createResponseSchema(categorySummarySchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/categories", RECIPE_SERVICE_URL);
    });

    app.put("/categories/:id", {
        schema: {
            tags: ["Categories"],
            summary: "Update category",
            description: "### Overview\nModifies an existing category.\n\n### Technical Details\n- Supports partial updates for name, description, icon, and sort order.\n- Recalculates the slug if the name changes.\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Unique category identifier" }
                }
            },
            body: {
                type: "object",
                properties: {
                    name: { type: "string", minLength: 2 },
                    iconName: { type: "string" },
                    color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                    sortOrder: { type: "integer", minimum: 0 }
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

    app.delete("/categories/:id", {
        schema: {
            tags: ["Categories"],
            summary: "Delete category",
            description: "### Overview\nPermanently removes a category.\n\n### Technical Details\n- Deletes the category record from the database.\n- Checks for associated recipes; deletion will fail if recipes are still linked to this category.\n\n### Security\n- Restricted to administrators.\n\n### Side Effects\n- Recipes associated with this category may need to be reassigned or will have a null category.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Unique category identifier" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Category deleted successfully" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/categories/${id}`, RECIPE_SERVICE_URL);
    });

    app.get("/recipes/me", {
        schema: {
            tags: ["Recipes"],
            summary: "Get my recipes",
            description: "### Overview\nRetrieves a list of recipes created by the authenticated user.\n\n### Technical Details\n- Includes both published and draft recipes.\n- Returns summary data for each recipe.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            querystring: {
                type: "object",
                properties: {
                    page: { type: "integer", default: 1 },
                    limit: { type: "integer", default: 10 },
                    publishedOnly: { type: "boolean", default: false }
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
        return proxyHydrate(app, request, reply, "/api/v1/recipes/me", RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:id/comments", {
        schema: {
            tags: ["Comments"],
            summary: "Post a comment on a recipe",
            description: "### Overview\nAdds a user comment to a recipe.\n\n### Technical Details\n- Stores the comment text and associates it with the user and recipe.\n- Supports markdown-lite (optional/recommended).\n\n### Side Effects\n- Notifies the recipe author of the new comment.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["content"],
                properties: {
                    content: { type: "string", minLength: 1, maxLength: 2000, example: "This recipe looks amazing!" }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        content: { type: "string" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/comments`, RECIPE_SERVICE_URL);
    });

    app.put("/recipes/:id/comments/:commentId", {
        schema: {
            tags: ["Comments"],
            summary: "Update comment",
            description: "### Overview\nModifies the text of an existing comment.\n\n### Security\n- Only the original author can update their comment.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id", "commentId"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" },
                    commentId: { type: "string", format: "uuid", description: "Comment ID" }
                }
            },
            body: {
                type: "object",
                properties: {
                    content: { type: "string", minLength: 1, maxLength: 2000 }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        content: { type: "string" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id, commentId } = request.params as { id: string; commentId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/comments/${commentId}`, RECIPE_SERVICE_URL);
    });

    app.delete("/recipes/:id/comments/:commentId", {
        schema: {
            tags: ["Comments"],
            summary: "Delete comment",
            description: "### Overview\nPermanently removes a comment.\n\n### Side Effects\n- All replies to this comment are also deleted (cascading delete).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id", "commentId"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" },
                    commentId: { type: "string", format: "uuid", description: "Comment ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: { message: { type: "string" } }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id, commentId } = request.params as { id: string; commentId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/comments/${commentId}`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:id/comments/:commentId/replies", {
        schema: {
            tags: ["Comments"],
            summary: "Reply to a comment",
            description: "### Overview\nAllows users to reply to an existing comment, creating a threaded conversation.\n\n### Technical Details\n- Links the new comment to a `parentId`.\n\n### Side Effects\n- Notifies the original commenter of the reply.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id", "commentId"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" },
                    commentId: { type: "string", format: "uuid", description: "Parent Comment ID" }
                }
            },
            body: {
                type: "object",
                required: ["content"],
                properties: {
                    content: { type: "string", minLength: 1, maxLength: 2000 }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        content: { type: "string" },
                        parentId: { type: "string", format: "uuid" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id, commentId } = request.params as { id: string; commentId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/comments/${commentId}/replies`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:id/favorite", {
        schema: {
            tags: ["Recipes"],
            summary: "Add to favorites",
            description: "### Overview\nMarks a recipe as a personal favorite.\n\n### Technical Details\n- Creates a link between the user and the recipe in the `Favorites` table.\n\n### Side Effects\n- Notifies the recipe author that their work has been favorited.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/favorite`, RECIPE_SERVICE_URL);
    });

    app.delete("/recipes/:id/favorite", {
        schema: {
            tags: ["Recipes"],
            summary: "Remove from favorites",
            description: "### Overview\nRemoves a recipe from the user's personal favorites list.\n\n### Technical Details\n- Deletes the link between the user and the recipe in the `Favorites` table.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/favorite`, RECIPE_SERVICE_URL);
    });

    app.get("/me/favorites", {
        schema: {
            tags: ["Recipes"],
            summary: "Get user favorites",
            description: "### Overview\nRetrieves a list of all recipes favorited by a specific user.\n\n### Technical Details\n- Queries the `Favorites` table for the provided `userId`.\n- Returns summary data for each favorited recipe.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
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
                        recipes: {
                            type: "array",
                            items: recipeSummarySchema
                        },
                        pagination: paginationSchema
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/me/favorites", RECIPE_SERVICE_URL);
    });

    app.get("/recipes/:recipeId/images", {
        schema: {
            tags: ["Images"],
            summary: "Get recipe images",
            description: "### Overview\nRetrieves all images associated with a recipe.\n\n### Technical Details\n- Returns images sorted by sortOrder.\n- Includes primary image indicator.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: imageSchema
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:recipeId/images/upload", {
        schema: {
            tags: ["Images"],
            summary: "Upload local image",
            description: "### Overview\nUploads an image file to Cloudinary and associates it with the recipe.\n\n### Technical Details\n- Supports JPEG, PNG, GIF, WebP, AVIF.\n- Max size 10MB.\n- Automatically sets as primary if first image.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                201: createResponseSchema(imageSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyMultipart(request, reply, `/api/v1/recipes/${recipeId}/images/upload`, RECIPE_SERVICE_URL, { fileRequired: true });
    });

    app.post("/recipes/:recipeId/images/url", {
        schema: {
            tags: ["Images"],
            summary: "Upload image from URL",
            description: "### Overview\nUploads an image from a provided URL to Cloudinary.\n\n### Technical Details\n- Fetches the image from the URL and uploads to Cloudinary.\n- Validates URL format.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["imageUrl"],
                properties: {
                    imageUrl: { type: "string", format: "uri", description: "Image URL" },
                    altText: { type: "string", maxLength: 255 },
                    isPrimary: { type: "boolean" }
                }
            },
            response: {
                201: createResponseSchema(imageSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/url`, RECIPE_SERVICE_URL);
    });

    app.put("/recipes/:recipeId/images/:imageId", {
        schema: {
            tags: ["Images"],
            summary: "Update image",
            description: "### Overview\nUpdates image metadata like altText or primary status.\n\n### Security\n- Only recipe author or admin.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId", "imageId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" },
                    imageId: { type: "string", format: "uuid", description: "Image ID" }
                }
            },
            body: {
                type: "object",
                properties: {
                    altText: { type: "string", maxLength: 255 },
                    isPrimary: { type: "boolean" },
                    sortOrder: { type: "integer", minimum: 0 }
                }
            },
            response: {
                200: createResponseSchema(imageSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId, imageId } = request.params as { recipeId: string; imageId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/${imageId}`, RECIPE_SERVICE_URL);
    });

    app.delete("/recipes/:recipeId/images/bulk", {
        schema: {
            tags: ["Images"],
            summary: "Delete multiple images",
            description: "### Overview\nDeletes multiple images at once.\n\n### Security\n- Only recipe author or admin.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["imageIds"],
                properties: {
                    imageIds: {
                        type: "array",
                        minItems: 1,
                        items: { type: "string", format: "uuid" }
                    }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        deleted: { type: "array", items: { type: "string", format: "uuid" } }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/bulk`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:recipeId/images/:imageId/primary", {
        schema: {
            tags: ["Images"],
            summary: "Set image as primary",
            description: "### Overview\nSets the specified image as the primary image for the recipe.\n\n### Security\n- Only recipe author or admin.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId", "imageId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" },
                    imageId: { type: "string", format: "uuid", description: "Image ID" }
                }
            },
            response: {
                200: createResponseSchema(imageSchema),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId, imageId } = request.params as { recipeId: string; imageId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/${imageId}/primary`, RECIPE_SERVICE_URL);
    });

    app.delete("/recipes/:recipeId/images/:imageId", {
        schema: {
            tags: ["Images"],
            summary: "Delete image",
            description: "### Overview\nDeletes a specific image from the recipe.\n\n### Security\n- Only recipe author or admin.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId", "imageId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" },
                    imageId: { type: "string", format: "uuid", description: "Image ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: { message: { type: "string" } }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId, imageId } = request.params as { recipeId: string; imageId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/${imageId}`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:recipeId/images/urls", {
        schema: {
            tags: ["Images"],
            summary: "Upload multiple images from URLs",
            description: "### Overview\nUploads multiple images from provided URLs.\n\n### Technical Details\n- Max 10 images per request.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["images"],
                properties: {
                    images: {
                        type: "array",
                        minItems: 1,
                        maxItems: 10,
                        items: {
                            type: "object",
                            required: ["imageUrl"],
                            properties: {
                                imageUrl: { type: "string", format: "uri" },
                                altText: { type: "string", maxLength: 255 }
                            }
                        }
                    }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        uploaded: { type: "array", items: imageSchema }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/urls`, RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:recipeId/images/uploads", {
        schema: {
            tags: ["Images"],
            summary: "Upload multiple local images",
            description: "### Overview\nUploads multiple image files.\n\n### Technical Details\n- Max 10 images per request.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        uploaded: { type: "array", items: imageSchema }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/uploads`, RECIPE_SERVICE_URL);
    });

    app.put("/recipes/:recipeId/images/reorder", {
        schema: {
            tags: ["Images"],
            summary: "Reorder images",
            description: "### Overview\nUpdates the sort order of images.\n\n### Security\n- Only recipe author or admin.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["recipeId"],
                properties: {
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["imageIds"],
                properties: {
                    imageIds: {
                        type: "array",
                        minItems: 1,
                        items: { type: "string", format: "uuid" }
                    }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: imageSchema
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { recipeId } = request.params as { recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${recipeId}/images/reorder`, RECIPE_SERVICE_URL);
    });

    app.post("/dietary-tags", {
        schema: {
            hide: true,
            tags: ["Dietary Tags"],
            summary: "Create dietary tag",
            description: "### Overview\nAdds a new dietary tag (e.g., Vegan, Gluten-Free).\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", example: "Vegan" },
                    description: { type: "string", example: "No animal products" },
                    iconName: { type: "string", example: "leaf" }
                }
            },
            response: {
                201: createResponseSchema({
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
        return proxyHydrate(app, request, reply, "/api/v1/dietary-tags", RECIPE_SERVICE_URL);
    });

    app.put("/dietary-tags/:id", {
        schema: {
            hide: true,
            tags: ["Dietary Tags"],
            summary: "Update dietary tag",
            description: "### Overview\nModifies an existing dietary tag.\n\n### Technical Details\n- Supports partial updates for name, description, and icon name.\n- Recalculates the slug if the name changes.\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Dietary Tag ID" }
                }
            },
            body: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    iconName: { type: "string" }
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

    app.delete("/dietary-tags/:id", {
        schema: {
            hide: true,
            tags: ["Dietary Tags"],
            summary: "Delete dietary tag",
            description: "### Overview\nPermanently removes a dietary tag.\n\n### Technical Details\n- Deletes the tag record from the database.\n- Checks for associated recipes; deletion will fail if recipes are still linked to this tag.\n\n### Security\n- Restricted to administrators.\n\n### Side Effects\n- Recipes associated with this tag may need to be updated or will lose the tag.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
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

    app.post("/collections", {
        schema: {
            tags: ["Collections"],
            summary: "Create collection",
            description: "### Overview\nInitializes a new personal or shared collection to organize curated recipes.\n\n### Technical Details\n- Supports privacy toggles (`isPublic`) for community sharing.\n- Generates a unique collection identifier.\n\n### Side Effects\n- Dispatched to the `recipe-service` for relational storage.\n\n### Security\n- Bound to the authenticated user identity.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", minLength: 1, example: "Summer BBQ" },
                    description: { type: "string", example: "My favorite recipes for summer" },
                    isPublic: { type: "boolean", default: true }
                }
            },
            response: {
                201: createResponseSchema({ type: "object", properties: { id: { type: "string" }, name: { type: "string" }, isPublic: { type: "boolean" } } }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/collections", RECIPE_SERVICE_URL);
    });

    app.get("/collections", {
        schema: {
            tags: ["Collections"],
            summary: "Get all collections",
            description: "### Overview\nRetrieves a list of all public collections or the user's private collections.\n\n### Technical Details\n- Filters by `isPublic` or `userId`.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            name: { type: "string" },
                            description: { type: "string", nullable: true },
                            isPublic: { type: "boolean" },
                            userId: { type: "string", format: "uuid" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                            _count: {
                                type: "object",
                                properties: {
                                    recipes: { type: "integer" }
                                }
                            },
                            recipes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string", format: "uuid" },
                                        collectionId: { type: "string", format: "uuid" },
                                        recipeId: { type: "string", format: "uuid" },
                                        addedAt: { type: "string", format: "date-time" },
                                        recipe: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string", format: "uuid" },
                                                title: { type: "string" },
                                                slug: { type: "string" },
                                                images: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            url: { type: "string" },
                                                            altText: { type: "string", nullable: true }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/collections", RECIPE_SERVICE_URL);
    });

    app.get("/collections/:id", {
        schema: {
            tags: ["Collections"],
            summary: "Get collection details",
            description: "### Overview\nRetrieves the comprehensive inventory of a specific collection, including nested recipe summaries.\n\n### Technical Details\n- Executes a JOIN operation across `Collection` and `Recipe` entities.\n- Hydrates recipe images and basic metadata for streamlined UI rendering.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Collection ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        isPublic: { type: "boolean" },
                        userId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        _count: {
                            type: "object",
                            properties: {
                                recipes: { type: "integer" }
                            }
                        },
                        recipes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string", format: "uuid" },
                                    collectionId: { type: "string", format: "uuid" },
                                    recipeId: { type: "string", format: "uuid" },
                                    addedAt: { type: "string", format: "date-time" },
                                    recipe: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            title: { type: "string" },
                                            slug: { type: "string" },
                                            images: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        url: { type: "string" },
                                                        altText: { type: "string", nullable: true }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/collections/${id}`, RECIPE_SERVICE_URL);
    });

    app.put("/collections/:id", {
        schema: {
            tags: ["Collections"],
            summary: "Update collection",
            description: "### Overview\nModifies an existing collection.\n\n### Technical Details\n- Supports partial updates for name, description, and public/private status.\n\n### Security\n- Only the owner of the collection can update it.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Collection ID" }
                }
            },
            body: {
                type: "object",
                properties: { name: { type: "string" }, description: { type: "string" }, isPublic: { type: "boolean" } }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        isPublic: { type: "boolean" },
                        userId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/collections/${id}`, RECIPE_SERVICE_URL);
    });

    app.delete("/collections/:id", {
        schema: {
            tags: ["Collections"],
            summary: "Delete collection",
            description: "### Overview\nPermanently removes a collection.\n\n### Technical Details\n- Deletes the collection record from the database.\n- All links to recipes in this collection are also removed.\n\n### Security\n- Only the collection owner can delete it.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Collection ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/collections/${id}`, RECIPE_SERVICE_URL);
    });

    app.post("/collections/:id/recipes", {
        schema: {
            tags: ["Collections"],
            summary: "Add recipe to collection",
            description: "### Overview\nLinks a recipe to a specific collection.\n\n### Technical Details\n- Creates a record in the `CollectionRecipe` table.\n\n### Security\n- Only the collection owner can add recipes.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Collection ID" }
                }
            },
            body: { type: "object", required: ["recipeId"], properties: { recipeId: { type: "string", format: "uuid" } } },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        collectionId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        addedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/collections/${id}/recipes`, RECIPE_SERVICE_URL);
    });

    app.delete("/collections/:id/recipes/:recipeId", {
        schema: {
            tags: ["Collections"],
            summary: "Remove recipe from collection",
            description: "### Overview\nRemoves a recipe from a collection.\n\n### Technical Details\n- Deletes the record from the `CollectionRecipe` table.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id", "recipeId"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Collection ID" },
                    recipeId: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id, recipeId } = request.params as { id: string; recipeId: string };
        return proxyHydrate(app, request, reply, `/api/v1/collections/${id}/recipes/${recipeId}`, RECIPE_SERVICE_URL);
    });

    app.get("/shopping-list", {
        schema: {
            tags: ["Shopping List"],
            summary: "Get my shopping list",
            description: "### Overview\nRetrieves the exhaustive, real-time inventory of items in the authenticated user's shopping list.\n\n### Technical Details\n- Aggregates manually added items and ingredients imported from specific recipes.\n- Returns a schema optimized for low-latency frontend synchronization.\n\n### Side Effects\n- Validates the current state of items against the recipe-service availability.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            quantity: { type: "string" },
                            isChecked: { type: "boolean" },
                            recipeId: { type: "string" },
                            recipeTitle: { type: "string" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/shopping-list", RECIPE_SERVICE_URL);
    });

    app.post("/shopping-list/items", {
        schema: {
            tags: ["Shopping List"],
            summary: "Add item manually to list",
            description: "### Overview\nRetrieves the authenticated user's current shopping list context.\n\n### Technical Details\n- Aggregates ingredients marked for purchase across multiple recipes.\n- Returns a normalized list of items with unit and quantity metadata.\n\n### Side Effects\n- May sync with the `user-service` for inventory management.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", example: "Milk" },
                    quantity: { type: "string", example: "1L" }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        quantity: { type: "string", nullable: true },
                        isChecked: { type: "boolean" },
                        userId: { type: "string", format: "uuid" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/shopping-list/items", RECIPE_SERVICE_URL);
    });

    app.post("/recipes/:id/shopping-list", {
        schema: {
            tags: ["Shopping List"],
            summary: "Add all recipe ingredients to list",
            description: "### Overview\nAutomatically adds all ingredients from a specific recipe to the user's shopping list.\n\n### Technical Details\n- Fetches the recipe's ingredient list.\n- Creates multiple items in the `ShoppingListItem` table.\n- Skips ingredients already present in the list (optional/implementation dependent).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/shopping-list`, RECIPE_SERVICE_URL);
    });

    app.put("/shopping-list/items/:id", {
        schema: {
            tags: ["Shopping List"],
            summary: "Update shopping list item",
            description: "### Overview\nModifies an existing shopping list item (e.g., changing quantity or checking it off).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Item ID" }
                }
            },
            body: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    quantity: { type: "string" },
                    isChecked: { type: "boolean" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/shopping-list/items/${id}`, RECIPE_SERVICE_URL);
    });

    app.delete("/shopping-list/items/:id", {
        schema: {
            tags: ["Shopping List"],
            summary: "Remove item from list",
            description: "### Overview\nPermanently removes an item from the shopping list.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Item ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/shopping-list/items/${id}`, RECIPE_SERVICE_URL);
    });

    app.delete("/shopping-list/checked", {
        schema: {
            tags: ["Shopping List"],
            summary: "Remove all checked items",
            description: "### Overview\nBulk deletes all items that have been marked as 'checked' from the shopping list.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/shopping-list/checked", RECIPE_SERVICE_URL);
    });

    app.delete("/shopping-list", {
        schema: {
            tags: ["Shopping List"],
            summary: "Clear all items from list",
            description: "### Overview\nRemoves every item from the user's shopping list, resetting it to empty.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {}
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/shopping-list", RECIPE_SERVICE_URL);
    });

    app.post("/meal-plans", {
        schema: {
            tags: ["Meal Plans"],
            summary: "Plan a meal",
            description: "### Overview\nIntegrates a recipe into the user's personalized culinary calendar for a specific date and time slot.\n\n### Technical Details\n- Persists the scheduling relation in the `MealPlans` store.\n- Supports multi-slot planning (Breakfast, Lunch, Dinner, Snack).\n\n### Side Effects\n- Automatically populates suggested ingredients in the user's weekly shopping preview.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            body: {
                type: "object",
                required: ["recipeId", "date", "mealType"],
                properties: {
                    recipeId: { type: "string", format: "uuid" },
                    date: { type: "string", format: "date", example: "2024-03-20" },
                    mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] }
                }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        date: { type: "string", format: "date-time" },
                        mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] },
                        notes: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/meal-plans", RECIPE_SERVICE_URL);
    });

    app.get("/meal-plans", {
        schema: {
            tags: ["Meal Plans"],
            summary: "Get my meal plans",
            description: "### Overview\nRetrieves all meal plans scheduled by the authenticated user.\n\n### Technical Details\n- Supports date range filtering via `startDate` and `endDate`.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            querystring: {
                type: "object",
                properties: {
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            userId: { type: "string", format: "uuid" },
                            recipeId: { type: "string", format: "uuid" },
                            date: { type: "string", format: "date-time" },
                            mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] },
                            notes: { type: "string", nullable: true },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/meal-plans", RECIPE_SERVICE_URL);
    });

    app.get("/meal-plans/:date", {
        schema: {
            tags: ["Meal Plans"],
            summary: "Get meal plans for a specific date",
            description: "### Overview\nRetrieves all recipes planned for a single day.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["date"],
                properties: {
                    date: { type: "string", format: "date", description: "Date (YYYY-MM-DD)" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            userId: { type: "string", format: "uuid" },
                            recipeId: { type: "string", format: "uuid" },
                            date: { type: "string", format: "date-time" },
                            mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] },
                            notes: { type: "string", nullable: true },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" }
                        }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { date } = request.params as { date: string };
        return proxyHydrate(app, request, reply, `/api/v1/meal-plans/${date}`, RECIPE_SERVICE_URL);
    });

    app.put("/meal-plans/:id", {
        schema: {
            tags: ["Meal Plans"],
            summary: "Update meal plan",
            description: "### Overview\nChanges the date or meal type of an existing meal plan.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Meal Plan ID" }
                }
            },
            body: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date" },
                    mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        date: { type: "string", format: "date-time" },
                        mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] },
                        notes: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/meal-plans/${id}`, RECIPE_SERVICE_URL);
    });

    app.delete("/meal-plans/:id", {
        schema: {
            tags: ["Meal Plans"],
            summary: "Delete meal plan",
            description: "### Overview\nRemoves a recipe from the meal calendar.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Meal Plan ID" }
                }
            },
            response: {
                200: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        recipeId: { type: "string", format: "uuid" },
                        date: { type: "string", format: "date-time" },
                        mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] },
                        notes: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/meal-plans/${id}`, RECIPE_SERVICE_URL);
    });


    app.post("/recipes/:id/report", {
        schema: {
            hide: true,
            tags: ["Reports"],
            summary: "Report a recipe",
            description: "### Overview\nAllows users to report inappropriate or incorrect recipes.\n\n### Technical Details\n- Creates a `Report` record with a reason and description.\n- Sets status to `PENDING` for moderator review.\n\n### Side Effects\n- May trigger an alert to the moderation team.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Recipe ID" }
                }
            },
            body: {
                type: "object",
                required: ["reason"],
                properties: { reason: { type: "string" }, description: { type: "string" } }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        reporterId: { type: "string", format: "uuid" },
                        targetType: { type: "string", enum: ["RECIPE", "COMMENT"] },
                        targetId: { type: "string", format: "uuid" },
                        reason: { type: "string" },
                        description: { type: "string", nullable: true },
                        status: { type: "string", enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/recipes/${id}/report`, RECIPE_SERVICE_URL);
    });

    app.post("/comments/:id/report", {
        schema: {
            hide: true,
            tags: ["Reports"],
            summary: "Report a comment",
            description: "### Overview\nFlags a comment for administrative review.\n\n### Technical Details\n- Creates a record in the `Reports` table.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Comment ID" }
                }
            },
            body: {
                type: "object",
                required: ["reason"],
                properties: { reason: { type: "string" }, description: { type: "string" } }
            },
            response: {
                201: createResponseSchema({
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        reporterId: { type: "string", format: "uuid" },
                        targetType: { type: "string", enum: ["RECIPE", "COMMENT"] },
                        targetId: { type: "string", format: "uuid" },
                        reason: { type: "string" },
                        description: { type: "string", nullable: true },
                        status: { type: "string", enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }),
                ...commonResponses
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/comments/${id}/report`, RECIPE_SERVICE_URL);
    });

    app.get("/admin/reports", {
        schema: {
            hide: true,
            tags: ["Admin"],
            summary: "Get all reports",
            description: "### Overview\nRetrieves a comprehensive list of all reports submitted by users.\n\n### Technical Details\n- Supports filtering by status (PENDING, RESOLVED, etc.) and target type.\n- Returns paginated results.\n\n### Security\n- Restricted to administrators (Bearer Token required).",
            security: [{ apiKeyAuth: [], bearerAuth: [] }]
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/admin/reports", RECIPE_SERVICE_URL);
    });

    app.get("/admin/reports/stats", {
        schema: {
            hide: true,
            tags: ["Admin"],
            summary: "Get reports statistics",
            description: "### Overview\nProvides a high-level summary of moderation activity.\n\n### Technical Details\n- Returns counts of reports grouped by status and priority.\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }]
        }
    }, async (request, reply) => {
        return proxyHydrate(app, request, reply, "/api/v1/admin/reports/stats", RECIPE_SERVICE_URL);
    });

    app.get("/admin/reports/:id", {
        schema: {
            hide: true,
            tags: ["Admin"],
            summary: "Get report by ID",
            description: "### Overview\nRetrieves the full details of a specific report for investigation.\n\n### Technical Details\n- Includes reporter details and the target content (recipe or comment).\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Report ID" }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/admin/reports/${id}`, RECIPE_SERVICE_URL);
    });

    app.put("/admin/reports/:id", {
        schema: {
            hide: true,
            tags: ["Admin"],
            summary: "Update report status",
            description: "### Overview\nUpdates the moderation status of a report.\n\n### Technical Details\n- Allows changing status to `REVIEWED`, `RESOLVED`, or `DISMISSED`.\n- Records the moderator ID and timestamp.\n\n### Security\n- Restricted to administrators.",
            security: [{ apiKeyAuth: [], bearerAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string", format: "uuid", description: "Report ID" }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        return proxyHydrate(app, request, reply, `/api/v1/admin/reports/${id}`, RECIPE_SERVICE_URL);
    });
}
