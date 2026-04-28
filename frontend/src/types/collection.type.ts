import type { ApiResponse } from './api.type';

export interface CollectionRecipe {
	id: string;
	collectionId: string;
	recipeId: string;
	addedAt: string;
	recipe?: {
		id: string;
		title: string;
		slug: string;
		primaryImage?: { url: string } | null;
		images?: { url: string; altText?: string | null }[];
	};
}

export interface Collection {
	id: string;
	name: string;
	description?: string | null;
	userId: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
	recipes: CollectionRecipe[];
	_count?: { recipes: number };
}

export interface CreateCollectionData {
	name: string;
	description?: string;
	isPublic?: boolean;
}

export interface UpdateCollectionData {
	name?: string;
	description?: string;
	isPublic?: boolean;
}

export type CollectionResponse = ApiResponse<Collection>;
export type CollectionListResponse = ApiResponse<Collection[]>;
