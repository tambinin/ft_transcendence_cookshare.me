import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import shoppingService, { type ShoppingListItem } from '../services/shopping.service';
import { onShoppingListUpdate } from '../services/socket.service';
import { getAccessToken } from '../services/auth.service';

export function useShoppingList() {
	const [items, setItems] = useState<ShoppingListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const hasFetched = useRef(false);

	const fetchList = useCallback(async () => {
		if (!getAccessToken()) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const data = await shoppingService.getList();
			setItems(data);
			hasFetched.current = true;
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchList();
	}, [fetchList]);

	// Retry when token becomes available (auth may resolve after mount)
	useEffect(() => {
		if (hasFetched.current) return;
		const interval = setInterval(() => {
			if (getAccessToken()) {
				clearInterval(interval);
				fetchList();
			}
		}, 300);
		return () => clearInterval(interval);
	}, [fetchList]);

	useEffect(() => {
		const off = onShoppingListUpdate(() => {
			fetchList();
		});
		return off;
	}, [fetchList]);

	// Set of recipe IDs that are already in the shopping list
	const recipeIdsInList = useMemo(() => {
		const ids = new Set<string>();
		for (const item of items) {
			if (item.recipeId) ids.add(item.recipeId);
		}
		return ids;
	}, [items]);

	const addItem = useCallback(async (name: string, quantity?: string) => {
		try {
			const item = await shoppingService.addItem({ name, quantity });
			setItems(prev => [item, ...prev]);
		} catch {
			// silently fail
		}
	}, []);

	const toggleItem = useCallback(async (id: string) => {
		setItems(prev => prev.map(i => i.id === id ? { ...i, isChecked: !i.isChecked } : i));
		try {
			const item = items.find(i => i.id === id);
			if (item) await shoppingService.updateItem(id, { isChecked: !item.isChecked });
		} catch {
			setItems(prev => prev.map(i => i.id === id ? { ...i, isChecked: !i.isChecked } : i));
		}
	}, [items]);

	const deleteItem = useCallback(async (id: string) => {
		const prev = items;
		setItems(p => p.filter(i => i.id !== id));
		try {
			await shoppingService.deleteItem(id);
		} catch {
			setItems(prev);
		}
	}, [items]);

	const addFromRecipe = useCallback(async (recipeId: string) => {
		await shoppingService.addFromRecipe(recipeId);
		await fetchList();
	}, [fetchList]);

	const removeRecipeItems = useCallback(async (recipeId: string) => {
		const toRemove = items.filter(i => i.recipeId === recipeId).map(i => i.id);
		setItems(prev => prev.filter(i => i.recipeId !== recipeId));
		try {
			await Promise.all(toRemove.map(id => shoppingService.deleteItem(id)));
		} catch {
			fetchList();
		}
	}, [items, fetchList]);

	const clearChecked = useCallback(async () => {
		setItems(prev => prev.filter(i => !i.isChecked));
		try {
			await shoppingService.clearChecked();
		} catch {
			fetchList();
		}
	}, [fetchList]);

	const clearAll = useCallback(async () => {
		setItems([]);
		try {
			await shoppingService.clearAll();
		} catch {
			fetchList();
		}
	}, [fetchList]);

	return { items, loading, addItem, toggleItem, deleteItem, addFromRecipe, removeRecipeItems, recipeIdsInList, clearChecked, clearAll, refresh: fetchList };
}
