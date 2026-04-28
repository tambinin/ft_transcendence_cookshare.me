import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import recipeService from '../services/recipe.service';
import { useAuth } from './auth.context';

interface FavoriteContextType {
	favoriteIds: Set<string>;
	isFavorite: (recipeId: string) => boolean;
	toggleFavorite: (recipeId: string) => Promise<void>;
	refreshFavorites: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType | null>(null);

export function FavoriteProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);

	const refreshFavorites = useCallback(async () => {
		if (loading) return;
		setLoading(true);
		try {
			const data = await recipeService.getMyFavorites();
			const ids = new Set((Array.isArray(data) ? data : []).map(r => r.id));
			setFavoriteIds(ids);
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, [loading]);

	// Load favorites on auth
	useEffect(() => {
		if (isAuthenticated) {
			refreshFavorites();
		} else {
			setFavoriteIds(new Set());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]);

	const isFav = useCallback((recipeId: string) => {
		return favoriteIds.has(recipeId);
	}, [favoriteIds]);

	const toggleFavorite = useCallback(async (recipeId: string) => {
		const wasFavorite = favoriteIds.has(recipeId);
		// Optimistic update
		setFavoriteIds(prev => {
			const next = new Set(prev);
			if (wasFavorite) {
				next.delete(recipeId);
			} else {
				next.add(recipeId);
			}
			return next;
		});
		try {
			if (wasFavorite) {
				await recipeService.removeFromFavorites(recipeId);
			} else {
				await recipeService.addToFavorites(recipeId);
			}
		} catch {
			// Rollback on error
			setFavoriteIds(prev => {
				const next = new Set(prev);
				if (wasFavorite) {
					next.add(recipeId);
				} else {
					next.delete(recipeId);
				}
				return next;
			});
		}
	}, [favoriteIds]);

	return (
		<FavoriteContext.Provider value={{ favoriteIds, isFavorite: isFav, toggleFavorite, refreshFavorites }}>
			{children}
		</FavoriteContext.Provider>
	);
}

export function useFavorite() {
	const context = useContext(FavoriteContext);
	if (!context) {
		throw new Error('useFavorite must be used within a FavoriteProvider');
	}
	return context;
}

export default FavoriteContext;

