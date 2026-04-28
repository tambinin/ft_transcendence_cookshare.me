import { useRef, useEffect, useState } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { BiTimeFive } from 'react-icons/bi';
import { GiCampCookingPot } from 'react-icons/gi';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import shoppingService from '../../services/shopping.service';
import { useShoppingListContext } from '../../contexts/shoppingList.context';
import type { RecipeResponse } from '../../types/recipe.type';

interface RecipeModalProps {
	recipe: RecipeResponse | null;
	isLoading: boolean;
	isOpen: boolean;
	onClose: () => void;
}

const formatDifficulty = (d: string) => {
	const m: Record<string, string> = { EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Difficile' };
	return m[d] || d;
};

const RecipeModal = ({ recipe, isLoading, isOpen, onClose }: RecipeModalProps) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [addingToCart, setAddingToCart] = useState(false);
	const [addedToCart, setAddedToCart] = useState(false);
	const { recipeIdsInList, refresh } = useShoppingListContext();

	const isAlreadyInList = recipe ? recipeIdsInList.has(recipe.id) : false;

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen && !dialog.open) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
			setAddedToCart(false);
		} else if (!isOpen && dialog.open) {
			dialog.close();
			document.body.style.overflow = '';
		}
	}, [isOpen]);

	const handleAddToShoppingList = async () => {
		if (!recipe || addingToCart || isAlreadyInList) return;
		setAddingToCart(true);
		try {
			await shoppingService.addFromRecipe(recipe.id);
			setAddedToCart(true);
			refresh();
			setTimeout(() => setAddedToCart(false), 3000);
		} catch {
			/* silent */
		} finally {
			setAddingToCart(false);
		}
	};

	return (
		<dialog
			ref={dialogRef}
			onClose={() => {
				document.body.style.overflow = '';
				onClose();
			}}
			onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
			className="modal backdrop-blur-sm"
		>
			{/* RESPONSIVE FIX: fullscreen on mobile, normal modal on desktop */}
			<div className="modal-box pt-6 rounded-none sm:rounded-2xl bg-[var(--cook-bg)] w-full sm:max-w-[800px] max-h-[100vh] sm:max-h-[85vh] text-left flex flex-col items-start !text-left">
				<div className="relative flex items-center justify-between mb-4 w-full text-left">
					<div className="flex items-center gap-2 text-left w-full">
						<GiCampCookingPot size={24} className="text-orange-400 shrink-0" />
						<h2 className="text-2xl font-bold text-orange-200 text-left flex-1">
							{recipe?.title || 'Loading...'}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="hover:text-red-800 transition-colors shrink-0 ml-4"
						aria-label="Fermer"
					>
						<IoCloseCircleOutline size={24} />
					</button>
				</div>

				{isLoading || !recipe ? (
					<div className="flex items-center justify-center py-16 w-full">
						<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-400" />
					</div>
				) : (
					<div className="overflow-y-auto max-h-[75vh] custom-scrollbar pr-2 w-full text-left items-start">
						{recipe.images?.[0] && (
							<img
								src={recipe.images[0].url}
								alt={recipe.title}
								className="w-full h-[260px] object-cover rounded-xl border border-white/10 mb-5"
							/>
						)}
						<div className="flex flex-wrap items-center gap-2 mb-4 justify-start w-full">
							<span className="flex items-center gap-1 px-2.5 py-1 border border-white/10 bg-white/5 rounded-full text-xs text-slate-300 whitespace-nowrap">
								<BiTimeFive className="text-blue-300" size={14} />
								{recipe.prepTime + recipe.cookTime} min
							</span>
							<span className="flex items-center gap-1 px-2.5 py-1 border border-white/10 bg-white/5 rounded-full text-xs text-slate-300 whitespace-nowrap">
								{formatDifficulty(recipe.difficulty)}
							</span>
							<span className="flex items-center gap-1 px-2.5 py-1 border border-white/10 bg-white/5 rounded-full text-xs text-slate-300 whitespace-nowrap">
								{recipe.servings} portions
							</span>
							{recipe.category && (
								<span className="px-2.5 py-1 bg-orange-500/80 text-white text-xs font-medium rounded-lg whitespace-nowrap">
									{recipe.category.name}
								</span>
							)}
						</div>
						<p className="text-slate-300 text-sm leading-relaxed mb-6 text-left w-full break-words">
							{recipe.description}
						</p>
						<div className="flex items-center justify-between mb-3 w-full">
							<h3 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400/80 text-left">
								Ingrédients
							</h3>
							<button
								onClick={handleAddToShoppingList}
								disabled={addingToCart || addedToCart || isAlreadyInList}
								className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
									isAlreadyInList
										? 'bg-orange-500/15 text-orange-400 border border-orange-500/25 cursor-default'
										: addedToCart
											? 'bg-green-500/15 text-green-400 border border-green-500/20'
											: addingToCart
												? 'bg-white/5 text-white/30 border border-white/5'
												: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
								}`}
							>
								{isAlreadyInList ? (
									<><FiShoppingCart size={13} /> In list</>
								) : addedToCart ? (
									<><FiCheck size={13} /> Added!</>
								) : addingToCart ? (
									<><span className="w-3 h-3 border-2 border-white/20 border-t-orange-400 rounded-full animate-spin" /> Adding...</>
								) : (
									<><FiShoppingCart size={13} /> Add to list</>
								)}
							</button>
						</div>
						<ul className="flex flex-col gap-y-2.5 mb-6 text-left w-full">
							{recipe.ingredients
								.sort((a, b) => a.sortOrder - b.sortOrder)
								.map((ing) => (
									<li key={ing.id} className="flex items-start gap-2.5 group justify-start w-full">
										<span className="w-1.5 h-1.5 rounded-full bg-orange-400/40 group-hover:bg-orange-400 transition-colors shrink-0 mt-1.5" />
										<span className="text-sm text-slate-300 group-hover:text-white transition-colors text-left break-words flex-1">
											{ing.quantityText} {ing.name}
										</span>
									</li>
								))}
						</ul>
						<h3 className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400/80 mb-3 text-left w-full">
							Instructions
						</h3>
						<div className="flex flex-col gap-y-4 text-left w-full">
							{recipe.instructions
								.sort((a, b) => a.stepNumber - b.stepNumber)
								.map((step) => (
									<div key={step.id} className="flex gap-3 justify-start items-start w-full">
										<span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-400/20 text-orange-400 flex items-center justify-center font-bold text-sm">
											{step.stepNumber}
										</span>
										<p className="text-slate-300 text-sm pt-0.5 text-left flex-1 break-words">
											{step.description}
										</p>
									</div>
								))}
						</div>
					</div>
				)}
			</div>
		</dialog>
	);
};

export default RecipeModal;
