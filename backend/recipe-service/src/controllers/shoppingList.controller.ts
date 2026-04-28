import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
    addToShoppingList,
    addRecipeToShoppingList,
    getShoppingList,
    updateShoppingListItem,
    deleteShoppingListItem,
    clearCheckedItems,
    clearAllItems
} from "../services/shoppingList.service";
import {
    sendSuccess,
    sendCreated,
    sendDeleted
} from "@transcendence/common";

export const addItemSchema = z.object({
    name: z.string().min(1).max(100),
    quantity: z.string().max(50).optional()
});

export const updateItemSchema = z.object({
    name: z.string().max(100).optional(),
    quantity: z.string().max(50).optional(),
    isChecked: z.boolean().optional()
});

export async function addItemHandler(request: FastifyRequest, reply: FastifyReply) {
    const item = await addToShoppingList(request.user!.id, request.body as any);
    sendCreated(reply, item, "Item added to shopping list");
}

export async function addRecipeToShoppingListHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await addRecipeToShoppingList(request.user!.id, id);
    sendCreated(reply, null, "Recipe ingredients added to shopping list");
}

export async function getShoppingListHandler(request: FastifyRequest, reply: FastifyReply) {
    const items = await getShoppingList(request.user!.id);
    sendSuccess(reply, items, "Shopping list retrieved successfully");
}

export async function updateItemHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await updateShoppingListItem(id, request.user!.id, request.body as any);
    sendSuccess(reply, null, "Shopping list item updated");
}

export async function deleteItemHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await deleteShoppingListItem(id, request.user!.id);
    sendDeleted(reply, null, "Item removed from shopping list");
}

export async function clearCheckedItemsHandler(request: FastifyRequest, reply: FastifyReply) {
    await clearCheckedItems(request.user!.id);
    sendDeleted(reply, null, "Checked items cleared");
}

export async function clearAllItemsHandler(request: FastifyRequest, reply: FastifyReply) {
    await clearAllItems(request.user!.id);
    sendDeleted(reply, null, "Shopping list cleared");
}

export async function internalAddItemHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId, name, quantity } = request.body as any;
    const item = await addToShoppingList(userId, { name, quantity });
    sendCreated(reply, item, "Item added to shopping list");
}

export async function internalUpdateItemHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { userId, ...data } = request.body as any;
    const item = await updateShoppingListItem(id, userId, data);
    sendSuccess(reply, item, "Shopping list item updated");
}

export async function internalDeleteItemHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { userId } = request.body as any;
    await deleteShoppingListItem(id, userId);
    sendDeleted(reply, null, "Item removed from shopping list");
}
