import type { RecipeComment } from '../../types/recipe.type';

export function insertReplyInTree(comments: RecipeComment[], parentId: string, reply: RecipeComment): RecipeComment[] {
	return comments.map(c => {
		if (c.id === parentId) return { ...c, replies: [...(c.replies || []), reply], replyCount: (c.replyCount ?? 0) + 1 };
		if (c.replies?.length) return { ...c, replies: insertReplyInTree(c.replies, parentId, reply) };
		return c;
	});
}

export function updateInTree(comments: RecipeComment[], updated: RecipeComment): RecipeComment[] {
	return comments.map(c => {
		if (c.id === updated.id) return { ...c, ...updated };
		if (c.replies?.length) return { ...c, replies: updateInTree(c.replies, updated) };
		return c;
	});
}

export function removeFromTree(comments: RecipeComment[], id: string): RecipeComment[] {
	return comments.filter(c => c.id !== id).map(c => c.replies?.length ? { ...c, replies: removeFromTree(c.replies, id) } : c);
}
