import { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import recipeService from '../../services/recipe.service';
import mealPlanService from '../../services/mealplan.service';
import type { MealType } from '../../types/mealplan.type';
import type { RecipeSummary } from '../../types/recipe.type';

interface AddMealPlanProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  date: string;
  mealType: MealType;
}

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

const AddMealPlan = ({ isOpen, onClose, onCreated, date, mealType }: AddMealPlanProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchQuery.trim()) { setRecipes([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await recipeService.searchRecipes(searchQuery);
        const data = res?.data;
        if (Array.isArray(data)) {
          setRecipes(data);
        } else if (data && Array.isArray((data as any).recipes)) {
          setRecipes((data as any).recipes.map((r: any) => ({
            ...r,
            primaryImage: r.primaryImage ?? (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null),
          })));
        } else {
          setRecipes([]);
        }
      } catch { setRecipes([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSave = async () => {
    if (!selectedRecipe) return;
    setSaving(true);
    setError('');
    try {
      await mealPlanService.createMealPlan({
        date,
        mealType,
        recipeId: selectedRecipe.id,
        notes: notes.trim() || undefined,
      });
      onCreated();
      onClose();
      setSelectedRecipe(null);
      setNotes('');
      setSearchQuery('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error creating meal plan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1b1e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Add {MEAL_LABELS[mealType]}</h3>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <FiX size={20} className="text-gray-400" />
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        {selectedRecipe ? (
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-4">
            <img
              src={selectedRecipe.primaryImage?.url || '/images/recipes/Custard.png'}
              alt={selectedRecipe.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{selectedRecipe.title}</p>
              <p className="text-[10px] text-orange-400">{selectedRecipe.author?.username}</p>
            </div>
            <button onClick={() => setSelectedRecipe(null)} className="p-1 hover:bg-white/10 rounded-full">
              <FiX size={16} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-3 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-orange-500/50 transition-colors"
                autoFocus
              />
              {searching && <span className="absolute right-3 top-3 loading loading-spinner loading-xs text-orange-400" />}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 mb-4 max-h-48">
              {recipes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRecipe(r); setSearchQuery(''); setRecipes([]); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <img
                    src={r.primaryImage?.url || '/images/recipes/Custard.png'}
                    alt={r.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.title}</p>
                    <p className="text-[10px] text-gray-500">{r.author?.username}</p>
                  </div>
                </button>
              ))}
              {searchQuery && !searching && recipes.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No recipes found.</p>
              )}
            </div>
          </>
        )}

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-orange-500/50 transition-colors resize-none mb-4"
        />

        <button
          onClick={handleSave}
          disabled={!selectedRecipe || saving}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <span className="loading loading-dots loading-sm" /> : 'Add to plan'}
        </button>
      </div>
    </div>
  );
};

export default AddMealPlan;
