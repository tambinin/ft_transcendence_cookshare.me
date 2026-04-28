export class ApplicationError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode: number = 500,
        code?: string,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends ApplicationError {
    constructor(message: string = 'Bad Request', code?: string) {
        super(message, 400, code);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}

export class UnauthorizedError extends ApplicationError {
    constructor(message: string = 'Unauthorized', code?: string) {
        super(message, 401, code);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ForbiddenError extends ApplicationError {
    constructor(message: string = 'Forbidden', code?: string) {
        super(message, 403, code);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class NotFoundError extends ApplicationError {
    constructor(message: string = 'Not Found', code?: string) {
        super(message, 404, code);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class ConflictError extends ApplicationError {
    constructor(message: string = 'Conflict', code?: string) {
        super(message, 409, code);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export class ValidationError extends ApplicationError {
    public readonly errors?: any[];
    constructor(message: string = 'Validation Error', errors?: any[]) {
        super(message, 422, 'VALIDATION_ERROR');
        this.errors = errors;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class InternalServerError extends ApplicationError {
    constructor(message: string = 'Internal Server Error', code?: string) {
        super(message, 500, code);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}