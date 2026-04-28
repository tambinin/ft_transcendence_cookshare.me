export interface ApiResponse<T = unknown> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}

export interface PaginatedResponse<T> {
	status: 'success' | 'error';
	data: T[];
	meta: PaginationMeta;
}

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	pages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface ApiError {
	status: 'error';
	message: string;
	code?: string;
	details?: Record<string, unknown>;
}
