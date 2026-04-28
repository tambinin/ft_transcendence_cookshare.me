import db from "../utils/db";
import { MealType } from "../generated/prisma";
import { NotFoundError } from "@transcendence/common";
import { notifyMealPlanUpdate } from "../utils/notifyWebsocket";

export async function addMealPlan(data: {
    userId: string;
    date: Date;
    mealType: MealType;
    recipeId: string;
    notes?: string;
}) {
    const recipe = await db.recipe.findUnique({
        where: { id: data.recipeId }
    });
    if (!recipe) {
        throw new NotFoundError("Recipe not found");
    }

    const result = await db.mealPlan.upsert({
        where: {
            userId_date_mealType: {
                userId: data.userId,
                date: data.date,
                mealType: data.mealType
            }
        },
        update: {
            recipeId: data.recipeId,
            notes: data.notes
        },
        create: data
    });
    notifyMealPlanUpdate(data.userId, 'UPSERT', { mealPlanId: result.id }).catch(() => {});
    return result;
}

export async function getMealPlansByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
) {
    const mealPlans = await db.mealPlan.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: [
            { date: 'asc' },
            { mealType: 'asc' }
        ]
    });
    return mealPlans;
}

export async function getMealPlanByDate(userId: string, date: Date) {
    return db.mealPlan.findMany({
        where: {
            userId,
            date
        },
        orderBy: { mealType: 'asc' }
    });
}

export async function getMealPlanById(id: string) {
    return db.mealPlan.findUnique({ where: { id } });
}

export async function updateMealPlan(
    id: string,
    userId: string,
    data: { recipeId?: string; notes?: string }
) {
    const existing = await db.mealPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        return null;
    }

    if (data.recipeId) {
        const recipe = await db.recipe.findUnique({
            where: { id: data.recipeId }
        });
        if (!recipe) {
            throw new NotFoundError("Recipe not found");
        }
    }

    const result = await db.mealPlan.update({
        where: { id },
        data
    });
    notifyMealPlanUpdate(userId, 'UPDATE', { mealPlanId: id }).catch(() => {});
    return result;
}

export async function deleteMealPlan(id: string, userId: string) {
    const existing = await db.mealPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        return null;
    }

    const result = await db.mealPlan.delete({ where: { id } });
    notifyMealPlanUpdate(userId, 'DELETE', { mealPlanId: id }).catch(() => {});
    return result;
}
