import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostCard } from '../../hooks/usePostCard';
import { useFeedRefresh } from '../../contexts/feed.context';
import { useShoppingListContext } from '../../contexts/shoppingList.context';
import shoppingService from '../../services/shopping.service';
import RecipeModal from '../Modal/RecipeModal';
import ReportModal from '../Modal/ReportModal';
import type { ReportModalHandle } from '../Modal/ReportModal';
import SaveToCollectionModal from '../Modal/SaveToCollectionModal';
import type { SaveToCollectionModalHandle } from '../Modal/SaveToCollectionModal';
import type { RecipeSummary } from '../../types/recipe.type';

import { formatTime, formatDifficulty, difficultyLevel } from './postCard.utils';
import PostCardDesktop from './PostCardDesktop';
import PostCardTablet from './PostCardTablet';
import PostCardMobile from './PostCardMobile';

interface PostCardProps {
	recipe: RecipeSummary;
	onRemove?: (recipeId: string) => void;
}

const PostCard = ({ recipe }: PostCardProps) => {
	const navigate = useNavigate();
	const {
		isFavorite, toggleFavorite,
		averageScore, ratingCount, userRating, hoverRating, setHoverRating, rateRecipe,
		comments, isLoadingComments, loadComments, addComment, replyToComment,
		editComment, deleteComment,
		hasMoreComments, isLoadingMoreComments, loadMoreComments,
		openComments, closeComments,
		typingUsers, handleCommentInputChange, handleCommentInputBlur,
		isFollowing, toggleFollow, checkFollowing,
		recipeDetail, isLoadingDetail, loadDetail,
		isAuthenticated, currentUser,
	} = usePostCard(recipe);
	const { isUserOnline, seedOnlineStatus } = useFeedRefresh();
	const { recipeIdsInList, refresh: refreshShoppingList } = useShoppingListContext();

	const [modalOpen, setModalOpen] = useState(false);
	const [commentText, setCommentText] = useState('');
	const [showComments, setShowComments] = useState(false);
	const [addingToShoppingList, setAddingToShoppingList] = useState(false);
	const [addedToShoppingList, setAddedToShoppingList] = useState(false);
	const reportModalRef = useRef<ReportModalHandle>(null);
	const collectionModalRef = useRef<SaveToCollectionModalHandle>(null);

	const isOwnRecipe = currentUser?.id === recipe.author.id;
	const authorOnline = isUserOnline?.(recipe.author.id) ?? false;
	const isInShoppingList = recipeIdsInList.has(recipe.id);

	// Seed initial online status from API-hydrated author data
	useEffect(() => {
		if (recipe.author.isOnline !== undefined) {
			seedOnlineStatus(recipe.author.id, recipe.author.isOnline);
		}
	}, [recipe.author.id, recipe.author.isOnline, seedOnlineStatus]);

	useEffect(() => {
		checkFollowing();
		if (window.innerWidth >= 1024) loadComments();
	}, [checkFollowing, loadComments]);

	const handleOpenModal = useCallback(() => { loadDetail(); setModalOpen(true); }, [loadDetail]);

	const handleAddToShoppingList = useCallback(async () => {
		if (addingToShoppingList || isInShoppingList) return;
		setAddingToShoppingList(true);
		try {
			await shoppingService.addFromRecipe(recipe.id);
			setAddedToShoppingList(true);
			refreshShoppingList();
			setTimeout(() => setAddedToShoppingList(false), 3000);
		} catch {
			/* silent */
		} finally {
			setAddingToShoppingList(false);
		}
	}, [recipe.id, addingToShoppingList, isInShoppingList, refreshShoppingList]);

	const handleSubmitComment = async () => {
		if (!commentText.trim()) return;
		await addComment(commentText);
		setCommentText('');
	};

	const handleToggleComments = () => {
		if (!showComments) {
			if (comments.length === 0) loadComments();
			openComments();
		} else {
			closeComments();
		}
		setShowComments(!showComments);
	};

	const imageUrl = recipe.primaryImage?.url || recipe.images?.[0]?.url || '/images/recipes/Custard.png';
	const time = formatTime(recipe.prepTime, recipe.cookTime);
	const difficulty = formatDifficulty(recipe.difficulty);
	const level = difficultyLevel(recipe.difficulty);
	const displayScore = hoverRating || userRating || averageScore;

	// Use the live comments count when available (loaded via WebSocket/API),
	// otherwise fall back to the initial count from the recipe summary.
	const liveCommentCount = comments.length > 0 ? comments.length : (recipe.commentCount ?? 0);

	const authorProps = useMemo(() => ({
		authorId: recipe.author.id,
		username: recipe.author.username,
		avatarUrl: recipe.author.avatarUrl,
		authorOnline,
		createdAt: recipe.createdAt,
		isOwnRecipe,
		isAuthenticated,
		isFollowing,
		toggleFollow,
		onMessage: () => navigate(`/messenger/${recipe.author.id}`),
	}), [recipe.author.id, recipe.author.username, recipe.author.avatarUrl, authorOnline, recipe.createdAt, isOwnRecipe, isAuthenticated, isFollowing, toggleFollow, navigate]);

	const imageProps = useMemo(() => ({
		imageUrl,
		title: recipe.title,
		averageScore,
		ratingCount,
		commentCount: liveCommentCount,
		difficulty,
		level,
		onClick: handleOpenModal,
	}), [imageUrl, recipe.title, averageScore, ratingCount, liveCommentCount, difficulty, level, handleOpenModal]);

	const metaProps = useMemo(() => ({
		title: recipe.title,
		time,
		difficulty,
		dietaryTags: recipe.dietaryTags ?? [],
		category: recipe.category,
		description: recipe.description,
	}), [recipe.title, time, difficulty, recipe.dietaryTags, recipe.category, recipe.description]);

	const actionsProps = useMemo(() => ({
		isOwnRecipe,
		isAuthenticated,
		isFavorite,
		toggleFavorite,
		averageScore,
		displayScore,
		hoverRating,
		setHoverRating,
		rateRecipe,
		onOpenModal: handleOpenModal,
		onSaveToCollection: () => collectionModalRef.current?.open(recipe.id),
		onAddToShoppingList: handleAddToShoppingList,
		addedToShoppingList,
		addingToShoppingList,
		isInShoppingList,
		onReport: () => reportModalRef.current?.open('RECIPE', recipe.id),
	}), [isOwnRecipe, isAuthenticated, isFavorite, toggleFavorite, averageScore, displayScore, hoverRating, setHoverRating, rateRecipe, handleOpenModal, recipe.id, handleAddToShoppingList, addedToShoppingList, addingToShoppingList, isInShoppingList]);

	const baseCommentsProps = useMemo(() => ({
		comments,
		isLoadingComments,
		commentText,
		setCommentText,
		handleSubmitComment,
		handleCommentInputChange,
		handleCommentInputBlur,
		loadComments,
		replyToComment,
		editComment,
		deleteComment,
		hasMoreComments,
		isLoadingMoreComments,
		loadMoreComments,
		typingUsers,
		isAuthenticated,
		currentUser,
		commentCount: liveCommentCount,
		onReportComment: (commentId: string) => reportModalRef.current?.open('COMMENT', commentId),
	}), [comments, isLoadingComments, commentText, setCommentText, handleSubmitComment, handleCommentInputChange, handleCommentInputBlur, loadComments, replyToComment, editComment, deleteComment, hasMoreComments, isLoadingMoreComments, loadMoreComments, typingUsers, isAuthenticated, currentUser, liveCommentCount]);

	return (
		<>
			<div className="border border-white/[0.08] rounded-xl shadow-lg shadow-black/20 overflow-hidden bg-gradient-to-b from-[var(--cook-bg-elevated)] to-[var(--cook-bg)] hover:border-orange-500/20 hover:shadow-orange-500/5 transition-all duration-300">
				<PostCardDesktop
					image={imageProps}
					author={authorProps}
					meta={metaProps}
					actions={actionsProps}
					comments={{ ...baseCommentsProps, variant: 'desktop' }}
				/>
				<PostCardTablet
					image={imageProps}
					author={authorProps}
					meta={metaProps}
					actions={actionsProps}
					comments={{ ...baseCommentsProps, variant: 'collapsible', showComments, handleToggleComments }}
				/>
				<PostCardMobile
					imageUrl={imageUrl}
					title={recipe.title}
					author={authorProps}
					meta={metaProps}
					actions={actionsProps}
					comments={{ ...baseCommentsProps, variant: 'collapsible', showComments, handleToggleComments }}
					onImageClick={handleOpenModal}
				/>
			</div>

			<RecipeModal
				recipe={recipeDetail}
				isLoading={isLoadingDetail}
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
			/>
			<ReportModal ref={reportModalRef} />
			<SaveToCollectionModal ref={collectionModalRef} />
		</>
	);
};

export default PostCard;
