import db from '../utils/db';
import { redis } from '@transcendence/common';

export const searchIngredients = async (query: string, limit: number = 10) => {
    if (!query || query.length < 2) {
        return [];
    }

    const cacheKey = `recipe-service:ingredients:search:${query.toLowerCase()}:${limit}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const ingredients = await db.recipeIngredient.findMany({
        where: {
            name: {
                contains: query,
                mode: 'insensitive'
            }
        },
        distinct: ['name'],
        take: limit,
        select: {
            name: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    const result = ingredients.map(i => i.name);

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);

    return result;
};

export const searchRecipes = async (query: string, filters: {
    categoryId?: string;
    dietaryTagIds?: string[];
    minRating?: number;
    maxPrepTime?: number;
    sortBy?: 'relevance' | 'rating' | 'newest' | 'popular';
    page?: number;
    limit?: number;
} = {}) => {
    const {
        categoryId,
        dietaryTagIds = [],
        minRating = 0,
        maxPrepTime,
        sortBy = 'relevance',
        page = 1,
        limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    let where: any = {
        isPublished: true
    };

    if (query && query.length >= 2) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { instructions: { some: { description: { contains: query, mode: 'insensitive' } } } },
            { ingredients: { some: { name: { contains: query, mode: 'insensitive' } } } }
        ];
    }

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (dietaryTagIds.length > 0) {
        where.dietaryTags = {
            some: {
                dietaryTagId: { in: dietaryTagIds }
            }
        };
    }

    if (maxPrepTime) {
        where.prepTimeMinutes = { lte: maxPrepTime };
    }

    let orderBy: any;
    switch (sortBy) {
        case 'rating':
            orderBy = { averageScore: 'desc' };
            break;
        case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
        case 'popular':
            orderBy = { viewCount: 'desc' };
            break;
        default:
            orderBy = { createdAt: 'desc' };
    }

    const [recipes, total] = await Promise.all([
        db.recipe.findMany({
            where,
            include: {
                category: true,
                dietaryTags: { include: { dietaryTag: true } },
                images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy,
            skip,
            take: limit
        }),
        db.recipe.count({ where })
    ]);

    const result = recipes.map(recipe => {
        return {
            id: recipe.id,
            title: recipe.title,
            slug: recipe.slug,
            description: recipe.description,
            authorId: recipe.authorId,
            prepTimeMinutes: recipe.prepTime,
            servings: recipe.servings,
            averageScore: recipe.averageScore,
            ratingCount: recipe.ratingCount,
            viewCount: recipe.viewCount,
            createdAt: recipe.createdAt,
            category: recipe.category,
            tags: recipe.dietaryTags.map(dt => dt.dietaryTag),
            primaryImage: recipe.images[0] || null,
            images: recipe.images,
        };
    });

    return {
        recipes: result,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}