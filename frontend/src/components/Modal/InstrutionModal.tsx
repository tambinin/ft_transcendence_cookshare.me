import { useState, useEffect } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import recipeService from "../../services/recipe.service";
import type { RecipeResponse } from "../../types/recipe.type";

interface InstrutionProps {
    modalRef: any;
    imageUrl?: string;
    recipeId?: string;
}

const InstrutionModal = ({ modalRef, imageUrl, recipeId }: InstrutionProps) => {
    const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!recipeId) return;
        const dialog = modalRef?.current;
        if (!dialog) return;
        const observer = new MutationObserver(() => {
            if (dialog.open && !recipe && !loading) {
                setLoading(true);
                recipeService.getRecipeById(recipeId)
                    .then(setRecipe)
                    .catch(() => {})
                    .finally(() => setLoading(false));
            }
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
        return () => observer.disconnect();
    }, [recipeId, modalRef, recipe, loading]);

    const title = recipe?.title || 'Loading...';
    const ingredients = recipe?.ingredients?.map(i => `${i.quantityText || ''} ${i.name}`.trim()) || [];
    const steps = recipe?.instructions?.map((inst, i) => ({ step: i + 1, instruction: inst.description })) || [];

    return (
        <dialog
            ref={modalRef}
            onClose={() => {
                document.body.style.overflow = '';
            }}
            className="modal backdrop-blur-sm"
        >
            <div className="modal-box pt-6 rounded-2xl bg-[var(--cook-bg)] max-w-[700px]">
                <div className="relative">
                    <p className='text-2xl font-bold text-orange-200 mb-4'>{title}</p>
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={() => modalRef.current?.close()}
                            className="hover:text-red-800 transition-colors"
                            aria-label="Close modal"
                        >
                            <IoCloseCircleOutline size={24} />
                        </button>
                    </div>
                </div>
                <div className='overflow-y-auto w-full max-h-[80vh] custom-scrollbar py-2 px-4'>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <>
                            {ingredients.length > 0 && (
                                <div className='flex flex-col gap-6 flex-grow'>
                                    <div className='space-y-4'>
                                        <div className='flex items-center gap-2 text-orange-400'>
                                            <h3 className='text-xs font-bold uppercase tracking-[0.2em] text-orange-400/80'>Ingrédients</h3>
                                        </div>
                                        <ul className='grid grid-cols-2 gap-y-3 gap-x-4'>
                                            {ingredients.map((ingredient, i) => (
                                                <li key={i} className='flex items-center gap-2 group'>
                                                    <span className='w-1.5 h-1.5 rounded-full bg-orange-400/40 group-hover:bg-orange-400 transition-colors'></span>
                                                    <span className='text-sm text-slate-300 group-hover:text-white transition-colors'>{ingredient}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {steps.length > 0 && (
                                <div className="mt-8">
                                    <h3 className='text-xs font-bold uppercase tracking-[0.2em] text-orange-400/80 mb-4'>Instructions</h3>
                                    <div className="space-y-4">
                                        <ul className="space-y-4">
                                            {steps.map((step, i) => (
                                                <li key={i} className="flex gap-4">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-400/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                                                        {step.step}
                                                    </span>
                                                    <p className="text-slate-300 pt-1">{step.instruction}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div className='flex justify-center items-center'>
                        <img
                            src={imageUrl || '/images/recipes/Custard.png'}
                            alt="Recipe preview"
                            className='w-full max-w-[700px] h-[50vh] mt-8 rounded-xl object-cover'
                        />
                    </div>
                </div>
            </div >
        </dialog >
    );
};

export default InstrutionModal;
