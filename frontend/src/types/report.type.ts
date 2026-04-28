import type { ApiResponse } from './api.type';

export type ReportReason = 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'HARASSMENT' | 'COPYRIGHT' | 'MISLEADING' | 'OTHER';

export type ReportTargetType = 'RECIPE' | 'COMMENT';

export interface Report {
	id: string;
	reporterId: string;
	targetType: ReportTargetType;
	targetId: string;
	reason: ReportReason;
	description?: string | null;
	status: string;
	createdAt: string;
}

export interface CreateReportData {
	reason: ReportReason;
	description?: string;
}

export type ReportResponse = ApiResponse<Report>;
