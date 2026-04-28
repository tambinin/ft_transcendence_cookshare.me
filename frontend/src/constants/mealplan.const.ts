export const MEAL_PLAN = {
  BASE: 'meal-plans',
  BY_DATE: (date: string) => `meal-plans/${date}`,
  BY_ID: (id: string) => `meal-plans/${id}`,
} as const;
