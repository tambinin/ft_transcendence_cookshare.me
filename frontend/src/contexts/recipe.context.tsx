import { createContext, useState, useCallback, useContext } from "react";
import type { ReactNode } from "react";
import type { NewRecipeData, RecipeResponse } from "../types/recipe.type";
import recipeService from "../services/recipe.service";
import RecipeModal from "../components/Modal/RecipeModal";

interface RecipeContextType {
	createRecipe: (data: NewRecipeData) => Promise<RecipeResponse>;
	uploadRecipeImage: (recipeId: string, imageFile: File) => Promise<void>;
	openRecipeModal: (recipeId: string) => void;
	closeRecipeModal: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const useRecipeModal = () => {
	const ctx = useContext(RecipeContext);
	if (!ctx) throw new Error("useRecipeModal must be used within RecipeProvider");
	return { openRecipeModal: ctx.openRecipeModal, closeRecipeModal: ctx.closeRecipeModal };
};

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [recipeDetail, setRecipeDetail] = useState<RecipeResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const createRecipe = async (data: NewRecipeData): Promise<RecipeResponse> => {
		return await recipeService.createRecipe(data);
	};

	const uploadRecipeImage = async (recipeId: string, imageFile: File): Promise<void> => {
		await recipeService.uploadRecipeImage(recipeId, imageFile);
	};

	const openRecipeModal = useCallback(async (recipeId: string) => {
		setModalOpen(true);
		setRecipeDetail(null);
		setIsLoading(true);
		try {
			const data = await recipeService.getRecipeById(recipeId);
			setRecipeDetail(data);
		} catch {
			/* silent */
		} finally {
			setIsLoading(false);
		}
	}, []);

	const closeRecipeModal = useCallback(() => {
		setModalOpen(false);
		setRecipeDetail(null);
	}, []);

	return (
		<RecipeContext.Provider value={{ createRecipe, uploadRecipeImage, openRecipeModal, closeRecipeModal }}>
			{children}
			<RecipeModal
				recipe={recipeDetail}
				isLoading={isLoading}
				isOpen={modalOpen}
				onClose={closeRecipeModal}
			/>
		</RecipeContext.Provider>
	);
};

export default RecipeContext;