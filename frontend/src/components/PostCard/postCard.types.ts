import type { RecipeComment } from '../../types/recipe.type';
import type { User } from '../../types/user.type';

export interface PostCardAuthorProps {
	authorId: string;
	username: string;
	avatarUrl?: string;
	authorOnline: boolean;
	createdAt: string;
	isOwnRecipe: boolean;
	isAuthenticated: boolean;
	isFollowing: boolean;
	toggleFollow: () => void;
	onMessage: () => void;
}

export interface PostCardImageProps {
	imageUrl: string;
	title: string;
	averageScore: number;
	ratingCount: number;
	commentCount: number;
	difficulty: string;
	level: number;
	onClick: () => void;
}

export interface PostCardMetaProps {
	title: string;
	time: string;
	difficulty: string;
	dietaryTags: { id: string; name: string }[];
	category?: { id: string; name: string } | null;
	description: string;
	maxTags?: number;
}

export interface PostCardActionsProps {
	isOwnRecipe: boolean;
	isAuthenticated: boolean;
	isFavorite: boolean;
	toggleFavorite: () => void;
	averageScore: number;
	displayScore: number;
	hoverRating: number;
	setHoverRating: (n: number) => void;
	rateRecipe: (score: number) => void;
	onOpenModal: () => void;
	onSaveToCollection: () => void;
	onAddToShoppingList: () => void;
	addedToShoppingList: boolean;
	addingToShoppingList: boolean;
	isInShoppingList: boolean;
	onReport: () => void;
}

export interface PostCardCommentsProps {
	comments: RecipeComment[];
	isLoadingComments: boolean;
	commentText: string;
	setCommentText: React.Dispatch<React.SetStateAction<string>>;
	handleSubmitComment: () => void | Promise<void>;
	handleCommentInputChange: () => void;
	handleCommentInputBlur: () => void;
	loadComments: () => void | Promise<void>;
	replyToComment: (parentId: string, content: string) => Promise<void>;
	editComment: (commentId: string, content: string) => Promise<void>;
	deleteComment: (commentId: string) => Promise<void>;
	hasMoreComments: boolean;
	isLoadingMoreComments: boolean;
	loadMoreComments: () => void | Promise<void>;
	typingUsers: Set<string>;
	isAuthenticated: boolean;
	currentUser?: User | null;
	commentCount: number;
	onReportComment: (commentId: string) => void;
	variant: 'desktop' | 'collapsible';
	showComments?: boolean;
	handleToggleComments?: () => void;
}
