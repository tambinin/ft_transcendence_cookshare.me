import { useState, useEffect, useRef } from 'react';
import { IoMdClose } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';
import { FiTrash2 } from 'react-icons/fi';
import recipeService from '../../services/recipe.service';
import type { RecipeResponse, RecipeCategory, Difficulty } from '../../types/recipe.type';

interface EditRecipeModalProps {
	recipe: RecipeResponse;
	isOpen: boolean;
	onClose: () => void;
	onUpdated: () => void;
}

interface Ingredient {
	name: string;
	quantity: string;
	unit: string;
}

interface Step {
	id: number;
	instruction: string;
}

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
	{ label: 'Easy', value: 'EASY' },
	{ label: 'Medium', value: 'MEDIUM' },
	{ label: 'Hard', value: 'HARD' },
];

const EditRecipeModal = ({ recipe, isOpen, onClose, onUpdated }: EditRecipeModalProps) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const categoryRef = useRef<HTMLDivElement>(null);

	const [title, setTitle] = useState(recipe.title);
	const [description, setDescription] = useState(recipe.description);
	const [cookTime, setCookTime] = useState(recipe.cookTime);
	const [prepTime, setPrepTime] = useState(recipe.prepTime);
	const [servings, setServings] = useState(recipe.servings);
	const [difficulty, setDifficulty] = useState<Difficulty>(recipe.difficulty);
	const [categoryId, setCategoryId] = useState(recipe.category?.id || '');
	const [ingredients, setIngredients] = useState<Ingredient[]>(
		recipe.ingredients?.map(i => ({
			name: i.name,
			quantity: i.quantityText,
			unit: '',
		})) || []
	);
	const [steps, setSteps] = useState<Step[]>(
		recipe.instructions?.map(s => ({
			id: s.stepNumber,
			instruction: s.description,
		})) || []
	);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		recipe.images?.[0]?.url || null
	);

	const [categories, setCategories] = useState<RecipeCategory[]>([]);
	const [categoryOpen, setCategoryOpen] = useState(false);
	const [difficultyOpen, setDifficultyOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newIngName, setNewIngName] = useState('');
	const [newIngQty, setNewIngQty] = useState('');
	const [newIngUnit, setNewIngUnit] = useState('');

	const [newStep, setNewStep] = useState('');

	useEffect(() => {
		recipeService.getCategories()
			.then(cats => setCategories(cats))
			.catch(() => {});
	}, []);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen && !dialog.open) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		} else if (!isOpen && dialog.open) {
			dialog.close();
			document.body.style.overflow = '';
		}
	}, [isOpen]);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
				setCategoryOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			const reader = new FileReader();
			reader.onload = () => setImagePreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const addIngredient = () => {
		if (!newIngName.trim()) return;
		setIngredients(prev => [...prev, { name: newIngName.trim(), quantity: newIngQty.trim(), unit: newIngUnit.trim() }]);
		setNewIngName('');
		setNewIngQty('');
		setNewIngUnit('');
	};

	const removeIngredient = (index: number) => {
		setIngredients(prev => prev.filter((_, i) => i !== index));
	};

	const addStep = () => {
		if (!newStep.trim()) return;
		setSteps(prev => [...prev, { id: prev.length + 1, instruction: newStep.trim() }]);
		setNewStep('');
	};

	const removeStep = (index: number) => {
		setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, id: i + 1 })));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!title.trim()) return setError('Le nom de la recette est requis');
		if (!categoryId) return setError("Pick a category. It's not that hard.");
		if (ingredients.length === 0) return setError('Ajoutez au moins un ingrédient');
		if (steps.length === 0) return setError('Ajoutez au moins une étape');

		setIsSubmitting(true);
		try {
			await recipeService.updateRecipe(recipe.id, {
				title: title.trim(),
				description: description.trim(),
				cookTime,
				prepTime,
				servings,
				difficulty,
				categoryId,
				ingredients: ingredients.map(ing => ({
					name: ing.name,
					quantityText: ing.quantity,
					unit: ing.unit,
				})),
				instructions: steps.map((step, index) => ({
					stepNumber: index + 1,
					description: step.instruction,
				})),
			});

			if (imageFile) {
				await recipeService.uploadRecipeImage(recipe.id, imageFile);
			}

			onUpdated();
			onClose();
		} catch (err) {
			console.error('Error updating recipe:', err);
			setError('An error occurred while updating');
		} finally {
			setIsSubmitting(false);
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
			<div className="relative modal-box bg-[var(--cook-bg)] rounded-2xl w-full max-w-[600px]">
				<button
					type="button"
					onClick={onClose}
					className="cursor-pointer p-1 hover:text-red-600 hover:bg-white/10
						absolute top-3 right-3 rounded-full transition-colors z-10"
				>
					<IoMdClose size={20} className="transition-transform hover:rotate-90 hover:transition-duration-600" />
				</button>

				<h3 className="text-2xl font-semibold p-4 text-left">Edit Recipe</h3>

				{error && (
					<div className="mx-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-left">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex flex-col gap-2">
					<div className="overflow-y-auto max-h-[70vh] sm:max-h-[calc(100vh-250px)] gap-4 flex flex-col px-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 text-left">
						<div className="flex flex-col sm:flex-row gap-4 py-2 w-full max-w-[516px] mr-auto">
							<div className="flex flex-col gap-1 items-start w-full justify-center">
								<label className="text-white/40 text-xs">Name</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="bg-white/[0.02] border-2 w-full placeholder:text-gray-600 text-sm
										p-2 rounded-lg text-white/70 outline-none hover:border-white/20
										border-white/20 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
								/>
							</div>
							<div className="flex flex-row gap-4">
								<div className="flex flex-col gap-1 items-start justify-center flex-1 sm:flex-initial text-left">
									<label className="text-white/40 text-xs">Cook Time</label>
									<input
										type="number"
										min={0}
										value={cookTime}
										onChange={(e) => setCookTime(Number(e.target.value))}
										className="bg-white/[0.02] border-2 placeholder:text-gray-600 text-sm
											p-2 rounded-lg text-white/70 w-full sm:w-[10ch]
											outline-none hover:border-white/20 border-white/20
											focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
									/>
								</div>
								<div className="flex flex-col gap-1 items-start justify-center flex-1 sm:flex-initial text-left">
									<label className="text-white/40 text-xs">Prep Time</label>
									<input
										type="number"
										min={0}
										value={prepTime}
										onChange={(e) => setPrepTime(Number(e.target.value))}
										className="bg-white/[0.02] border-2 placeholder:text-gray-600 text-sm
											p-2 rounded-lg text-white/70 w-full sm:w-[10ch]
											outline-none hover:border-white/20 border-white/20
											focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
									/>
								</div>
							</div>
						</div>
						<div className="flex flex-row gap-4 w-full max-w-[516px] mr-auto text-left">
							<div className="flex flex-col gap-1 items-start justify-center flex-1">
								<label className="text-white/40 text-xs">Servings</label>
								<input
									type="number"
									min={1}
									value={servings}
									onChange={(e) => setServings(Number(e.target.value))}
									className="bg-white/[0.02] border-2 placeholder:text-gray-600 text-sm
										p-2 rounded-lg text-white/70 w-full
										outline-none hover:border-white/20 border-white/20
										focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
								/>
							</div>
							<div className="flex flex-col gap-1 items-start justify-center flex-1 relative">
								<label className="text-white/40 text-xs">Difficulty</label>
								<div
									onClick={() => setDifficultyOpen(!difficultyOpen)}
									className="flex items-center justify-between w-full h-[40px] p-2
										outline-none hover:border-white/20 border-2 border-white/10
										rounded-lg cursor-pointer bg-white/[0.02] text-white/70 text-sm"
								>
									{DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label || 'Medium'}
									<IoIosArrowDown className={`transition-transform ${difficultyOpen ? 'rotate-180' : ''}`} />
								</div>
								{difficultyOpen && (
									<ul className="absolute z-20 w-full top-full mt-1 bg-[var(--cook-bg)] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
										{DIFFICULTY_OPTIONS.map(opt => (
											<li
												key={opt.value}
												onClick={() => { setDifficulty(opt.value); setDifficultyOpen(false); }}
												className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-orange-500/10 hover:text-orange-400 transition-colors text-left
													${difficulty === opt.value ? 'text-orange-400 bg-orange-500/5' : 'text-white/70'}`}
											>
												{opt.label}
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
						<div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mr-auto text-left">
							<div className="flex flex-row items-end justify-between px-1">
								<p className="text-orange-500/80 text-xs font-bold tracking-widest">Description</p>
								<p className="text-gray-600 text-xs font-mono">
									<span className={description.length >= 300 ? 'text-red-500' : 'text-orange-500'}>
										{description.length}
									</span>/300
								</p>
							</div>
							<textarea
								value={description}
								onChange={(e) => { if (e.target.value.length <= 300) setDescription(e.target.value); }}
								rows={3}
								className="bg-white/[0.02] border-2 placeholder:text-gray-600 text-sm
									p-2 rounded-lg text-white/70 w-full outline-none hover:border-white/20
									border-white/20 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 resize-none text-left"
							/>
						</div>
						<div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mr-auto text-left">
							<p className="text-orange-500/80 text-xs font-bold tracking-widest px-1">Category</p>
							<div className="relative" ref={categoryRef}>
								<div
									onClick={() => setCategoryOpen(!categoryOpen)}
									className="flex items-center justify-between p-2.5 bg-white/[0.02]
										border-2 border-white/10 rounded-lg cursor-pointer
										hover:border-white/20 transition-colors text-sm"
								>
									<span className={categoryId ? 'text-white/90' : 'text-gray-500 text-left'}>
										{categories.find(c => c.id === categoryId)?.name || 'Select a category...'}
									</span>
									<IoIosArrowDown className={`text-white/40 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
								</div>
								{categoryOpen && (
									<ul className="absolute z-20 w-full bottom-full mb-1.5 bg-[var(--cook-bg)] border border-white/10 rounded-lg
										shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
										{categories.map(cat => (
											<li
												key={cat.id}
												onClick={() => { setCategoryId(cat.id); setCategoryOpen(false); }}
												className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-orange-500/10 hover:text-orange-400 transition-colors text-left
													${categoryId === cat.id ? 'text-orange-400 bg-orange-500/5' : 'text-white/70'}`}
											>
												{cat.name}
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
						<div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mr-auto text-left">
							<p className="text-orange-500/80 text-xs font-bold tracking-widest px-1">Ingredients</p>
							{ingredients.length === 0 && (
								<p className="text-gray-600 text-xs italic px-2 text-left">No ingredients yet...</p>
							)}
							<ul className="flex flex-col gap-2 px-2">
								{ingredients.map((ing, index) => (
									<li key={index} className="flex items-center justify-between group py-2 border-b border-white/5 text-xs transition-all hover:border-orange-500/30 text-left">
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<span className="w-1 h-1 rounded-full bg-orange-500/40 group-hover:bg-orange-500 transition-colors shrink-0" />
											<span className="text-white/80 font-medium break-words overflow-hidden leading-relaxed">{ing.name}</span>
										</div>
										<div className="flex items-center gap-4 shrink-0 ml-4">
											<span className="text-white/40 font-mono inline-block">{ing.quantity} {ing.unit}</span>
											<button type="button" onClick={() => removeIngredient(index)} className="opacity-30 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all">
												<FiTrash2 size={14} />
											</button>
										</div>
									</li>
								))}
							</ul>
							<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full mt-2">
								<input
									type="text"
									placeholder="Ingredient"
									value={newIngName}
									onChange={(e) => setNewIngName(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
									className="flex-1 bg-white/[0.02] border-2 border-white/10 rounded-lg p-2 text-sm text-white/70 outline-none focus:border-orange-500/50"
								/>
								<div className="flex gap-2">
									<input
										type="text"
										placeholder="Qty"
										value={newIngQty}
										onChange={(e) => setNewIngQty(e.target.value)}
										className="w-full sm:w-16 bg-white/[0.02] border-2 border-white/10 rounded-lg p-2 text-sm text-white/70 outline-none focus:border-orange-500/50"
									/>
									<input
										type="text"
										placeholder="Unit"
										value={newIngUnit}
										onChange={(e) => setNewIngUnit(e.target.value)}
										className="w-full sm:w-16 bg-white/[0.02] border-2 border-white/10 rounded-lg p-2 text-sm text-white/70 outline-none focus:border-orange-500/50"
									/>
									<button
										type="button"
										onClick={addIngredient}
										className="px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg text-sm font-bold transition-colors shrink-0"
									>
										Add
									</button>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mr-auto text-left">
							<p className="text-orange-500/80 text-xs font-bold tracking-widest px-1">Instructions</p>
							{steps.length === 0 && (
								<p className="text-gray-600 text-xs italic px-2 text-left">No steps yet...</p>
							)}
							<div className="space-y-3">
								{steps.map((step, index) => (
									<div key={index} className="flex items-start gap-3 group text-left">
										<span className="shrink-0 w-7 h-7 rounded-full bg-orange-400/20 text-orange-400 flex items-center justify-center font-bold text-xs mt-0.5">
											{index + 1}
										</span>
										<p className="flex-1 text-sm text-white/70 pt-1 leading-relaxed break-words">{step.instruction}</p>
										<button type="button" onClick={() => removeStep(index)} className="opacity-30 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all mt-1 shrink-0">
											<FiTrash2 size={16} />
										</button>
									</div>
								))}
							</div>
							<div className="flex gap-2 mt-2">
								<textarea
									placeholder="Describe this step..."
									value={newStep}
									onChange={(e) => setNewStep(e.target.value)}
									className="flex-1 bg-white/[0.02] border-2 border-white/10 rounded-lg p-2 text-sm text-white/70 outline-none focus:border-orange-500/50 resize-none h-[42px]"
								/>
								<button
									type="button"
									onClick={addStep}
									className="px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg text-sm font-bold transition-colors shrink-0"
								>
									Add
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mr-auto text-left">
							<p className="text-orange-500/80 text-xs font-bold tracking-widest px-1">Image</p>
							{imagePreview && (
								<img
									src={imagePreview}
									alt="Preview"
									className="w-full h-40 object-cover rounded-xl border border-white/10"
								/>
							)}
							<label className="flex items-center justify-center w-full p-3 bg-white/[0.02] border-2 border-dashed border-white/10
								rounded-lg cursor-pointer hover:border-orange-500/30 transition-colors text-sm text-white/50 text-left">
								<input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
								<span className="truncate">{imageFile ? imageFile.name : 'Choose a new image (optional)'}</span>
							</label>
						</div>
					</div>
					<div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 px-4 py-4 w-full text-right">
						<button
							type="button"
							onClick={onClose}
							className="cursor-pointer rounded-lg px-7 py-2 hover:bg-white/40 bg-white/10 transition-all text-white/70 text-sm"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="cursor-pointer rounded-lg px-7 py-2 bg-orange-500/20
								hover:bg-orange-500/40 text-orange-500 hover:text-white/70
								transition-all text-sm font-medium disabled:opacity-50"
						>
							{isSubmitting ? (
								<span className="loading loading-dots loading-sm"></span>
							) : (
								'Save Changes'
							)}
						</button>
					</div>
				</form>
			</div>
		</dialog>
	);
};

export default EditRecipeModal;
