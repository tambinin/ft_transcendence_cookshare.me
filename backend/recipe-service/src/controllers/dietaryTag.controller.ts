import { FastifyRequest, FastifyReply } from "fastify";
import { createDietaryTag, deleteDietaryTag, getAllDietaryTags, getDietaryTagById, updateDietaryTag } from "../services/dietaryTag.service";
import {
    sendCreated,
    sendSuccess,
    sendDeleted,
    NotFoundError,
    ConflictError
} from "@transcendence/common";
import { z } from "zod";

export const createDietaryTagSchema = z.object({
    name: z.string().min(1).max(50),
    iconName: z.string().optional()
});

export const updateDietaryTagSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    iconName: z.string().optional()
});

export async function createDietaryTagHandler(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof createDietaryTagSchema>;
    try {
        const tag = await createDietaryTag(body);
        return sendCreated(reply, tag, "Dietary tag created successfully");
    } catch (error) {
        if ((error as any).code === "P2002") {
            throw new ConflictError("Dietary tag name already exists");
        }
        throw error;
    }
}

export async function getAllDietaryTagsHandler(request: FastifyRequest, reply: FastifyReply) {
    const tags = await getAllDietaryTags();
    return sendSuccess(reply, tags, "Dietary tags retrieved successfully");
}

export async function getDietaryTagByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const tag = await getDietaryTagById(id);
    if (!tag) {
        throw new NotFoundError("Dietary tag not found");
    }
    return sendSuccess(reply, tag, "Dietary tag retrieved successfully");
}

export async function updateDietaryTagHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateDietaryTagSchema>;
    try {
        const tag = await updateDietaryTag(id, body);
        return sendSuccess(reply, tag, "Dietary tag updated successfully");
    } catch (error) {
        if ((error as any).code === "P2025") {
            throw new NotFoundError("Dietary tag not found");
        }
        if ((error as any).code === "P2002") {
            throw new ConflictError("Dietary tag name already exists");
        }
        throw error;
    }
}

export async function deleteDietaryTagHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
        const tag = await deleteDietaryTag(id);
        if (!tag) {
            throw new NotFoundError("Dietary tag not found");
        }
        return sendDeleted(reply, tag, "Dietary tag deleted successfully");
    } catch (error) {
        if ((error as any).code === "P2025") {
            throw new NotFoundError("Dietary tag not found");
        }
        throw error;
    }
}
