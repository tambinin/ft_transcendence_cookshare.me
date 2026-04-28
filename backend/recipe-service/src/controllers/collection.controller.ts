import { FastifyRequest, FastifyReply } from "fastify";
import {
    createCollection,
    getUserCollections,
    getCollectionById,
    updateCollection,
    deleteCollection,
    addRecipeToCollection,
    removeRecipeFromCollection
} from "../services/collection.service";
import {
    sendSuccess,
    sendCreated,
    sendDeleted,
    NotFoundError,
    ForbiddenError,
    ConflictError
} from "@transcendence/common";
import { z } from "zod";

export const createCollectionSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional()
});

export const updateCollectionSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional()
});

export const addRecipeSchema = z.object({
    recipeId: z.string().uuid()
});

export async function createCollectionHandler(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof createCollectionSchema>;
    const collection = await createCollection({
        ...body,
        userId: request.user!.id
    });
    sendCreated(reply, collection, "Collection created successfully");
}

export async function getUserCollectionsHandler(request: FastifyRequest, reply: FastifyReply) {
    const collections = await getUserCollections(request.user!.id);
    sendSuccess(reply, collections, "Collections retrieved successfully");
}

export async function getCollectionByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const collection = await getCollectionById(id);

    if (!collection) {
        throw new NotFoundError("Collection not found");
    }

    if (collection.userId !== request.user!.id && !collection.isPublic) {
        throw new ForbiddenError("You do not have permission to view this collection");
    }

    sendSuccess(reply, collection, "Collection retrieved successfully");
}

export async function updateCollectionHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateCollectionSchema>;

    const existing = await getCollectionById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    if (existing.userId !== request.user!.id) throw new ForbiddenError("Not authorized");

    const updated = await updateCollection(id, body);
    sendSuccess(reply, updated, "Collection updated successfully");
}

export async function deleteCollectionHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const existing = await getCollectionById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    if (existing.userId !== request.user!.id) throw new ForbiddenError("Not authorized");

    await deleteCollection(id);
    sendDeleted(reply, null, "Collection deleted successfully");
}

export async function addRecipeToCollectionHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { recipeId } = request.body as { recipeId: string };

    const existing = await getCollectionById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    if (existing.userId !== request.user!.id) throw new ForbiddenError("Not authorized");

    try {
        const result = await addRecipeToCollection(id, recipeId);
        sendCreated(reply, result, "Recipe added to collection");
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ConflictError("Recipe already in collection");
        }
        throw error;
    }
}

export async function removeRecipeFromCollectionHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id, recipeId } = request.params as { id: string; recipeId: string };

    const existing = await getCollectionById(id);
    if (!existing) throw new NotFoundError("Collection not found");
    if (existing.userId !== request.user!.id) throw new ForbiddenError("Not authorized");

    await removeRecipeFromCollection(id, recipeId);
    sendDeleted(reply, null, "Recipe removed from collection");
}
