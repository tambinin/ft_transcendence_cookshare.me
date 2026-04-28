export const REPORT = {
	RECIPE: (recipeId: string) => `recipes/${recipeId}/report`,
	COMMENT: (commentId: string) => `comments/${commentId}/report`,
} as const;

export const REPORT_REASONS = [
	{ value: 'SPAM', label: 'Spam' },
	{ value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
	{ value: 'HARASSMENT', label: 'Harassment' },
	{ value: 'COPYRIGHT', label: 'Copyright violation' },
	{ value: 'MISLEADING', label: 'Misleading' },
	{ value: 'OTHER', label: 'Other' },
] as const;
