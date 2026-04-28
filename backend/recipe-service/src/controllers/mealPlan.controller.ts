import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
    addMealPlan,
    getMealPlansByDateRange,
    getMealPlanByDate,
    updateMealPlan,
    deleteMealPlan
} from "../services/mealPlan.service";
import {
    sendSuccess,
    sendCreated,
    sendDeleted,
    NotFoundError,
    ForbiddenError,
    ConflictError
} from "@transcendence/common";

const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

export const addMealPlanSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    mealType: z.enum(mealTypes),
    recipeId: z.string().uuid(),
    notes: z.string().max(500).optional()
});

export const updateMealPlanSchema = z.object({
    recipeId: z.string().uuid().optional(),
    notes: z.string().max(500).optional()
});

export async function addMealPlanHandler(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof addMealPlanSchema>;
    try {
        const mealPlan = await addMealPlan({
            userId: request.user!.id,
            date: new Date(body.date),
            mealType: body.mealType,
            recipeId: body.recipeId,
            notes: body.notes
        });
        sendCreated(reply, mealPlan, "Meal plan added");
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ConflictError("A meal is already planned for this slot");
        }
        throw error;
    }
}

export async function getMealPlansHandler(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mealPlans = await getMealPlansByDateRange(
            request.user!.id,
            monday,
            sunday
        );
        return sendSuccess(reply, mealPlans, "Meal plans retrieved");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const mealPlans = await getMealPlansByDateRange(request.user!.id, start, end);
    sendSuccess(reply, mealPlans, "Meal plans retrieved");
}

export async function getMealPlanByDateHandler(request: FastifyRequest, reply: FastifyReply) {
    const { date } = request.params as { date: string };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new NotFoundError("Invalid date format. Use YYYY-MM-DD");
    }

    const mealPlans = await getMealPlanByDate(request.user!.id, new Date(date));
    sendSuccess(reply, mealPlans, "Meal plans for date retrieved");
}

export async function updateMealPlanHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateMealPlanSchema>;

    const updated = await updateMealPlan(id, request.user!.id, body);
    if (!updated) {
        throw new ForbiddenError("Meal plan not found or you don't have permission");
    }

    sendSuccess(reply, updated, "Meal plan updated");
}

export async function deleteMealPlanHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const deleted = await deleteMealPlan(id, request.user!.id);
    if (!deleted) {
        throw new ForbiddenError("Meal plan not found or you don't have permission");
    }

    sendDeleted(reply, deleted, "Meal plan removed");
}
