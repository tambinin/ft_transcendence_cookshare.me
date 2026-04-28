import type { ApiResponse } from './api.type';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface MealPlan {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  recipeId: string;
  notes: string | null;
  recipe?: {
    id: string;
    title: string;
    slug: string;
    primaryImage?: { url: string } | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealPlanData {
  date: string;
  mealType: MealType;
  recipeId: string;
  notes?: string;
}

export interface UpdateMealPlanData {
  recipeId?: string;
  notes?: string;
}

export type MealPlanResponse = ApiResponse<MealPlan>;
export type MealPlanListResponse = ApiResponse<MealPlan[]>;
