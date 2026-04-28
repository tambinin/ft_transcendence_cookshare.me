export const errorSchema = {
    type: "object",
    properties: {
        statusCode: { type: "integer" },
        error: { type: "string" },
        message: { type: "string" }
    }
};

export const commonResponses = {
    400: {
        description: "Bad Request - The request contains invalid data or missing required fields",
        ...errorSchema
    },
    401: {
        description: "Unauthorized - Authentication is required or the provided credentials are invalid",
        ...errorSchema
    },
    403: {
        description: "Forbidden - You do not have permission to access this resource",
        ...errorSchema
    },
    404: {
        description: "Not Found - The requested resource does not exist",
        ...errorSchema
    },
    409: {
        description: "Conflict - The request conflicts with the current state of the resource",
        ...errorSchema
    },
    422: {
        description: "Unprocessable Entity - The request was well-formed but contains semantic errors",
        ...errorSchema
    },
    429: {
        description: "Too Many Requests - Rate limit exceeded, please try again later",
        ...errorSchema
    },
    500: {
        description: "Internal Server Error - An unexpected error occurred on the server",
        ...errorSchema
    }
};

export const createResponseSchema = (dataSchema: object) => ({
    type: "object",
    additionalProperties: true,
    properties: {
        status: { type: "string", example: "success" },
        message: { type: "string", nullable: true },
        data: dataSchema
    }
});

export const paginationSchema = {
    type: "object",
    properties: {
        page: { type: "integer" },
        limit: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
        hasNext: { type: "boolean" },
        hasPrev: { type: "boolean" }
    }
};

export const authorSummarySchema = {
    type: "object",
    additionalProperties: true,
    properties: {
        id: { type: "string", format: "uuid" },
        username: { type: "string" },
        avatarUrl: { type: "string", nullable: true }
    }
};

export const categorySummarySchema = {
    type: "object",
    additionalProperties: true,
    properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" }
    }
};

export const imageSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
        id: { type: "string", format: "uuid" },
        url: { type: "string" },
        altText: { type: "string", nullable: true },
        isPrimary: { type: "boolean" },
        sortOrder: { type: "integer" }
    }
};

export const recipeSummarySchema = {
    type: "object",
    additionalProperties: true,
    properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string" },
        slug: { type: "string" },
        description: { type: "string" },
        prepTime: { type: "integer" },
        cookTime: { type: "integer" },
        servings: { type: "integer" },
        difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
        viewCount: { type: "integer" },
        averageScore: { type: "number" },
        ratingCount: { type: "integer" },
        isPublished: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        authorId: { type: "string", format: "uuid" },
        author: authorSummarySchema,
        category: { ...categorySummarySchema, nullable: true },
        primaryImage: { ...imageSchema, nullable: true },
        images: { type: "array", items: imageSchema },
        commentCount: { type: "integer" },
        isFavorite: { type: "boolean" },
        categoryId: { type: "string", format: "uuid", nullable: true }
    }
};

export const recipeFullSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
        ...recipeSummarySchema.properties,
        ingredients: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    quantityText: { type: "string" },
                    isOptional: { type: "boolean" },
                    sortOrder: { type: "integer" }
                }
            }
        },
        instructions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    stepNumber: { type: "integer" },
                    description: { type: "string" }
                }
            }
        },
        dietaryTags: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" }
                }
            }
        },
        updatedAt: { type: "string", format: "date-time" }
    }
};
