import api from './api.client';
import { MEAL_PLAN } from '../constants/mealplan.const';
import type { MealPlanResponse, MealPlanListResponse, CreateMealPlanData, UpdateMealPlanData } from '../types/mealplan.type';

const mealPlanService = {
  async getMealPlans(startDate?: string, endDate?: string): Promise<MealPlanListResponse> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    const response = await api.get<MealPlanListResponse>(`${MEAL_PLAN.BASE}${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getMealPlanByDate(date: string): Promise<MealPlanListResponse> {
    const response = await api.get<MealPlanListResponse>(MEAL_PLAN.BY_DATE(date));
    return response.data;
  },

  async createMealPlan(data: CreateMealPlanData): Promise<MealPlanResponse> {
    const response = await api.post<MealPlanResponse>(MEAL_PLAN.BASE, data);
    return response.data;
  },

  async updateMealPlan(id: string, data: UpdateMealPlanData): Promise<MealPlanResponse> {
    const response = await api.put<MealPlanResponse>(MEAL_PLAN.BY_ID(id), data);
    return response.data;
  },

  async deleteMealPlan(id: string): Promise<void> {
    await api.delete(MEAL_PLAN.BY_ID(id));
  },
};

export default mealPlanService;
