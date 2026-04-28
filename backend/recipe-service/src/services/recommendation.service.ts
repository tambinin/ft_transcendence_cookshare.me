import db from "../utils/db";
import { redis } from "@transcendence/common";

export async function getSimilarRecipes(recipeId: string, limit: number = 5) {
    const cacheKey = `recipe-service:similar:${recipeId}:${limit}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const sourceRecipe = await db.recipe.findUnique({
        where: { id: recipeId },
        include: {
            dietaryTags: {
                include: { dietaryTag: true }
            }
        }
    });

    if (!sourceRecipe) {
        return [];
    }

    const sourceTagIds = sourceRecipe.dietaryTags.map(dt => dt.dietaryTagId);
    const categoryId = sourceRecipe.categoryId;

    const candidates = await db.recipe.findMany({
        where: {
            isPublished: true,
            id: { not: recipeId },
            OR: [
                { categoryId: categoryId },
                {
                    dietaryTags: {
                        some: {
                            dietaryTagId: { in: sourceTagIds }
                        }
                    }
                }
            ]
        },
        include: {
            category: true,
            dietaryTags: {
                include: { dietaryTag: true }
            },
            images: {
                where: { isPrimary: true },
                take: 1
            }
        },
        take: 20
    });

    const scoredRecipes = candidates.map(recipe => {
        let score = 0;

        if (recipe.categoryId === categoryId) {
            score += 50;
        }
        const recipeTagIds = recipe.dietaryTags.map(dt => dt.dietaryTagId);
        const commonTags = recipeTagIds.filter(id => sourceTagIds.includes(id));
        score += (commonTags.length * 10);

        return {
            ...recipe,
            similarityScore: score
        };
    });

    scoredRecipes.sort((a, b) => b.similarityScore - a.similarityScore);

    const result = scoredRecipes.slice(0, limit).map(r => {
        const { dietaryTags, similarityScore, ...rest } = r;

        return {
            ...rest,
            tags: dietaryTags.map(dt => dt.dietaryTag)
        };
    });

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);

    return result;
}

export async function getRecommendedRecipes(userId: string, limit: number = 10) {
    const cacheKey = `recipe-service:recommended:${userId}:${limit}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interactions = await db.userInteraction.findMany({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const categoryScores: Record<string, number> = {};
    const tagScores: Record<string, number> = {};
    const viewedRecipeIds = new Set<string>();

    for (const interaction of interactions) {
        if (interaction.type === 'VIEW_RECIPE') {
            const payload = interaction.payload as { recipeId: string };
            if (payload?.recipeId) {
                viewedRecipeIds.add(payload.recipeId);
            }
        }
    }

    const viewedRecipes = await db.recipe.findMany({
        where: { id: { in: Array.from(viewedRecipeIds) } },
        include: { dietaryTags: true }
    });

    viewedRecipes.forEach(recipe => {
        if (recipe.categoryId) {
            categoryScores[recipe.categoryId] = (categoryScores[recipe.categoryId] || 0) + 1;
        }
        recipe.dietaryTags.forEach(dt => {
            tagScores[dt.dietaryTagId] = (tagScores[dt.dietaryTagId] || 0) + 1;
        });
    });

    const topCategories = Object.entries(categoryScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id);

    const topTags = Object.entries(tagScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

    if (topCategories.length === 0 && topTags.length === 0) {
        const popular = await getPopularRecipes(limit);
        await redis.set(cacheKey, JSON.stringify(popular), 'EX', 600); // 10 minutes
        return popular;
    }

    const candidates = await db.recipe.findMany({
        where: {
            isPublished: true,
            id: { notIn: Array.from(viewedRecipeIds) },
            OR: [
                { categoryId: { in: topCategories } },
                { dietaryTags: { some: { dietaryTagId: { in: topTags } } } }
            ]
        },
        include: {
            category: true,
            dietaryTags: { include: { dietaryTag: true } },
            images: { where: { isPrimary: true }, take: 1 }
        },
        take: 50
    });

    const scoredCandidates = candidates.map(recipe => {
        let score = 0;

        if (topCategories.includes(recipe.categoryId)) {
            score += 20;
            if (recipe.categoryId === topCategories[0]) score += 10;
        }

        const recipeTagIds = recipe.dietaryTags.map(dt => dt.dietaryTagId);
        const matchCount = recipeTagIds.filter(id => topTags.includes(id)).length;
        score += (matchCount * 5);

        score += Math.log(recipe.viewCount + 1) * 2;

        score += (recipe.averageScore * 2);

        return { ...recipe, recommendationScore: score };
    });

    scoredCandidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

    const result = scoredCandidates.slice(0, limit).map(r => {
        const { recommendationScore, dietaryTags, ...rest } = r;
        return {
            ...rest,
            ratingCount: r.ratingCount,
            averageScore: r.averageScore,
            tags: dietaryTags.map(dt => dt.dietaryTag)
        };
    });

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 600);

    return result;
}

async function getPopularRecipes(limit: number) {
    const recipes = await db.recipe.findMany({
        where: { isPublished: true },
        orderBy: { viewCount: 'desc' },
        take: limit,
        include: {
            category: true,
            dietaryTags: { include: { dietaryTag: true } },
            images: { where: { isPrimary: true }, take: 1 }
        }
    });

    return recipes.map(r => ({
        ...r,
        tags: r.dietaryTags.map(dt => dt.dietaryTag)
    }));
}
