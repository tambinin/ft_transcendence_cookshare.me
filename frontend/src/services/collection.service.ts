import api from './api.client';
import { COLLECTION } from '../constants/collection.const';
import type { CollectionResponse, CollectionListResponse, CreateCollectionData, UpdateCollectionData } from '../types/collection.type';

const collectionService = {
	async getCollections(): Promise<CollectionListResponse> {
		const response = await api.get<CollectionListResponse>(COLLECTION.BASE);
		return response.data;
	},

	async getCollectionById(id: string): Promise<CollectionResponse> {
		const response = await api.get<CollectionResponse>(COLLECTION.BY_ID(id));
		return response.data;
	},

	async createCollection(data: CreateCollectionData): Promise<CollectionResponse> {
		const response = await api.post<CollectionResponse>(COLLECTION.BASE, data);
		return response.data;
	},

	async updateCollection(id: string, data: UpdateCollectionData): Promise<CollectionResponse> {
		const response = await api.put<CollectionResponse>(COLLECTION.BY_ID(id), data);
		return response.data;
	},

	async deleteCollection(id: string): Promise<void> {
		await api.delete(COLLECTION.BY_ID(id));
	},

	async addRecipe(collectionId: string, recipeId: string): Promise<void> {
		await api.post(COLLECTION.RECIPES(collectionId), { recipeId });
	},

	async removeRecipe(collectionId: string, recipeId: string): Promise<void> {
		await api.delete(COLLECTION.RECIPE(collectionId, recipeId));
	},
};

export default collectionService;
