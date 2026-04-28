import { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash2 } from 'react-icons/fi';
import mealPlanService from '../../services/mealplan.service';
import { onMealPlanUpdate } from '../../services/socket.service';
import recipeService from '../../services/recipe.service';
import { useRecipeModal } from '../../contexts/recipe.context';
import AddMealPlan from '../Modal/AddMealPlan';
import type { MealPlan, MealType } from '../../types/mealplan.type';
import type { RecipeResponse } from '../../types/recipe.type';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};


function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MealPlanFeed = () => {
  const { openRecipeModal } = useRecipeModal();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [recipesCache, setRecipesCache] = useState<Record<string, RecipeResponse>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalMealType, setModalMealType] = useState<MealType>('LUNCH');

  const weekEnd = addDays(weekStart, 6);

  const fetchMealPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mealPlanService.getMealPlans(formatDate(weekStart), formatDate(weekEnd));
      const data = Array.isArray(res.data) ? res.data : [];
      setMealPlans(data);

      // Fetch recipe details for all unique recipeIds not already cached
      const uniqueIds = [...new Set(data.map(mp => mp.recipeId))].filter(id => !recipesCache[id]);
      if (uniqueIds.length > 0) {
        const results = await Promise.allSettled(uniqueIds.map(id => recipeService.getRecipeById(id)));
        const newCache: Record<string, RecipeResponse> = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            newCache[uniqueIds[i]] = result.value;
          }
        });
        setRecipesCache(prev => ({ ...prev, ...newCache }));
      }
    } catch {
      setMealPlans([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchMealPlans(); }, [fetchMealPlans]);

  useEffect(() => {
    const off = onMealPlanUpdate(() => { fetchMealPlans(); });
    return off;
  }, [fetchMealPlans]);

  const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const handleToday = () => setWeekStart(getMonday(new Date()));

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await mealPlanService.deleteMealPlan(id);
      setMealPlans(prev => prev.filter(mp => mp.id !== id));
    } catch {
      setDeleteError('Delete failed. Try again.');
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const openAddModal = (date: string, mealType: MealType) => {
    setModalDate(date);
    setModalMealType(mealType);
    setModalOpen(true);
  };

  const getMealPlan = (date: string, mealType: MealType) =>
    mealPlans.find(mp => mp.date?.startsWith(date) && mp.mealType === mealType);

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const today = formatDate(new Date());

  return (
    <div className="w-full px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2 sm:mt-4">
        <h2 className="text-xl font-bold text-white">Menu</h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <FiChevronLeft size={18} className="text-gray-400" />
          </button>
          <button onClick={handleToday} className="px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors">
            Today
          </button>
          <button onClick={handleNextWeek} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <FiChevronRight size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{weekLabel}</p>

      {deleteError && (
        <p className="text-red-400 text-sm mb-3 animate-pulse">{deleteError}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-orange-400" />
        </div>
      ) : (
        <>
          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-7 gap-2">
            {/* Day headers */}
            {DAYS.map((day, i) => {
              const date = formatDate(addDays(weekStart, i));
              const isToday = date === today;
              return (
                <div key={day} className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${isToday ? 'text-orange-400' : 'text-gray-500'}`}>
                  {day}
                  <div className={`text-[10px] font-normal ${isToday ? 'text-orange-400/70' : 'text-gray-600'}`}>
                    {addDays(weekStart, i).getDate()}
                  </div>
                </div>
              );
            })}

            {/* Meal slots */}
            {MEAL_TYPES.map((mealType) => (
              DAYS.map((_, dayIdx) => {
                const date = formatDate(addDays(weekStart, dayIdx));
                const mp = getMealPlan(date, mealType);
                const isToday = date === today;
                const isPast = date < today;

                return (
                  <div
                    key={`${date}-${mealType}`}
                    className={`min-h-[80px] rounded-xl border p-2 flex flex-col transition-colors ${
                      isToday ? 'border-orange-500/20 bg-orange-500/5'
                        : isPast ? 'border-white/5 bg-white/[0.01] opacity-50'
                        : 'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-[9px] text-gray-500 mb-1">{MEAL_LABELS[mealType]}</span>
                    {mp ? (
                      <div className="flex-1 flex flex-col">
                        <button onClick={() => openRecipeModal(mp.recipeId)} className="flex-1 group text-left">
                          {recipesCache[mp.recipeId]?.images?.find(img => img.isPrimary)?.url && (
                            <img src={recipesCache[mp.recipeId]?.images?.find(img => img.isPrimary)?.url} loading="lazy" alt="" className="w-full h-10 object-cover rounded-md mb-1" />
                          )}
                          <p className="text-[11px] text-white font-medium line-clamp-2 group-hover:text-orange-400 transition-colors">
                            {recipesCache[mp.recipeId]?.title || 'Recipe'}
                          </p>
                        </button>
                        <button
                          onClick={() => handleDelete(mp.id)}
                          disabled={deletingId === mp.id}
                          className="mt-auto self-end p-1 text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !isPast && openAddModal(date, mealType)}
                        disabled={isPast}
                        className={`flex-1 flex items-center justify-center rounded-lg transition-colors ${
                          isPast
                            ? 'text-gray-700 cursor-not-allowed'
                            : 'text-gray-600 hover:text-orange-400 hover:bg-white/5'
                        }`}
                      >
                        <FiPlus size={16} />
                      </button>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          {/* Mobile: single column by day */}
          <div className="md:hidden space-y-4">
            {DAYS.map((day, i) => {
              const date = formatDate(addDays(weekStart, i));
              const isToday = date === today;
              const isPast = date < today;
              return (
                <div key={day} className={`rounded-xl border p-4 ${
                  isToday ? 'border-orange-500/20 bg-orange-500/5'
                    : isPast ? 'border-white/5 bg-white/[0.01] opacity-50'
                    : 'border-white/5 bg-white/[0.02]'
                }`}>
                  <h3 className={`text-sm font-bold mb-3 ${isToday ? 'text-orange-400' : 'text-white'}`}>
                    {day} {addDays(weekStart, i).getDate()}
                  </h3>
                  <div className="space-y-2">
                    {MEAL_TYPES.map((mealType) => {
                      const mp = getMealPlan(date, mealType);
                      return (
                        <div key={mealType} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                          <span className="text-sm w-20 shrink-0 text-gray-500">{MEAL_LABELS[mealType]}</span>
                          {mp ? (
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              {recipesCache[mp.recipeId]?.images?.find(img => img.isPrimary)?.url && (
                                <img src={recipesCache[mp.recipeId]?.images?.find(img => img.isPrimary)?.url} loading="lazy" alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                              )}
                              <button onClick={() => openRecipeModal(mp.recipeId)} className="text-sm text-white hover:text-orange-400 truncate transition-colors text-left">
                                {recipesCache[mp.recipeId]?.title || 'Recipe'}
                              </button>
                              <button onClick={() => handleDelete(mp.id)} disabled={deletingId === mp.id} className="ml-auto shrink-0 p-1 text-gray-600 hover:text-red-400">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => !isPast && openAddModal(date, mealType)}
                              disabled={isPast}
                              className={`text-xs transition-colors flex items-center gap-1 ${
                                isPast
                                  ? 'text-gray-700 cursor-not-allowed'
                                  : 'text-gray-600 hover:text-orange-400'
                              }`}
                            >
                              <FiPlus size={14} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddMealPlan
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchMealPlans}
        date={modalDate}
        mealType={modalMealType}
      />
    </div>
  );
};

export default MealPlanFeed;
