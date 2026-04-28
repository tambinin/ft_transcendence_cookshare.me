import { useState, useEffect, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import PictureInput from "../input/PictureInput";
import RecipeNameInput from "../input/RecipeNameInput";

import IngredientInput from "../input/IngredientInput";
import StepInput from "../input/StepInput";
import DescriptionInput from "../input/DescriptionInput";
import { useFeedRefresh } from "../../contexts/feed.context";
import recipeService from "../../services/recipe.service";
import type { RecipeCategory, RecipeDietaryTag } from "../../types/recipe.type";
interface NewRecipeProps {
    modalRef: React.RefObject<HTMLDialogElement | null>;
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

const NewRecipe = ({ modalRef }: NewRecipeProps) => {
    const { triggerRefresh, showSuccess } = useFeedRefresh();
	const [ title, setTitle] = useState("");
	const [ description, setDescription ] = useState("");
	const [ cookTime, setCookTime] = useState(0);
	const [ difficulty, setDifficulty ] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
	const [ ingredient, setIngredient ] = useState<Ingredient[]>([]);
	const [ steps, setSteps ] = useState<Step[]>([]);
	const [ imageFile, setImageFile ] = useState<File | null>(null);
	const [ isSubmitting, setIsSubmitting ] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [categories, setCategories] = useState<RecipeCategory[]>([]);
	const [categoryId, setCategoryId] = useState("");
	const [dietaryTags, setDietaryTags] = useState<RecipeDietaryTag[]>([]);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [categoryOpen, setCategoryOpen] = useState(false);
	const categoryRef = useRef<HTMLDivElement>(null);
	const [formKey, setFormKey] = useState(0);

	useEffect(() => {
		recipeService.getCategories()
			.then(cats => setCategories(cats))
			.catch(() => {});
		recipeService.getDietaryTags()
			.then(tags => setDietaryTags(tags))
			.catch(() => {});
	}, []);
	
	const handleSubmit = async(e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!title.trim())return (setError("Recipe name is Required"));
		if (!categoryId)return (setError("Please select a category"));
		if (ingredient.length === 0)return (setError("Add at least one argument"));
		if (steps.length === 0)return (setError("Add at least one step"));
		setIsSubmitting(true);

		try {
			const created = await recipeService.createRecipe ({
				title: title.trim(),
				description: description.trim(),
				cookTime,
				prepTime: 0,
				servings: 1,
				difficulty,
				categoryId,
				isPublished: true,
				dietaryTagIds: selectedTagIds,
				ingredients: ingredient.map((ing) => ({
					name: ing.name,
					quantityText: ing.quantity,
					unit: ing.unit
				})),
				instructions: steps.map((step, index) => ({
					stepNumber: index + 1,
					description: step.instruction
				})),
			});
			if (imageFile) {
				await recipeService.uploadRecipeImage(created.id, imageFile);
			}
			setTitle("");
			setDescription("");
			setCookTime(0);
			setDifficulty('MEDIUM');
			setIngredient([]);
			setSteps([]);
			setImageFile(null);
			setCategoryId("");
			setSelectedTagIds([]);
			setError(null);
			setFormKey(prev => prev + 1);
			modalRef.current?.close();
			showSuccess('Recipe created successfully!');
			triggerRefresh();
		} catch {
			setError("Something went wrong, Please try again");
		} finally {
			setIsSubmitting(false);
		}
	}
	return (
        <dialog ref={modalRef}
            className="modal
                backdrop:bg-black/50 backdrop:backdrop-blur-sm
                shadow-2xl"
        >
            {/* RESPONSIVE FIX: fullscreen on mobile, constrained on desktop */}
            <div className="relative modal-box bg-[var(--cook-bg)] rounded-none sm:rounded-2xl w-full max-w-full sm:max-w-[600px] h-full sm:h-auto max-h-full sm:max-h-[90vh]">
                <button
                    type="button"
                    onClick={() => modalRef.current?.close()}
                    aria-label="Close modal"
                    className="cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center 
                        hover:text-red-600 hover:bg-white/10
                        absolute top-3 right-3
                        rounded-full transition-colors"
                >
                    <IoMdClose
                        size={20}
                        className="transition-transform hover:rotate-90
                            hover:transition-duration-600"
                    />
                </button>
                {/* RESPONSIVE FIX: responsive heading */}
                <h3 className="text-xl sm:text-2xl font-semibold
                    p-4">What’s Cooking?</h3>                {error && (
                    <div className="mx-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}                <form onSubmit={handleSubmit}
                    className="flex flex-col gap-2"
                >
                    <div className="overflow-y-auto max-h-[70vh] sm:max-h-[calc(100vh-250px)] gap-2 flex flex-col px-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        <RecipeNameInput
						key={`name-${formKey}`}
						onNameChange={setTitle}
						onCookTimeChange={setCookTime}
						onDifficultyChange={setDifficulty}
					/>
                        <DescriptionInput key={`desc-${formKey}`} onChange={setDescription} />

                        {/* Category Selector */}
                        <div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mx-auto">
                            <div className="flex flex-col gap-0.5 px-1">
                                <p className="text-orange-500/80 text-xs font-bold tracking-widest">
                                    Category
                                </p>
                            </div>
                            <div className="relative" ref={categoryRef}>
                                <div
                                    onClick={() => setCategoryOpen(!categoryOpen)}
                                    className="flex items-center justify-between p-2.5
                                        bg-white/[0.02] border-2 border-white/10 rounded-lg
                                        cursor-pointer hover:border-white/20 transition-colors text-sm"
                                >
                                    <span className={categoryId ? 'text-white/90' : 'text-gray-500'}>
                                        {categories.find(c => c.id === categoryId)?.name || 'Select a category...'}
                                    </span>
                                    <IoIosArrowDown className={`text-white/40 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
                                </div>
                                {categoryOpen && (
                                    <ul className="absolute z-20 w-full bottom-full mb-1.5
                                        bg-[var(--cook-bg)] border border-white/10 rounded-lg
                                        shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto
                                        scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                                    >
                                        {categories.map(cat => (
                                            <li
                                                key={cat.id}
                                                onClick={() => {
                                                    setCategoryId(cat.id);
                                                    setCategoryOpen(false);
                                                }}
                                                className="px-3 py-2.5 cursor-pointer text-white/70 text-sm
                                                    hover:bg-orange-500/10 hover:text-orange-400 transition-colors"
                                            >
                                                {cat.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Dietary Tags Multi-Chip Selector */}
                        {dietaryTags.length > 0 && (
                            <div className="flex flex-col gap-2 py-2 w-full max-w-[516px] mx-auto">
                                <div className="flex flex-col gap-0.5 px-1">
                                    <p className="text-orange-500/80 text-xs font-bold tracking-widest">
                                        Dietary Tags
                                    </p>
                                </div>
                                <div key={`tags-${formKey}`} className="flex flex-wrap gap-2">
                                    {dietaryTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => setSelectedTagIds(prev =>
                                                prev.includes(tag.id)
                                                    ? prev.filter(id => id !== tag.id)
                                                    : [...prev, tag.id]
                                            )}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                selectedTagIds.includes(tag.id)
                                                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                                            }`}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <IngredientInput
						key={`ing-${formKey}`}
						onChange={setIngredient}
					/>
                        <StepInput
						key={`steps-${formKey}`}
						onChange={setSteps}
					/>
                        <PictureInput
						key={`pic-${formKey}`}
							onFileChange = {setImageFile}
						/>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 px-4 py-3">
                        <button
                            type="button"
                            onClick={() => modalRef.current?.close()}
                            aria-label="Close modal"
                            className="cursor-pointer rounded-lg px-7 py-2
                            hover:bg-white/40 bg-white/10
                            transition-all text-white/70 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
							disabled={isSubmitting}
                            className="cursor-pointer rounded-lg px-7 py-2
                            bg-orange-500/20
                            hover:bg-orange-500/40 text-orange-500 hover:text-white/70
                            transition-all text-sm font-medium"
                        >
                            {isSubmitting ? <span className="loading loading-dots loading-xl"></span> : "Create"}
                        </button>
                    </div>
                </form>
            </div >
        </dialog >
    );
}

export default NewRecipe;