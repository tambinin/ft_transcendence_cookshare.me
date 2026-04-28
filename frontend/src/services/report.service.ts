import api from './api.client';
import { REPORT } from '../constants/report.const';
import type { ReportResponse, CreateReportData } from '../types/report.type';

const reportService = {
	async reportRecipe(recipeId: string, data: CreateReportData): Promise<ReportResponse> {
		const response = await api.post<ReportResponse>(REPORT.RECIPE(recipeId), data);
		return response.data;
	},

	async reportComment(commentId: string, data: CreateReportData): Promise<ReportResponse> {
		const response = await api.post<ReportResponse>(REPORT.COMMENT(commentId), data);
		return response.data;
	},
};

export default reportService;
