export interface ApiSuccessResponse<T = any> {
    status: 'success';
    message?: string;
    data: T;
    meta?: PaginationMeta;
}

export interface ApiErrorResponse {
    status: 'error';
    message: string;
    code?: string;
    errors?: ValidationErrorDetail[];
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ValidationErrorDetail {
    field: string;
    message: string;
    code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;