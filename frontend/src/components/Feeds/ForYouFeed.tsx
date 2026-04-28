import { useEffect, useState, useCallback } from 'react';
import PostCard from '../PostCard';
import { useRecommendedRecipes } from '../../hooks/useRecipes';
import { useFeedRefresh } from '../../contexts/feed.context';
import { useFavorite } from '../../contexts/favorite.context';
import recipeService from '../../services/recipe.service';
import type { RecipeSummary } from '../../types/recipe.type';

type Tab = 'recommended' | 'saved';

const PostCardSkeleton = () => (
    <div className="post-card grid grid-cols-12 border-2 border-white/10 rounded-lg shadow-lg animate-pulse">
        <section className="col-span-5 p-4 bg-linear-to-br from-[#1e293b] to-[#0f172a] rounded-l-lg">
            <div className="h-8 bg-white/10 rounded w-3/4 mb-4"></div>
            <div className="flex gap-2 mb-4">
                <div className="h-6 bg-white/10 rounded-full w-16"></div>
                <div className="h-6 bg-white/10 rounded-full w-20"></div>
            </div>
            <div className="h-48 bg-white/10 rounded"></div>
        </section>
        <section className="col-span-4 p-6 bg-slate-900/50 border-x border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <div className="h-4 bg-white/10 rounded w-24"></div>
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
            </div>
        </section>
        <section className="col-span-3 p-6">
            <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
            <div className="space-y-3">
                <div className="h-16 bg-white/10 rounded"></div>
                <div className="h-16 bg-white/10 rounded"></div>
            </div>
        </section>
    </div>
);

const ForYouFeed = () => {
    const [activeTab, setActiveTab] = useState<Tab>('recommended');
    const { recipes: recommended, isLoading: recLoading, error: recError, refresh: refreshRec } = useRecommendedRecipes();
    const { refreshKey } = useFeedRefresh();
    const { favoriteIds } = useFavorite();

    const [saved, setSaved] = useState<RecipeSummary[]>([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [savedError, setSavedError] = useState<string | null>(null);
    const [savedLoaded, setSavedLoaded] = useState(false);

    const loadSaved = useCallback(async () => {
        setSavedLoading(true);
        setSavedError(null);
        try {
            const data = await recipeService.getMyFavorites();
            setSaved(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            setSavedError(err instanceof Error ? err.message : 'Failed to load saved recipes');
        } finally {
            setSavedLoading(false);
            setSavedLoaded(true);
        }
    }, []);

    const handleRemoveSaved = useCallback((recipeId: string) => {
        setSaved(prev => prev.filter(r => r.id !== recipeId));
    }, []);

    useEffect(() => {
        if (activeTab === 'saved') {
            loadSaved();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Reload saved list when favoriteIds change (toggle from feed)
    useEffect(() => {
        if (savedLoaded) {
            loadSaved();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favoriteIds]);

    useEffect(() => {
        if (refreshKey > 0) {
            refreshRec();
            if (activeTab === 'saved') loadSaved();
        }
    }, [refreshKey, refreshRec, activeTab, loadSaved]);

    const recipes = activeTab === 'recommended' ? recommended : saved;
    const isLoading = activeTab === 'recommended' ? recLoading : savedLoading;
    const error = activeTab === 'recommended' ? recError : savedError;
    const refresh = activeTab === 'recommended' ? refreshRec : loadSaved;

    const renderContent = () => {
        if (isLoading && recipes.length === 0) {
            return (
                <div className="flex flex-col space-y-4">
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                </div>
            );
        }

        if (error && recipes.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-white/70 text-lg mb-2">
                        {activeTab === 'recommended' ? 'Unable to load recommendations' : 'Unable to load saved recipes'}
                    </p>
                    <p className="text-white/40 text-sm mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!isLoading && recipes.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-orange-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {activeTab === 'recommended' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            )}
                        </svg>
                    </div>
                    <p className="text-white/70 text-lg mb-2">
                        {activeTab === 'recommended'
                            ? 'No recommendations yet'
                            : 'No saved recipes yet'}
                    </p>
                    <p className="text-white/40 text-sm">
                        {activeTab === 'recommended'
                            ? 'Browse and interact with recipes to get personalized picks!'
                            : 'Bookmark recipes you love to find them here!'}
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col space-y-4">
                {recipes.map((recipe) => (
                    <PostCard
                        key={recipe.id}
                        recipe={recipe}
                        onRemove={activeTab === 'saved' ? handleRemoveSaved : undefined}
                    />
                ))}
                <div className="text-center py-4 text-white/40 text-sm">
                    {activeTab === 'recommended'
                        ? 'You\'ve seen all recommendations!'
                        : 'End of saved recipes'}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
            <div className="sticky top-0 z-10 bg-[var(--cook-bg)] py-2">
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                    <button
                        onClick={() => setActiveTab('recommended')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'recommended'
                                ? 'bg-orange-500/20 text-orange-400 shadow-sm'
                                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Recommended
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'saved'
                                ? 'bg-orange-500/20 text-orange-400 shadow-sm'
                                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Saved
                        {saved.length > 0 && (
                            <span className="bg-white/10 text-white/60 text-xs px-1.5 py-0.5 rounded-full">
                                {saved.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={refresh}
                        className="text-white/40 hover:text-orange-400 transition-colors p-1 ml-1"
                        title="Refresh"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default ForYouFeed;
