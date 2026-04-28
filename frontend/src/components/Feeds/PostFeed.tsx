import { useEffect, useRef, useCallback } from 'react';
import PostCard from '../PostCard';
import { useRecipes } from '../../hooks/useRecipes';
import { useFeedRefresh } from '../../contexts/feed.context';
import RecipeFilterBar from './RecipeFilterBar';

const PostCardSkeleton = () => (
    <div className="border-2 border-white/10 rounded-xl shadow-lg animate-pulse">
        <div className="hidden lg:grid grid-cols-12">
            <div className="col-span-4 p-5 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
                <div className="aspect-[4/3] bg-white/10 rounded-xl mb-3"></div>
                <div className="flex justify-center gap-4 py-2">
                    <div className="h-10 w-12 bg-white/10 rounded"></div>
                    <div className="h-10 w-12 bg-white/10 rounded"></div>
                    <div className="h-10 w-12 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 bg-white/10 rounded-xl mt-3"></div>
            </div>
            <div className="col-span-5 p-5 bg-slate-900/50 border-x border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-white/10 rounded-full"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-white/10 rounded w-20"></div>
                        <div className="h-2 bg-white/10 rounded w-14"></div>
                    </div>
                </div>
                <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
                <div className="flex gap-2 mb-3">
                    <div className="h-5 bg-white/10 rounded-full w-16"></div>
                    <div className="h-5 bg-white/10 rounded-full w-16"></div>
                </div>
                <div className="space-y-2 mb-auto">
                    <div className="h-3 bg-white/10 rounded w-full"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </div>
            </div>
            <div className="col-span-3 p-4">
                <div className="h-5 bg-white/10 rounded w-28 mb-3"></div>
                <div className="h-px bg-white/10 mb-3"></div>
                <div className="space-y-3">
                    <div className="h-14 bg-white/10 rounded-xl"></div>
                    <div className="h-14 bg-white/10 rounded-xl"></div>
                </div>
            </div>
        </div>
    </div>
);

const PostFeed = () => {
    const { recipes, isLoading, isLoadingMore, error, hasNextPage, loadMore, refresh, setFilters, filters } = useRecipes();
    const { refreshKey } = useFeedRefresh();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (refreshKey > 0) {
            refresh();
        }
    }, [refreshKey, refresh]);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isLoadingMore) {
                loadMore();
            }
        },
        [hasNextPage, isLoadingMore, loadMore]
    );

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0.1,
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    const filterBar = (
        <div className="sticky top-0 z-10 bg-[var(--cook-bg)] py-2">
            <RecipeFilterBar
                activeFilters={{
                    categoryId: filters.categoryId,
                    difficulty: filters.difficulty,
                    sortBy: filters.sortBy,
                    sortOrder: filters.sortOrder,
                }}
                onFilterChange={(newFilters) => setFilters(newFilters)}
            />
        </div>
    );

    if (isLoading && recipes.length === 0) {
        return (
            <div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
                {filterBar}
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
            </div>
        );
    }

    if (error && recipes.length === 0) {
        return (
            <div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
                {filterBar}
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-white/70 text-lg mb-2">Failed to load recipes. Guess you're ordering takeout.</p>
                    <p className="text-white/40 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!isLoading && recipes.length === 0) {
        return (
            <div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
                {filterBar}
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-orange-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-white/70 text-lg mb-2">No recipes found. Time to invent one, chef.</p>
                    <p className="text-white/40 text-sm">Soyez le premier à partager une recette !</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:mr-2 space-y-4 mb-6 px-3 sm:px-0">
            {filterBar}

            {recipes.map((recipe, index) => (
                <div key={recipe.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index * 80, 400)}ms` }}>
                    <PostCard recipe={recipe} />
                </div>
            ))}

            <div ref={loadMoreRef} className="h-4" />

            {isLoadingMore && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                </div>
            )}

            {!hasNextPage && recipes.length > 0 && (
                <div className="text-center py-4 text-white/40 text-sm">
                    Vous avez tout vu ! 🍳
                </div>
            )}
        </div>
    );
};

export default PostFeed;