import { useState } from 'react';
import { GiCampCookingPot } from "react-icons/gi";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";
import { MdOutdoorGrill } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import recipeService from '../services/recipe.service';
import shoppingService from '../services/shopping.service';
import { useShoppingListContext } from '../contexts/shoppingList.context';
import { useFavorite } from '../contexts/favorite.context';
import RecipeModal from './Modal/RecipeModal';
import EditRecipeModal from './Modal/EditRecipeModal';
import type { RecipeSummary, RecipeResponse } from '../types/recipe.type';

interface RecipeUIProps {
    recipe: RecipeSummary;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    hideBookmark?: boolean;
}

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RecipeUI = ({ recipe, onDelete, onEdit, hideBookmark }: RecipeUIProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // View modal state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [recipeDetail, setRecipeDetail] = useState<RecipeResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Favorite state from context
    const { isFavorite: isFav, toggleFavorite: ctxToggleFavorite } = useFavorite();
    const isFavorite = isFav(recipe.id);

    // Shopping list context
    const { recipeIdsInList, refresh: refreshShoppingList } = useShoppingListContext();
    const isInShoppingList = recipeIdsInList.has(recipe.id);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await ctxToggleFavorite(recipe.id);
    };

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editRecipeData, setEditRecipeData] = useState<RecipeResponse | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    // Shopping list state
    const [addingToCart, setAddingToCart] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    const handleAddToShoppingList = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (addingToCart || isInShoppingList) return;
        setAddingToCart(true);
        try {
            await shoppingService.addFromRecipe(recipe.id);
            setAddedToCart(true);
            refreshShoppingList();
            setTimeout(() => setAddedToCart(false), 3000);
        } catch { /* silent */ }
        finally { setAddingToCart(false); }
    };

    const handleOpenView = async () => {
        setViewModalOpen(true);
        if (!recipeDetail) {
            setDetailLoading(true);
            try {
                const data = await recipeService.getRecipeById(recipe.id);
                setRecipeDetail(data);
            } catch { /* */ }
            finally { setDetailLoading(false); }
        }
    };

    const handleOpenEdit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditLoading(true);
        try {
            const data = await recipeService.getRecipeById(recipe.id);
            setEditRecipeData(data);
            setEditModalOpen(true);
        } catch { /* */ }
        finally { setEditLoading(false); }
    };

    const handleDelete = async () => {
        if (!onDelete || isDeleting) return;
        setIsDeleting(true);
        try {
            await onDelete(recipe.id);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const images = (recipe as any).images as { url: string }[] | undefined;
    const imageUrl = recipe.primaryImage?.url || images?.[0]?.url || '/images/recipes/Custard.png';

    return (
        <>
            <div
                onClick={handleOpenView}
                className="group relative bg-[#1c1c1e] hover:bg-[var(--cook-bg-surface)]
                    transition-all duration-500 flex flex-col
                    w-full overflow-hidden cursor-pointer
                    border border-white/5 rounded-2xl
                    shadow-lg hover:shadow-orange-500/10"
            >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden m-3 rounded-xl bg-[#121212]">
                    <img
                        src={imageUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {recipe.category && (
                        <div className="absolute top-2.5 left-2.5 bg-orange-500/80 backdrop-blur-md px-2.5 py-1 rounded-full">
                            <p className="text-[10px] text-white font-medium uppercase tracking-widest">
                                {recipe.category.name}
                            </p>
                        </div>
                    )}
                    {/* View overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <span className="flex items-center gap-1.5 text-white text-[12px] font-semibold px-3 py-1.5 bg-orange-500/30 backdrop-blur-sm rounded-full border border-orange-500/40">
                            <MdOutdoorGrill size={14} />
                            Voir recette
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 flex flex-col gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <GiCampCookingPot size={20} className="text-orange-400 shrink-0" />
                            <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1">
                                {recipe.title}
                            </h3>
                        </div>
                        <p className="text-[11px] text-white/30 font-medium">
                            {formatDate(recipe.createdAt)}
                        </p>
                    </div>

                    <hr className="border-white/5" />

                    {/* Stats row: likes + rating + delete */}
                    <div className="flex items-center justify-between">
                        {/* Rating - left */}
                        <div className="flex items-center gap-1.5">
                            <FaStar size={14} className={recipe.averageScore > 0 ? 'text-yellow-400' : 'text-white/20'} />
                            {recipe.averageScore > 0 ? (
                                <>
                                    <span className="text-sm font-bold text-gray-200">
                                        {recipe.averageScore.toFixed(1)}
                                    </span>
                                    <span className="text-[10px] text-gray-500">({recipe.ratingCount})</span>
                                </>
                            ) : (
                                <span className="text-sm font-bold text-gray-400">&mdash;</span>
                            )}
                        </div>

                        {/* Actions - right */}
                        <div className="flex items-center gap-1.5">
                            {onDelete && onEdit && (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    disabled={editLoading}
                                    className={`p-2 rounded-full transition-all hover:bg-orange-500/10 hover:text-orange-400 active:scale-90 text-gray-400 bg-white/10 ${editLoading ? 'opacity-50' : ''}`}
                                    title="Edit"
                                >
                                    <RiEditLine size={18} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                    disabled={isDeleting}
                                    className={`p-2 rounded-full transition-all
                                        ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/10 hover:text-red-500 active:scale-90'}
                                        text-gray-400 bg-white/10`}
                                    title="Delete"
                                >
                                    <RiDeleteBin5Line size={18} />
                                </button>
                            )}
                            {!hideBookmark && (
                                <button
                                    type="button"
                                    onClick={toggleFavorite}
                                    className={`p-2 rounded-full transition-all active:scale-90 bg-white/10 ${isFavorite ? 'text-orange-400 hover:bg-orange-500/15' : 'text-gray-400 hover:bg-orange-500/10 hover:text-orange-400'}`}
                                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                >
                                    {isFavorite ? <BsBookmarkFill size={16} /> : <BsBookmark size={16} />}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleAddToShoppingList}
                                disabled={addingToCart || addedToCart || isInShoppingList}
                                className={`p-2 rounded-full transition-all active:scale-90 bg-white/10 ${
                                    isInShoppingList
                                        ? 'text-orange-400 bg-orange-500/15'
                                        : addedToCart
                                            ? 'text-green-400 bg-green-500/10'
                                            : addingToCart
                                                ? 'text-white/20'
                                                : 'text-gray-400 hover:bg-orange-500/10 hover:text-orange-400'
                                }`}
                                title={isInShoppingList ? 'Déjà dans le shopping list' : addedToCart ? 'Ajouté !' : 'Ajouter au shopping list'}
                            >
                                <FiShoppingCart size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenView(); }}
                                className="p-2 rounded-full transition-all hover:bg-orange-500/10 hover:text-orange-400 active:scale-90 text-gray-400 bg-white/10"
                                title="Voir recette"
                            >
                                <MdOutdoorGrill size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Recipe Modal */}
            <RecipeModal
                recipe={recipeDetail}
                isLoading={detailLoading}
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
            />

            {/* Edit Recipe Modal */}
            {editRecipeData && (
                <EditRecipeModal
                    recipe={editRecipeData}
                    isOpen={editModalOpen}
                    onClose={() => { setEditModalOpen(false); setEditRecipeData(null); }}
                    onUpdated={() => {
                        setEditModalOpen(false);
                        setEditRecipeData(null);
                        setRecipeDetail(null);
                        if (onEdit) onEdit(recipe.id);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {/* RESPONSIVE FIX: centered modal with safe mobile padding */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg sm:text-xl font-bold text-center mb-2 tracking-tight text-white">
                            Delete Recipe
                        </h2>
                        <p className="text-gray-400 text-center text-sm leading-relaxed mb-6 sm:mb-8">
                            Are you sure you want to delete "{recipe.title}" ? No takesie-backsies.
                        </p>
                        {/* RESPONSIVE FIX: buttons stack on very small screens, touch-friendly */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 text-white min-h-[44px]"
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95 text-white disabled:opacity-50 min-h-[44px]"
                            >
                                {isDeleting ? 'Deleting...' : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RecipeUI;
