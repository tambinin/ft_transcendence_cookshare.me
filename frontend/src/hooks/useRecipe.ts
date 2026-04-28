import { useContext } from 'react';
import RecipeContext from '../contexts/recipe.context';

const useRecipe = () => {
  const context = useContext(RecipeContext);

  if (!context) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }

  return context;
};

export default useRecipe;