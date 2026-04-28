import { useEffect, useState } from 'react';
import RecipeUI from '../RecipeUI';
import { useMyRecipes } from '../../hooks/useRecipes';
import recipeService from '../../services/recipe.service';
import { GiCampCookingPot } from 'react-icons/gi';
import { useFeedRefresh } from '../../contexts/feed.context';

const OwnRecipeFeed = () => {
    const { recipes, isLoading, error, refresh } = useMyRecipes();
    const { refreshKey } = useFeedRefresh();
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (refreshKey > 0) {
            refresh();
        }
    }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async (id: string) => {
        setDeleteError(null);
        try {
            await recipeService.deleteRecipe(id);
            refresh();
        } catch {
            setDeleteError('Échec de la suppression. Réessayez.');
            setTimeout(() => setDeleteError(null), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4'>
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse border border-white/5 rounded-2xl bg-[#1c1c1e] overflow-hidden">
                        <div className="aspect-square bg-white/10 m-3 rounded-xl" />
                        <div className="px-4 pb-4 space-y-2">
                            <div className="h-5 bg-white/10 rounded w-3/4" />
                            <div className="h-4 bg-white/10 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-red-400">{error}</p>
                <button onClick={refresh} className="btn btn-sm btn-outline border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black">
Try again
                </button>
            </div>
        );
    }

    if (recipes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                <GiCampCookingPot size={48} className="text-orange-400/40" />
                <p className="text-lg font-medium">No recipes yet. Are you even trying?</p>
                <p className="text-sm text-gray-500">Share your first recipe</p>
            </div>
        );
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4'>
            {deleteError && (
                <p className="col-span-full text-red-400 text-sm animate-pulse">{deleteError}</p>
            )}
            {recipes.map((recipe) => (
                <RecipeUI
                    key={recipe.id}
                    recipe={recipe}
                    onDelete={handleDelete}
                    onEdit={() => refresh()}
                    hideBookmark
                />
            ))}
        </div>
    );
}

export default OwnRecipeFeed;