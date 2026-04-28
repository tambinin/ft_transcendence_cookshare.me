import { FastifyRequest, FastifyReply } from "fastify";
import { createCategory, deleteCategory, getAllCategories, getCategoryById, getCategoryBySlug, updateCategory } from "../services/category.service";
import {
    sendCreated,
    sendSuccess,
    sendDeleted,
    NotFoundError,
    ConflictError
} from "@transcendence/common";
import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().min(1).max(100),
    iconName: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    sortOrder: z.number().int().min(0).optional()
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    iconName: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    sortOrder: z.number().int().min(0).optional()
});

export async function createCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof createCategorySchema>;
    try {
        const category = await createCategory(body);
        return sendCreated(reply, category, "Category created successfully");
    } catch (error) {
        if ((error as any).code === "P2002") {
            throw new ConflictError("Category name already exists");
        }
        throw error;
    }
}

export async function getAllCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
    const categories = await getAllCategories();
    return sendSuccess(reply, categories, "Categories retrieved successfully");
}

export async function getCategoryByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const category = await getCategoryById(id);
    if (!category) {
        throw new NotFoundError("Category not found");
    }
    return sendSuccess(reply, category, "Category retrieved successfully");
}

export async function getCategoryBySlugHandler(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const category = await getCategoryBySlug(slug);
    if (!category) {
        throw new NotFoundError("Category not found");
    }
    return sendSuccess(reply, category, "Category retrieved successfully");
}

export async function updateCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateCategorySchema>;
    try {
        const category = await updateCategory(id, body);
        if (!category) {
            throw new NotFoundError("Category not found");
        }
        return sendSuccess(reply, category, "Category updated successfully");
    } catch (error) {
        if ((error as any).code === "P2025") {
            throw new NotFoundError("Category not found");
        }
        throw error;
    }
}

export async function deleteCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
        const category = await deleteCategory(id);
        if (!category) {
            throw new NotFoundError("Category not found");
        }
        return sendDeleted(reply, category, "Category deleted successfully");
    } catch (error) {
        if ((error as any).code === "P2025") {
            throw new NotFoundError("Category not found");
        }
        throw error;
    }
}
