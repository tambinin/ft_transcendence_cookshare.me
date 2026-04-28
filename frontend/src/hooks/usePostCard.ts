import { useState, useCallback, useRef, useEffect } from 'react';
import recipeService from '../services/recipe.service';
import socialService from '../services/social.service';
import { useAuth } from '../contexts/auth.context';
import { useFollow } from '../contexts/follow.context';
import { useFavorite } from '../contexts/favorite.context';
import {
	joinRecipeRoom,
	leaveRecipeRoom,
	onNewComment,
	onCommentUpdated,
	onCommentDeleted,
	onCommentTypingStart,
	onCommentTypingStop,
	onRecipeRatingUpdate,
	emitCommentTyping,
	emitCommentStopTyping
}	from '../services/socket.service';
import type { RecipeSummary, RecipeResponse, RecipeComment } from '../types/recipe.type';

function insertReply(comments: RecipeComment[], parentId: string, reply: RecipeComment): RecipeComment[] {
	return comments.map(c => {
		if (c.id === parentId) {
			return { ...c, replies: [...(c.replies || []), reply], replyCount: (c.replyCount ?? 0) + 1 };
		}
		if (c.replies?.length) {
			return { ...c, replies: insertReply(c.replies, parentId, reply) };
		}
		return c;
	});
}

function updateCommentInTree(comments: RecipeComment[], updated: RecipeComment): RecipeComment[] {
	return comments.map(c => {
		if (c.id === updated.id) return { ...c, ...updated };
		if (c.replies?.length) return { ...c, replies: updateCommentInTree(c.replies, updated) };
		return c;
	});
}

function removeCommentFromTree(comments: RecipeComment[], commentId: string): RecipeComment[] {
	return comments
		.filter(c => c.id !== commentId)
		.map(c => c.replies?.length ? { ...c, replies: removeCommentFromTree(c.replies, commentId) } : c);
}

export function usePostCard(recipe: RecipeSummary) {
	const { user, isAuthenticated } = useAuth();
	const { getFollowState, setFollowState } = useFollow();
	const { isFavorite: isFav, toggleFavorite: ctxToggleFavorite } = useFavorite();
	const isFavorite = isFav(recipe.id);

	const toggleFavorite = useCallback(async () => {
		if (!isAuthenticated) return;
		await ctxToggleFavorite(recipe.id);
	}, [recipe.id, isAuthenticated, ctxToggleFavorite]);

	const [averageScore, setAverageScore] = useState(recipe.averageScore);
	const [ratingCount, setRatingCount] = useState(recipe.ratingCount ?? 0);
	const [userRating, setUserRating] = useState<number>(0);
	const [hoverRating, setHoverRating] = useState(0);

	const isOwnRecipe = user?.id === recipe.author.id;

	const rateRecipe = useCallback(async (score: number) => {
		if (!isAuthenticated || isOwnRecipe) return;
		const prev = userRating;
		setUserRating(score);
		try {
			if (prev > 0) {
				await recipeService.updateRating(recipe.id, { score });
			} else {
				await recipeService.addRating(recipe.id, { score });
			}
			// Refresh average score after successful rating
			const updated = await recipeService.getRecipeById(recipe.id);
			setAverageScore(updated.averageScore);
			setRatingCount(updated.ratingCount ?? ratingCount);
		} catch {
			setUserRating(prev);
		}
	}, [recipe.id, userRating, isAuthenticated, isOwnRecipe]);

	const [comments, setComments] = useState<RecipeComment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);
	const [commentPage, setCommentPage] = useState(1);
	const [hasMoreComments, setHasMoreComments] = useState(false);
	const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
	const commentsLoaded = useRef(false);
	const commentsOpen = useRef(false);

	const loadComments = useCallback(async () => {
		if (commentsLoaded.current || isLoadingComments) return;
		setIsLoadingComments(true);
		try {
			const { comments: data, pagination } = await recipeService.getComments(recipe.id, 1, 10);
			setComments(Array.isArray(data) ? data : []);
			setCommentPage(1);
			setHasMoreComments(pagination.page < pagination.totalPages);
			commentsLoaded.current = true;
		} catch {
			// silently fail
		} finally {
			setIsLoadingComments(false);
		}
	}, [recipe.id, isLoadingComments]);

	const loadMoreComments = useCallback(async () => {
		if (isLoadingMoreComments || !hasMoreComments) return;
		setIsLoadingMoreComments(true);
		try {
			const nextPage = commentPage + 1;
			const { comments: data, pagination } = await recipeService.getComments(recipe.id, nextPage, 10);
			setComments(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
			setCommentPage(nextPage);
			setHasMoreComments(pagination.page < pagination.totalPages);
		} catch {
			// silently fail
		} finally {
			setIsLoadingMoreComments(false);
		}
	}, [recipe.id, commentPage, hasMoreComments, isLoadingMoreComments]);

	const editComment = useCallback(async (commentId: string, content: string) => {
		if (!isAuthenticated || !content.trim()) return;
		try {
			const updated = await recipeService.updateComment(recipe.id, commentId, { content });
			if (updated) {
				setComments(prev => updateCommentInTree(prev, { ...updated, author: updated.author?.username ? updated.author : { id: user?.id || '', username: user?.username || '', avatarUrl: user?.avatarUrl || '' } }));
			}
		} catch {
			// silently fail
		}
	}, [recipe.id, isAuthenticated, user]);

	const deleteComment = useCallback(async (commentId: string) => {
		if (!isAuthenticated) return;
		try {
			await recipeService.deleteComment(recipe.id, commentId);
			setComments(prev => removeCommentFromTree(prev, commentId));
		} catch {
			// silently fail
		}
	}, [recipe.id, isAuthenticated]);

	const addComment = useCallback(async (content: string) => {
		if (!isAuthenticated || !content.trim()) return;
		try {
			const newComment = await recipeService.addComment(recipe.id, { content });
			if (newComment) {
				const hydratedComment: RecipeComment = {
					...newComment,
					author: newComment.author?.username
						? newComment.author
						: {
							id: user?.id || '',
							username: user?.username || 'You',
							avatarUrl: user?.avatarUrl || '',
						},
				};
				setComments(prev => [hydratedComment, ...(Array.isArray(prev) ? prev : [])]);
			}
		} catch {
			// silently fail
		}
	}, [recipe.id, isAuthenticated, user]);

	const replyToComment = useCallback(async (commentId: string, content: string) => {
		if (!isAuthenticated || !content.trim()) return;
		try {
			const reply = await recipeService.replyToComment(recipe.id, commentId, { content });
			if (reply) {
				const hydratedReply: RecipeComment = {
					...reply,
					author: reply.author?.username
						? reply.author
						: { id: user?.id || '', username: user?.username || 'You', avatarUrl: user?.avatarUrl || '' },
				};
				setComments(prev => insertReply(prev, commentId, hydratedReply));
			}
		} catch {
			// silently fail
		}
	}, [recipe.id, isAuthenticated, user]);
	const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
	const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const isTyping = useRef(false);
	const handleCommentInputChange = useCallback(() => {
		if (!isTyping.current) {
			isTyping.current = true;
			emitCommentTyping(recipe.id);
		}
	}, [recipe.id]);

	const handleCommentInputBlur = useCallback(() => {
		if (isTyping.current) {
			isTyping.current = false;
			emitCommentStopTyping(recipe.id);
		}
	}, [recipe.id]);

	const openComments = useCallback(() => {
		if (!commentsOpen.current) {
			commentsOpen.current = true;
			joinRecipeRoom(recipe.id);
		}
	}, [recipe.id]);

	const closeComments = useCallback(() => {
		if (commentsOpen.current) {
			commentsOpen.current = false;
			leaveRecipeRoom(recipe.id);
		}
	}, [recipe.id]);

	useEffect(() => {
		const offNew = onNewComment((data) => {
			if (data.recipeId !== recipe.id) return;
			const c = data.comment as RecipeComment;
			if (c.author?.id === user?.id) return;
			setComments(prev => {
				if ((c as any).parentId) {
					return insertReply(prev, (c as any).parentId, c);
				}
				return [c, ...prev];
			});
		});

		const offUpdated = onCommentUpdated((data) => {
			if (data.recipeId !== recipe.id) return;
			setComments(prev => updateCommentInTree(prev, data.comment as RecipeComment));
		});

		const offDeleted = onCommentDeleted((data) => {
			if (data.recipeId !== recipe.id) return;
			setComments(prev => removeCommentFromTree(prev, data.commentId));
		});

		const offTypingStart = onCommentTypingStart((data) => {
			if (data.recipeId !== recipe.id || data.senderId === user?.id) return;
			setTypingUsers(prev => new Set(prev).add(data.senderId));
			const existing = typingTimeouts.current.get(data.senderId);
			if (existing) clearTimeout(existing);
			typingTimeouts.current.set(data.senderId, setTimeout(() => {
				setTypingUsers(prev => { const n = new Set(prev); n.delete(data.senderId); return n; });
				typingTimeouts.current.delete(data.senderId);
			}, 5000));
		});

		const offTypingStop = onCommentTypingStop((data) => {
			if (data.recipeId !== recipe.id) return;
			setTypingUsers(prev => { const n = new Set(prev); n.delete(data.senderId); return n; });
			const existing = typingTimeouts.current.get(data.senderId);
			if (existing) { clearTimeout(existing); typingTimeouts.current.delete(data.senderId); }
		});

		const offRating = onRecipeRatingUpdate((data) => {
			if (data.recipeId !== recipe.id) return;
			setAverageScore(data.averageScore);
			setRatingCount(data.ratingCount);
		});

		return () => {
			offNew();
			offUpdated();
			offDeleted();
			offTypingStart();
			offTypingStop();
			offRating();
			typingTimeouts.current.forEach(t => clearTimeout(t));
			typingTimeouts.current.clear();
			closeComments();
		};
	}, [recipe.id, user?.id, closeComments]);

	const [isFollowing, setIsFollowing] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const followChecked = useRef(false);

	// Sync local state with global follow context
	const contextFollowState = getFollowState(recipe.author.id);
	useEffect(() => {
		if (contextFollowState !== undefined) {
			setIsFollowing(contextFollowState);
		}
	}, [contextFollowState]);

	const checkFollowing = useCallback(async () => {
		if (!isAuthenticated || followChecked.current || recipe.author.id === user?.id) return;
		try {
			const res = await socialService.isFollowing(recipe.author.id);
			const value = res.data?.isFollowing ?? false;
			setIsFollowing(value);
			setFollowState(recipe.author.id, value);
			followChecked.current = true;
		} catch {
			// silently fail
		}
	}, [recipe.author.id, isAuthenticated, user?.id, setFollowState]);

	const toggleFollow = useCallback(async () => {
		if (!isAuthenticated || followLoading) return;
		const prev = isFollowing;
		const next = !prev;
		setIsFollowing(next);
		setFollowState(recipe.author.id, next);
		setFollowLoading(true);
		try {
			if (prev) {
				await socialService.unfollowUser(recipe.author.id);
			} else {
				await socialService.followUser(recipe.author.id);
			}
		} catch {
			setIsFollowing(prev);
			setFollowState(recipe.author.id, prev);
			socialService.invalidateFollowCache(recipe.author.id);
		} finally {
			setFollowLoading(false);
		}
	}, [recipe.author.id, isFollowing, isAuthenticated, followLoading, setFollowState]);

	const [recipeDetail, setRecipeDetail] = useState<RecipeResponse | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	const loadDetail = useCallback(async () => {
		if (recipeDetail || isLoadingDetail) return;
		setIsLoadingDetail(true);
		try {
			const data = await recipeService.getRecipeById(recipe.id);
			setRecipeDetail(data);
			setUserRating(data.userRating ?? 0);
		} catch {
			// silently fail
		} finally {
			setIsLoadingDetail(false);
		}
	}, [recipe.id, recipeDetail, isLoadingDetail]);

	return {
		isFavorite, toggleFavorite,
		averageScore, ratingCount, userRating, hoverRating, setHoverRating, rateRecipe,
		comments, isLoadingComments, loadComments, addComment, replyToComment,
		editComment, deleteComment,
		hasMoreComments, isLoadingMoreComments, loadMoreComments,
		openComments, closeComments,
		typingUsers, handleCommentInputChange, handleCommentInputBlur,
		isFollowing, toggleFollow, checkFollowing,
		recipeDetail, isLoadingDetail, loadDetail,
		isAuthenticated, currentUser: user, isOwnRecipe,
	};
}
