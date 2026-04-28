import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipe } from '../../hooks/useRecipes';
import { useAuth } from '../../contexts/auth.context';
import { useFavorite } from '../../contexts/favorite.context';
import recipeService from '../../services/recipe.service';
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
}	from '../../services/socket.service';
import { useShoppingList } from '../../hooks/useShoppingList';
import logger from '../../utils/logger';
import type { RecipeComment } from '../../types/recipe.type';
import { insertReplyInTree, updateInTree, removeFromTree } from './recipe.utils';
import type { ReportModalHandle } from '../../components/Modal/ReportModal';

export function useRecipePage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { isAuthenticated, user: currentUser } = useAuth();
	const { recipe, isLoading, error, refresh } = useRecipe({ id });
	const { isFavorite: isFav, toggleFavorite: ctxToggleFavorite } = useFavorite();

	const isFavorite = recipe ? isFav(recipe.id) : false;
	const [userRating, setUserRating] = useState(0);
	const [comment, setComment] = useState('');
	const [comments, setComments] = useState<RecipeComment[]>([]);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const { addFromRecipe } = useShoppingList();
	const [shoppingAdded, setShoppingAdded] = useState(false);
	const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
	const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const isTypingRef = useRef(false);
	const reportModalRef = useRef<ReportModalHandle>(null);

	const isOwnRecipe = isAuthenticated && currentUser?.id === recipe?.author?.id;

	const handleAddToShoppingList = async () => {
		if (shoppingAdded || !recipe) return;
		try {
			await addFromRecipe(recipe.id);
			setShoppingAdded(true);
			setTimeout(() => setShoppingAdded(false), 2000);
		} catch { /* silently fail */ }
	};


	useEffect(() => {
		if (!recipe?.id) return;
		recipeService.getComments(recipe.id)
			.then(res => setComments(Array.isArray(res) ? res : res.comments ?? []))
			.catch(err => logger.error('Error loading comments:', err));
		joinRecipeRoom(recipe.id);
		return () => { leaveRecipeRoom(recipe.id); };
	}, [recipe?.id]);

	useEffect(() => {
		if (!recipe?.id) return;
		const offNew = onNewComment((data) => {
			if (data.recipeId !== recipe.id) return;
			const c = data.comment as RecipeComment;
			if (c.author?.id === currentUser?.id) return;
			setComments(prev => {
				if ((c as unknown as Record<string, unknown>).parentId) {
					return insertReplyInTree(prev, (c as unknown as Record<string, unknown>).parentId as string, c);
				}
				return [c, ...prev];
			});
		});
		const offUpdated = onCommentUpdated((data) => {
			if (data.recipeId !== recipe.id) return;
			setComments(prev => updateInTree(prev, data.comment as RecipeComment));
		});
		const offDeleted = onCommentDeleted((data) => {
			if (data.recipeId !== recipe.id) return;
			setComments(prev => removeFromTree(prev, data.commentId));
		});
		const offTypingStart = onCommentTypingStart((data) => {
			if (data.recipeId !== recipe.id || data.senderId === currentUser?.id) return;
			setTypingUsers(prev => new Set(prev).add(data.senderId));
			const existing = typingTimeoutsRef.current.get(data.senderId);
			if (existing) clearTimeout(existing);
			typingTimeoutsRef.current.set(data.senderId, setTimeout(() => {
				setTypingUsers(prev => { const n = new Set(prev); n.delete(data.senderId); return n; });
				typingTimeoutsRef.current.delete(data.senderId);
			}, 5000));
		});
		const offTypingStop = onCommentTypingStop((data) => {
			if (data.recipeId !== recipe.id) return;
			setTypingUsers(prev => { const n = new Set(prev); n.delete(data.senderId); return n; });
			const existing = typingTimeoutsRef.current.get(data.senderId);
			if (existing) { clearTimeout(existing); typingTimeoutsRef.current.delete(data.senderId); }
		});

		const offRating = onRecipeRatingUpdate((data) => {
			if (data.recipeId !== recipe.id) return;
			// Update the react-query cache so RecipeHeader reflects the new values
			refresh();
		});

		return () => {
			offNew(); offUpdated(); offDeleted(); offTypingStart(); offTypingStop(); offRating();
			typingTimeoutsRef.current.forEach(t => clearTimeout(t));
			typingTimeoutsRef.current.clear();
		};
	}, [recipe?.id, currentUser?.id]);

	const handleToggleFavorite = async () => {
		if (!isAuthenticated || !recipe) return;
		await ctxToggleFavorite(recipe.id);
	};

	const handleRate = async (score: number) => {
		if (!isAuthenticated || !recipe || recipe.author?.id === currentUser?.id) return;
		try {
			await recipeService.addRating(recipe.id, { score });
			setUserRating(score);
		} catch (err) { logger.error('Rating error:', err); }
	};

	const handleComment = async () => {
		if (!comment.trim() || !recipe) return;
		try {
			const newComment = await recipeService.addComment(recipe.id, { content: comment });
			setComments(prev => [newComment, ...prev]);
			setComment('');
		} catch (err) { logger.error('Comment error:', err); }
	};

	const handleReply = useCallback(async (commentId: string, content: string) => {
		if (!recipe) return;
		const reply = await recipeService.replyToComment(recipe.id, commentId, { content });
		const hydrated: RecipeComment = {
			...reply,
			author: reply.author?.username ? reply.author : { id: currentUser?.id || '', username: currentUser?.username || 'You', avatarUrl: currentUser?.avatarUrl || '' },
		};
		setComments(prev => insertReplyInTree(prev, commentId, hydrated));
	}, [recipe, currentUser]);

	const handleCommentChange = (value: string) => {
		setComment(value);
		if (!isTypingRef.current && recipe) { isTypingRef.current = true; emitCommentTyping(recipe.id); }
	};

	const handleCommentBlur = () => {
		if (isTypingRef.current && recipe) { isTypingRef.current = false; emitCommentStopTyping(recipe.id); }
	};

	return {
		navigate, isAuthenticated, currentUser, recipe, isLoading, error, refresh,
		isFavorite, userRating, comment, comments, editModalOpen, setEditModalOpen,
		shoppingAdded, typingUsers, reportModalRef, isOwnRecipe,
		handleAddToShoppingList, handleToggleFavorite, handleRate,
		handleComment, handleReply, handleCommentChange, handleCommentBlur,
	};
}
