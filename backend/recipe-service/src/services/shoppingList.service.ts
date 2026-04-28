import db from "../utils/db";
import { notifyShoppingListUpdate } from "../utils/notifyWebsocket";

export async function addToShoppingList(userId: string, data: { name: string; quantity?: string }) {
    const item = await db.shoppingListItem.create({
        data: {
            userId,
            name: data.name,
            quantity: data.quantity
        }
    });
    return item;
}

export async function addRecipeToShoppingList(userId: string, recipeId: string) {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        include: { ingredients: true }
    });

    if (!recipe) {
        throw new Error("Recipe not found");
    }

    const items = recipe.ingredients.map(ing => ({
        userId,
        name: ing.name,
        quantity: ing.quantityText,
        recipeId: recipe.id,
        recipeTitle: recipe.title
    }));

    const result = await db.shoppingListItem.createMany({
        data: items
    });
    notifyShoppingListUpdate(userId, 'RECIPE_ADDED', { recipeId, count: items.length });
    return result;
}

export async function getShoppingList(userId: string) {
    return db.shoppingListItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateShoppingListItem(id: string, userId: string, data: { isChecked?: boolean; name?: string; quantity?: string }) {
    // Ensure item exists and belongs to user
    const exists = await db.shoppingListItem.findFirst({ where: { id, userId } });
    if (!exists) throw new Error("Item not found or access denied");

    return db.shoppingListItem.update({
        where: { id },
        data
    });
}

export async function deleteShoppingListItem(id: string, userId: string) {
    const exists = await db.shoppingListItem.findFirst({ where: { id, userId } });
    if (!exists) throw new Error("Item not found or access denied");

    return db.shoppingListItem.delete({
        where: { id }
    });
}

export async function clearCheckedItems(userId: string) {
    const result = await db.shoppingListItem.deleteMany({
        where: { userId, isChecked: true }
    });
    notifyShoppingListUpdate(userId, 'CHECKED_ITEMS_CLEARED', {});
    return result;
}

export async function clearAllItems(userId: string) {
    const result = await db.shoppingListItem.deleteMany({
        where: { userId }
    });
    notifyShoppingListUpdate(userId, 'ALL_ITEMS_CLEARED', {});
    return result;
}
