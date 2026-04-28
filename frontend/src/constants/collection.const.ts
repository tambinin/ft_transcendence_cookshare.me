export const COLLECTION = {
	BASE: 'collections',
	BY_ID: (id: string) => `collections/${id}`,
	RECIPES: (id: string) => `collections/${id}/recipes`,
	RECIPE: (id: string, recipeId: string) => `collections/${id}/recipes/${recipeId}`,
} as const;
