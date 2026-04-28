import { FastifyInstance } from "fastify";
import db from "../utils/db";
import { slugify, NotFoundError, ForbiddenError, ConflictError, NotificationType, fetchWithTimeout } from "@transcendence/common";
import { notifyUser } from "../utils/notifyUser";
import { notifyRecipeRoom, broadcast } from "../utils/notifyWebsocket";
import { triggerGamificationEvent, GamificationEvent } from "../utils/gamification";
import pino from "pino";

const logger = pino({ name: 'recipe-service' });

export async function createRecipe(
    data: {
        title: string;
        description: string;
        prepTime: number;
        cookTime: number;
        servings: number;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        isPublished?: boolean;
        authorId: string;
        categoryId: string;
        ingredients: { name: string; quantityText: string; isOptional?: boolean }[];
        instructions: { stepNumber: number; description: string }[];
        dietaryTagIds?: string[];
    }) {
    const slug = slugify(data.title);
    const recipe = await db.recipe.create({
        data: {
            title: data.title,
            slug: slug,
            description: data.description,
            prepTime: data.prepTime,
            cookTime: data.cookTime,
            servings: data.servings,
            difficulty: data.difficulty,
            isPublished: data.isPublished,
            authorId: data.authorId,
            categoryId: data.categoryId,
            ingredients: {
                create: data.ingredients.map((ing, index) => ({
                    name: ing.name,
                    quantityText: ing.quantityText,
                    sortOrder: index,
                    isOptional: ing.isOptional ?? false,
                })),
            },
            instructions: {
                create: data.instructions.map((ins) => ({
                    stepNumber: ins.stepNumber,
                    description: ins.description,
                })),
            },
            dietaryTags: {
                create: data.dietaryTagIds?.map(tagId => ({
                    dietaryTagId: tagId
                }))
            }
        },
        include: {
            ingredients: {
                select: {
                    name: true,
                    quantityText: true,
                    sortOrder: true,
                    isOptional: true
                }
            },
            instructions: { orderBy: { stepNumber: 'asc' } },
            category: true,
            dietaryTags: {
                include: {
                    dietaryTag: true
                }
            }
        }
    });

    const recipeCount = await db.recipe.count({ where: { authorId: data.authorId } });
    triggerGamificationEvent(data.authorId, GamificationEvent.RECIPE_CREATED, { recipeCount });

    try {
        const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

        // Fetch author info AND followers in parallel (instead of sequentially)
        const [authorResp, followersResp] = await Promise.all([
            fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/users/${data.authorId}`, {
                headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY! }
            }).catch(() => null),
            fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/users/${data.authorId}/followers`, {
                headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY! }
            }).catch(() => null),
        ]);

        let authorUsername = 'Chef';
        let authorAvatarUrl: string | null = null;
        if (authorResp?.ok) {
            const authorResult = await authorResp.json();
            if (authorResult.status === 'success' && authorResult.data) {
                authorUsername = authorResult.data.username || 'Chef';
                authorAvatarUrl = authorResult.data.avatarUrl || null;
            }
        }

        if (followersResp?.ok) {
            const result = await followersResp.json();

            if (result.status === 'success' && Array.isArray(result.data)) {
                const followers = result.data;
                Promise.all(followers.map((follower: any) =>
                    notifyUser(
                        follower.id,
                        NotificationType.NEW_RECIPE,
                        'New Recipe',
                        `${authorUsername} has posted a new recipe: "${data.title}"`,
                        {
                            recipeId: recipe.id,
                            recipeTitle: data.title,
                            recipeSlug: recipe.slug,
                            userId: data.authorId,
                            username: authorUsername,
                            avatarUrl: authorAvatarUrl,
                        }
                    )
                )).catch(err => logger.error({ err }, "Failed to notify followers"));
            }
        }
    } catch (error) {
        logger.error({ err: error }, "Error fetching followers to notify");
    }

    return {
        ...recipe,
        dietaryTags: recipe.dietaryTags.map(dt => dt.dietaryTag)
    };
}

export async function getAllRecipes(currentUserId?: string, page: number = 1, limit: number = 20) {
    // Clamp limit to prevent abuse (max 50 per page)
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (safePage - 1) * safeLimit;

    const where = { isPublished: true };

    const [recipes, total] = await Promise.all([
        db.recipe.findMany({
            where,
            skip,
            take: safeLimit,
            include: {
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        url: true,
                        altText: true,
                        isPrimary: true,
                        sortOrder: true,
                    }
                },
                _count: { select: { comments: true } },
            },
            orderBy: {
                createdAt: 'desc'
            },
        }),
        db.recipe.count({ where }),
    ]);

    let favoriteRecipeIds = new Set<string>();
    if (currentUserId) {
        const favorites = await db.favorite.findMany({
            where: { userId: currentUserId, recipeId: { in: recipes.map(r => r.id) } },
            select: { recipeId: true },
        });
        favoriteRecipeIds = new Set(favorites.map(f => f.recipeId));
    }

    const recipesWithMeta = recipes.map(recipe => {
        const { _count, ...recipeRest } = recipe;

        return {
            ...recipeRest,
            commentCount: _count.comments,
            isFavorite: favoriteRecipeIds.has(recipe.id),
        };
    });

    return {
        recipes: recipesWithMeta,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
            hasNext: safePage < Math.ceil(total / safeLimit),
            hasPrev: safePage > 1,
        },
    };
}

export async function getRecipeById(id: string, currentUserId?: string) {
    const recipe = await db.recipe.findUnique({
        where: { id },
        include: {
            ingredients: true,
            instructions: true,
            category: true,
            images: {
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    url: true,
                    altText: true,
                    isPrimary: true,
                    sortOrder: true,
                }
            },
            comments: {
                orderBy: {
                    createdAt: 'desc'
                },
            },
        },
    });

    if (!recipe) {
        return null;
    }

    // Fire-and-forget: don't block the response for a write operation
    db.recipe.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
    }).catch(() => {});

    let isFavorite = false;
    if (currentUserId) {
        const fav = await db.favorite.findUnique({
            where: { userId_recipeId: { userId: currentUserId, recipeId: id } },
        });
        isFavorite = !!fav;
    }

    return {
        ...recipe,
        isFavorite,
    };
}

export async function updateRecipe(id: string,
    data: {
        title?: string;
        description?: string;
        prepTime?: number;
        cookTime?: number;
        servings?: number;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        isPublished?: boolean;
        categoryId?: string;
        ingredients?: { id?: string; name: string; quantityText: string; isOptional?: boolean }[];
        instructions?: { id?: string; stepNumber: number; description: string }[];
    }) {

    const existing = await db.recipe.findUnique({
        where: { id },
    });
    if (!existing) {
        return null;
    }

    const updateData: any = {};

    if (data.title && data.title !== existing.title) {
        updateData.title = data.title;
        updateData.slug = slugify(data.title);
    }
    if (data.description && data.description !== existing.description) {
        updateData.description = data.description;
    }
    if (data.prepTime !== undefined && data.prepTime !== existing.prepTime) {
        updateData.prepTime = data.prepTime;
    }
    if (data.cookTime !== undefined && data.cookTime !== existing.cookTime) {
        updateData.cookTime = data.cookTime;
    }
    if (data.servings !== undefined && data.servings !== existing.servings) {
        updateData.servings = data.servings;
    }
    if (data.difficulty && data.difficulty !== existing.difficulty) {
        updateData.difficulty = data.difficulty;
    }
    if (data.isPublished !== undefined && data.isPublished !== existing.isPublished) {
        updateData.isPublished = data.isPublished;
    }
    if (data.categoryId && data.categoryId !== existing.categoryId) {
        updateData.categoryId = data.categoryId;
    }

    const ingredientsUpdate = data.ingredients?.filter(ing => ing.id).map((ing) => ({
        where: { id: ing.id },
        data: {
            name: ing.name,
            quantityText: ing.quantityText,
            isOptional: ing.isOptional ?? false,
        }
    })) || [];

    const ingredientsCreate = data.ingredients?.filter(ing => !ing.id).map((ing) => ({
        name: ing.name,
        quantityText: ing.quantityText,
        isOptional: ing.isOptional ?? false,
        // recipeId: id,
    })) || [];

    const instructionsUpdate = data.instructions?.filter(ins => ins.id).map((ins => ({
        where: { id: ins.id },
        data: {
            stepNumber: ins.stepNumber,
            description: ins.description,
        }
    }))) || [];

    const instructionsCreate = data.instructions?.filter(ins => !ins.id).map((ins => ({
        stepNumber: ins.stepNumber,
        description: ins.description
    }))) || [];

    const updatedRecipe = await db.recipe.update({
        where: { id },
        data: {
            ...updateData,
            ...(data.ingredients && {
                ingredients: {
                    deleteMany: {},
                    create: data.ingredients.map((ing, index) => ({
                        name: ing.name,
                        quantityText: ing.quantityText,
                        sortOrder: index,
                        isOptional: ing.isOptional ?? false,
                    })),
                },
            }),
            ...(data.instructions && {
                instructions: {
                    deleteMany: {},
                    create: data.instructions.map((ins) => ({
                        stepNumber: ins.stepNumber,
                        description: ins.description,
                    })),
                },
            }),
        },
        include: {
            ingredients: true,
            instructions: { orderBy: { stepNumber: 'asc' } },
            category: true,
        }
    });
    return updatedRecipe;
}

export async function deleteRecipe(id: string) {
    const existing = await db.recipe.findUnique({
        where: { id }
    });
    if (!existing) {
        return null;
    }

    const recipe = await db.recipe.delete({
        where: { id }
    });
    return recipe;
}

export async function getRecipeBySlug(slug: string) {
    const recipe = await db.recipe.findUnique({
        where: { slug },
        include: {
            ingredients: true,
            instructions: { orderBy: { stepNumber: 'asc' } },
            category: true,
            images: {
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    url: true,
                    altText: true,
                    isPrimary: true,
                    sortOrder: true,
                }
            },
            comments: {
                orderBy: {
                    createdAt: 'desc'
                },
            },
        },
    });

    if (!recipe) {
        return null;
    }

    // Fire-and-forget: don't block the response for a write operation
    db.recipe.update({
        where: { id: recipe.id },
        data: { viewCount: { increment: 1 } }
    }).catch(() => {});

    return recipe;
}

async function updateRecipeRatingStats(recipeId: string) {
    const ratings = await db.rating.findMany({ where: { recipeId } });
    const ratingCount = ratings.length;
    const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
    const averageScore = ratingCount > 0 ? Math.round((totalScore / ratingCount) * 10) / 10 : 0;

    await db.recipe.update({
        where: { id: recipeId },
        data: { averageScore, ratingCount }
    });

    return { averageScore, ratingCount };
}

export async function rateRecipe(
    recipeId: string,
    userId: string,
    score: number) {

    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { isPublished: true, authorId: true, title: true, slug: true }
    });

    if (!recipe) {
        throw new NotFoundError("Recipe not found");
    }

    if (!recipe.isPublished) {
        throw new ForbiddenError("Cannot rate an unpublished recipe");
    }

    if (recipe.authorId === userId) {
        throw new ForbiddenError("Authors cannot rate their own recipes");
    }

    const rating = await db.rating.upsert({
        where: {
            userId_recipeId: {
                recipeId,
                userId
            }
        },
        update: {
            score
        },
        create: {
            recipeId,
            userId,
            score
        }
    });

    await updateRecipeRatingStats(recipeId);

    // Parallelize: fetch updated recipe stats AND rater info concurrently
    const [updatedRecipe, raterInfo] = await Promise.all([
        db.recipe.findUnique({
            where: { id: recipeId },
            select: { averageScore: true, ratingCount: true }
        }),
        (async () => {
            try {
                const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
                const userResp = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/users/${userId}`, {
                    headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY! }
                });
                if (userResp.ok) {
                    const userResult = await userResp.json();
                    if (userResult.status === 'success' && userResult.data) {
                        return {
                            username: userResult.data.username || 'Someone',
                            avatarUrl: userResult.data.avatarUrl || null,
                        };
                    }
                }
            } catch { /* ignore */ }
            return { username: 'Someone', avatarUrl: null as string | null };
        })(),
    ]);

    if (updatedRecipe) {
        broadcast('recipe_rating_update', {
            recipeId,
            averageScore: updatedRecipe.averageScore,
            ratingCount: updatedRecipe.ratingCount,
        });
    }

    // Fire-and-forget notification
    notifyUser(
        recipe.authorId,
        NotificationType.NEW_RATING,
        'New Rating',
        `${raterInfo.username} rated your recipe "${recipe.title}" ${score}/5`,
        {
            recipeId,
            recipeTitle: recipe.title,
            recipeSlug: recipe.slug,
            score,
            userId,
            username: raterInfo.username,
            avatarUrl: raterInfo.avatarUrl,
        }
    ).catch(() => {});

    triggerGamificationEvent(userId, GamificationEvent.REVIEW_GIVEN, {});

    return rating;
}

export async function getRecipeRatings(recipeId: string) {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, averageScore: true, ratingCount: true },
    });
    if (!recipe) {
        throw new NotFoundError("Recipe not found");
    }

    return {
        id: recipeId,
        averageScore: recipe.averageScore,
        totalRaters: recipe.ratingCount,
    };
}

export async function removeRecipeRating(recipeId: string, userId: string) {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId }
    });
    if (!recipe) {
        throw new NotFoundError("Recipe not found");
    }

    const rating = await db.rating.delete({
        where: {
            userId_recipeId: {
                recipeId,
                userId
            },
        }
    });
    if (!rating) {
        throw new Error("Rating not Found");
    }

    const { averageScore, ratingCount } = await updateRecipeRatingStats(recipeId);

    // Notify all viewers in real-time about the updated rating
    broadcast('recipe_rating_update', {
        recipeId,
        averageScore,
        ratingCount,
    });

    return {
        id: recipeId,
        averageScore,
        totalRaters: ratingCount
    };
}

export async function getAllRecipesBySearch(
    page: number = 1,
    limit: number = 10,
    categoryId?: string,
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD',
    search?: string,
    isPublished?: boolean,
    authorId?: string,
    sortBy: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'viewCount' | 'rating' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    minPrepTime?: number,
    maxPrepTime?: number,
    minCookTime?: number,
    maxCookTime?: number,
    servings?: number,
    dietaryTags?: string[],
    currentUserId?: string
) {
    const where: any = {};

    if (categoryId) {
        where.categoryId = categoryId;
    }
    if (difficulty) {
        where.difficulty = difficulty;
    }
    if (authorId) {
        where.authorId = authorId;
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { ingredients: { some: { name: { contains: search, mode: 'insensitive' } } } }
        ];
    }
    if (isPublished !== undefined) {
        where.isPublished = isPublished;
    } else {
        where.isPublished = true;
    }
    if (minPrepTime !== undefined) {
        where.prepTime = { ...where.prepTime, gte: minPrepTime };
    }
    if (maxPrepTime !== undefined) {
        where.prepTime = { ...where.prepTime, lte: maxPrepTime };
    }
    if (minCookTime !== undefined) {
        where.cookTime = { ...where.cookTime, gte: minCookTime };
    }
    if (maxCookTime !== undefined) {
        where.cookTime = { ...where.cookTime, lte: maxCookTime };
    }
    if (servings !== undefined) {
        where.servings = servings;
    }
    if (dietaryTags && dietaryTags.length > 0) {
        where.dietaryTags = {
            some: {
                dietaryTag: {
                    slug: { in: dietaryTags }
                }
            }
        };
    }

    const [recipes, total] = await Promise.all([
        db.recipe.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                ingredients: true,
                instructions: { orderBy: { stepNumber: 'asc' } },
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        url: true,
                        altText: true,
                        isPrimary: true,
                        sortOrder: true,
                    }
                },
                _count: { select: { comments: true } },
            },
            orderBy: {
                [sortBy === 'rating' ? 'averageScore' : sortBy]: sortOrder,
            },
        }),
        db.recipe.count({ where })
    ]);

    let favoriteRecipeIds = new Set<string>();
    if (currentUserId) {
        const favorites = await db.favorite.findMany({
            where: { userId: currentUserId, recipeId: { in: recipes.map(r => r.id) } },
            select: { recipeId: true },
        });
        favoriteRecipeIds = new Set(favorites.map(f => f.recipeId));
    }

    const recipesWithRatings = recipes.map(recipe => {
        const { _count, ...recipeRest } = recipe;

        return {
            ...recipeRest,
            commentCount: _count.comments,
            isFavorite: favoriteRecipeIds.has(recipe.id),
        };
    });

    return {
        recipes: recipesWithRatings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        }
    };
}

export async function getRecipesByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
    sortBy?: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'viewCount' | 'rating',
    sortOrder?: 'asc' | 'desc'
) {
    return getAllRecipesBySearch(
        page,
        limit,
        categoryId,
        undefined,
        undefined,
        undefined,
        undefined,
        sortBy,
        sortOrder
    );
}

export async function getRecipesByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 10,
    includeUnpublished: boolean = false,
    sortBy?: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'viewCount' | 'rating',
    sortOrder?: 'asc' | 'desc'
) {
    return getAllRecipesBySearch(
        page,
        limit,
        undefined,
        undefined,
        undefined,
        includeUnpublished ? undefined : true,
        authorId,
        sortBy,
        sortOrder
    );
}

export async function getRecipesByDifficulty(
    difficulty: 'EASY' | 'MEDIUM' | 'HARD',
    page: number = 1,
    limit: number = 10,
    sortBy?: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'viewCount' | 'rating',
    sortOrder?: 'asc' | 'desc'
) {
    return getAllRecipesBySearch(
        page,
        limit,
        undefined,
        difficulty,
        undefined,
        true,
        undefined,
        sortBy,
        sortOrder
    );
}

export async function getMyRecipes(
    userId: string,
    page: number = 1,
    limit: number = 10,
    publishedOnly: boolean = false,
    sortBy?: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'viewCount' | 'rating',
    sortOrder?: 'asc' | 'desc'
) {
    const where: any = {
        authorId: userId
    };
    if (publishedOnly) {
        where.isPublished = true;
    }
    const [recipes, total] = await Promise.all([
        db.recipe.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                ingredients: true,
                instructions: { orderBy: { stepNumber: 'asc' } },
                category: true,
                images: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        url: true,
                        altText: true,
                        isPrimary: true,
                        sortOrder: true,
                    }
                },
                _count: { select: { comments: true } },
            },
            orderBy: {
                [sortBy === 'rating' ? 'averageScore' : (sortBy || 'createdAt')]: sortOrder || 'desc',
            },
        }),
        db.recipe.count({ where })
    ]);
    const recipesWithRatings = recipes.map(recipe => {
        const { _count, ...recipeRest } = recipe;
        return {
            ...recipeRest,
            commentCount: _count.comments,
        };
    });
    return {
        recipes: recipesWithRatings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        }
    };
}



export async function addToFavorites(
    userId: string,
    recipeId: string
) {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, authorId: true, title: true, slug: true },
    });
    if (!recipe) {
        throw new NotFoundError("Recipe not found");
    }

    // Run upsert AND user info fetch in parallel (notification needs both)
    const [favorite, favUserInfo] = await Promise.all([
        db.favorite.upsert({
            where: {
                userId_recipeId: {
                    userId,
                    recipeId
                }
            },
            update: {},
            create: {
                userId,
                recipeId
            }
        }),
        recipe.authorId !== userId
            ? (async () => {
                try {
                    const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
                    const userResp = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/users/${userId}`, {
                        headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY! }
                    });
                    if (userResp.ok) {
                        const userResult = await userResp.json();
                        if (userResult.status === 'success' && userResult.data) {
                            return {
                                username: userResult.data.username || 'Someone',
                                avatarUrl: userResult.data.avatarUrl || null as string | null,
                            };
                        }
                    }
                } catch { /* ignore */ }
                return { username: 'Someone', avatarUrl: null as string | null };
            })()
            : null,
    ]);

    if (recipe.authorId !== userId && favUserInfo) {
        // Fire-and-forget notification
        notifyUser(
            recipe.authorId,
            NotificationType.RECIPE_FAVORITED,
            'Recipe Favorited',
            `${favUserInfo.username} added your recipe "${recipe.title}" to their favorites`,
            {
                recipeId,
                recipeTitle: recipe.title,
                recipeSlug: recipe.slug,
                userId,
                username: favUserInfo.username,
                avatarUrl: favUserInfo.avatarUrl,
            }
        ).catch(() => {});
    }

    return favorite;
}

export async function removeFromFavorites(
    userId: string,
    recipeId: string
) {
    await db.favorite.deleteMany({
        where: {
            userId,
            recipeId
        }
    });
    return { success: true };
}

export async function getUserFavorites(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
) {
    const skip = (page - 1) * limit;
    const validSortBy = ['createdAt', 'title', 'prepTime', 'cookTime', 'viewCount'] as const;
    const sortByValidated = sortBy && validSortBy.includes(sortBy as any) ? sortBy as typeof validSortBy[number] : 'createdAt';
    const validSortOrder = ['asc', 'desc'] as const;
    const sortOrderValidated = sortOrder && validSortOrder.includes(sortOrder as any) ? sortOrder as typeof validSortOrder[number] : 'desc';
    const orderBy: any = sortByValidated === 'createdAt' ? { createdAt: sortOrderValidated } : { recipe: { [sortByValidated]: sortOrderValidated } };
    const [favorites, total] = await Promise.all([
        db.favorite.findMany({
            where: {
                userId
            },
            include: {
                recipe: {
                    include: {
                        category: true,
                        ingredients: true,
                        instructions: true,
                        images: {
                            orderBy: { sortOrder: 'asc' },
                            select: {
                                id: true,
                                url: true,
                                altText: true,
                                isPrimary: true,
                                sortOrder: true,
                            }
                        },
                        dietaryTags: {
                            include: { dietaryTag: true }
                        },
                        _count: { select: { comments: true } },
                    }
                }
            },
            orderBy,
            skip,
            take: limit
        }),
        db.favorite.count({
            where: { userId }
        })
    ]);

    const recipes = favorites.map(fav => {
        const recipe = fav.recipe;
        const { _count, dietaryTags, ...recipeWithoutCount } = recipe;
        return {
            ...recipeWithoutCount,
            commentCount: _count.comments,
            isFavorite: true,
            favoritedAt: fav.createdAt,
            dietaryTags: (dietaryTags || []).map((dt: any) => dt.dietaryTag),
        };
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        recipes,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev
        }
    };
}