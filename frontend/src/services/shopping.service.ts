import api from './api.client';
import type { ApiResponse } from '../types/recipe.type';

export interface ShoppingListItem {
	id: string;
	name: string;
	quantity?: string;
	isChecked: boolean;
	recipeId?: string;
	recipeTitle?: string;
	createdAt: string;
}

const ENDPOINTS = {
	LIST: 'shopping-list',
	ITEMS: 'shopping-list/items',
	ITEM: (id: string) => `shopping-list/items/${id}`,
	FROM_RECIPE: (recipeId: string) => `recipes/${recipeId}/shopping-list`,
	CHECKED: 'shopping-list/checked',
};

const shoppingService = {
	async getList(): Promise<ShoppingListItem[]> {
		const res = await api.get<ApiResponse<ShoppingListItem[]>>(ENDPOINTS.LIST);
		const data = res.data.data;
		return Array.isArray(data) ? data : [];
	},

	async addItem(item: { name: string; quantity?: string }): Promise<ShoppingListItem> {
		const res = await api.post<ApiResponse<ShoppingListItem>>(ENDPOINTS.ITEMS, item);
		return res.data.data;
	},

	async updateItem(id: string, data: { name?: string; quantity?: string; isChecked?: boolean }): Promise<void> {
		await api.put(ENDPOINTS.ITEM(id), data);
	},

	async deleteItem(id: string): Promise<void> {
		await api.delete(ENDPOINTS.ITEM(id));
	},

	async addFromRecipe(recipeId: string): Promise<void> {
		await api.post(ENDPOINTS.FROM_RECIPE(recipeId));
	},

	async clearChecked(): Promise<void> {
		await api.delete(ENDPOINTS.CHECKED);
	},

	async clearAll(): Promise<void> {
		await api.delete(ENDPOINTS.LIST);
	},

	async getRecipeIds(): Promise<string[]> {
		const items = await this.getList();
		const ids = new Set<string>();
		for (const item of items) {
			if (item.recipeId) ids.add(item.recipeId);
		}
		return Array.from(ids);
	},

	async deleteByRecipeId(recipeId: string): Promise<void> {
		const items = await this.getList();
		const toDelete = items.filter(i => i.recipeId === recipeId);
		await Promise.all(toDelete.map(i => api.delete(ENDPOINTS.ITEM(i.id))));
	},
};

export default shoppingService;
