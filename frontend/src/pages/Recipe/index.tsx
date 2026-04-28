import { useNavigate } from 'react-router-dom';
import type { ReportTargetType } from '../../types/report.type';
import { useRecipePage } from './useRecipePage';
import RecipeSkeleton from './RecipeSkeleton';
import RecipeHero from './RecipeHero';
import RecipeHeader from './RecipeHeader';
import RecipeInstructions from './RecipeInstructions';
import RecipeReview from './RecipeReview';
import RecipeComments from './RecipeComments';
import RecipeSidebar from './RecipeSidebar';
import EditRecipeModal from '../../components/Modal/EditRecipeModal';
import ReportModal from '../../components/Modal/ReportModal';

const Recipe = () => {
	const navigate = useNavigate();
	const s = useRecipePage();

	if (s.isLoading) return <RecipeSkeleton />;

	if (s.error || !s.recipe) {
		return (
			<div className="min-h-screen bg-(--cook-bg) text-white flex flex-col items-center justify-center">
				<div className="text-red-400 mb-4">
					<svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<h1 className="text-2xl font-bold mb-2">Recipe not found</h1>
				<p className="text-white/60 mb-6">{s.error || "This recipe doesn't exist or has been deleted."}</p>
				<button onClick={() => navigate('/home/feed')} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors">
					Back to feed
				</button>
			</div>
		);
	}

	const { recipe } = s;
	const primaryImage = recipe.images?.find(img => img.isPrimary) || recipe.images?.[0];
	const totalTime = recipe.prepTime + recipe.cookTime;

	return (
		<div className="min-h-screen bg-(--cook-bg) text-white">
			<RecipeHero
				imageUrl={primaryImage?.url || '/images/recipes/default.png'}
				title={recipe.title}
				isFavorite={s.isFavorite}
				isOwnRecipe={s.isOwnRecipe}
				isAuthenticated={s.isAuthenticated}
				recipeId={recipe.id}
				onBack={() => navigate(-1)}
				onEdit={() => s.setEditModalOpen(true)}
				onToggleFavorite={s.handleToggleFavorite}
				onReport={(type, id) => s.reportModalRef.current?.open(type as ReportTargetType, id)}
			/>

			{/* RESPONSIVE FIX: reduce horizontal padding on mobile, adjust negative margin */}
			<div className="max-w-6xl mx-auto px-3 sm:px-6 -mt-16 sm:-mt-20 relative z-10 pb-20 md:pb-12">
				<RecipeHeader
					difficulty={recipe.difficulty}
					category={recipe.category}
					title={recipe.title}
					author={recipe.author}
					createdAt={recipe.createdAt}
					totalTime={totalTime}
					servings={recipe.servings}
					averageScore={recipe.averageScore}
					ratingCount={recipe.ratingCount}
					viewCount={recipe.viewCount}
				/>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<RecipeInstructions instructions={recipe.instructions} description={recipe.description} />

						{s.isAuthenticated && (
							<RecipeReview
								userRating={s.userRating}
								comment={s.comment}
								typingCount={s.typingUsers.size}
								onRate={s.handleRate}
								onCommentChange={s.handleCommentChange}
								onCommentSubmit={s.handleComment}
								onCommentBlur={s.handleCommentBlur}
							/>
						)}

						<RecipeComments
							comments={s.comments}
							onReply={s.handleReply}
							onReport={(commentId) => s.reportModalRef.current?.open('COMMENT', commentId)}
							currentUserAvatar={s.currentUser?.avatarUrl ?? undefined}
							currentUserId={s.currentUser?.id}
							isAuthenticated={s.isAuthenticated}
						/>
					</div>

					<RecipeSidebar
						servings={recipe.servings}
						ingredients={recipe.ingredients}
						dietaryTags={recipe.dietaryTags}
						isAuthenticated={s.isAuthenticated}
						shoppingAdded={s.shoppingAdded}
						onAddToShoppingList={s.handleAddToShoppingList}
					/>
				</div>
			</div>

			{s.isOwnRecipe && s.editModalOpen && (
				<EditRecipeModal
					recipe={recipe}
					isOpen={s.editModalOpen}
					onClose={() => s.setEditModalOpen(false)}
					onUpdated={() => s.refresh()}
				/>
			)}
			<ReportModal ref={s.reportModalRef} />
		</div>
	);
};

export default Recipe;
