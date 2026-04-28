import { createContext, useContext, type ReactNode } from 'react';
import { useShoppingList } from '../hooks/useShoppingList';
import type { ShoppingListItem } from '../services/shopping.service';

interface ShoppingListContextValue {
	items: ShoppingListItem[];
	loading: boolean;
	addItem: (name: string, quantity?: string) => Promise<void>;
	toggleItem: (id: string) => Promise<void>;
	deleteItem: (id: string) => Promise<void>;
	addFromRecipe: (recipeId: string) => Promise<void>;
	removeRecipeItems: (recipeId: string) => Promise<void>;
	recipeIdsInList: Set<string>;
	clearChecked: () => Promise<void>;
	clearAll: () => Promise<void>;
	refresh: () => Promise<void>;
}

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
	const value = useShoppingList();
	return (
		<ShoppingListContext.Provider value={value}>
			{children}
		</ShoppingListContext.Provider>
	);
}

export function useShoppingListContext() {
	const ctx = useContext(ShoppingListContext);
	if (!ctx) {
		// Return a safe fallback — component is outside provider
		return {
			items: [] as ShoppingListItem[],
			loading: false,
			addItem: async () => {},
			toggleItem: async () => {},
			deleteItem: async () => {},
			addFromRecipe: async () => {},
			removeRecipeItems: async () => {},
			recipeIdsInList: new Set<string>(),
			clearChecked: async () => {},
			clearAll: async () => {},
			refresh: async () => {},
		};
	}
	return ctx;
}
