import { useState, useEffect, useCallback } from 'react';
import collectionService from '../services/collection.service';
import type { Collection, CreateCollectionData, UpdateCollectionData } from '../types/collection.type';

export function useCollections() {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchCollections = useCallback(async () => {
		setLoading(true);
		try {
			const res = await collectionService.getCollections();
			setCollections(Array.isArray(res.data) ? res.data : []);
		} catch {
			setCollections([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchCollection = useCallback(async (id: string) => {
		try {
			const res = await collectionService.getCollectionById(id);
			setSelectedCollection(res.data);
		} catch {
			setSelectedCollection(null);
		}
	}, []);

	useEffect(() => {
		fetchCollections();
	}, [fetchCollections]);

	const createCollection = useCallback(async (data: CreateCollectionData) => {
		const res = await collectionService.createCollection(data);
		const newCollection = {
			...res.data,
			recipes: res.data.recipes ?? [],
			_count: res.data._count ?? { recipes: res.data.recipes?.length ?? 0 },
		};
		setCollections(prev => [newCollection, ...prev]);
		return newCollection;
	}, []);

	const updateCollection = useCallback(async (id: string, data: UpdateCollectionData) => {
		const res = await collectionService.updateCollection(id, data);
		setCollections(prev => prev.map(c => c.id === id ? {
			...c,
			...res.data,
			recipes: res.data.recipes ?? c.recipes,
			_count: res.data._count ?? c._count,
		} : c));
		if (selectedCollection?.id === id) {
			setSelectedCollection(prev => prev ? {
				...prev,
				...res.data,
				recipes: res.data.recipes ?? prev.recipes,
				_count: res.data._count ?? prev._count,
			} : null);
		}
		return res.data;
	}, [selectedCollection]);

	const deleteCollection = useCallback(async (id: string) => {
		await collectionService.deleteCollection(id);
		setCollections(prev => prev.filter(c => c.id !== id));
		if (selectedCollection?.id === id) setSelectedCollection(null);
	}, [selectedCollection]);

	const addRecipe = useCallback(async (collectionId: string, recipeId: string) => {
		await collectionService.addRecipe(collectionId, recipeId);
		if (selectedCollection?.id === collectionId) {
			await fetchCollection(collectionId);
		}
		await fetchCollections();
	}, [selectedCollection, fetchCollection, fetchCollections]);

	const removeRecipe = useCallback(async (collectionId: string, recipeId: string) => {
		await collectionService.removeRecipe(collectionId, recipeId);
		if (selectedCollection) {
			setSelectedCollection(prev => prev ? {
				...prev,
				recipes: prev.recipes.filter(r => r.recipeId !== recipeId),
				_count: { recipes: prev.recipes.filter(r => r.recipeId !== recipeId).length },
			} : null);
		}
		setCollections(prev => prev.map(c => {
			if (c.id !== collectionId) return c;
			const updatedRecipes = c.recipes.filter(r => r.recipeId !== recipeId);
			return {
				...c,
				recipes: updatedRecipes,
				_count: { recipes: updatedRecipes.length },
			};
		}));
	}, [selectedCollection]);

	return {
		collections,
		selectedCollection,
		loading,
		setSelectedCollection,
		fetchCollections,
		fetchCollection,
		createCollection,
		updateCollection,
		deleteCollection,
		addRecipe,
		removeRecipe,
	};
}
