import { 
    ConflictError,
    NotFoundError,
    BadRequestError,
    InternalServerError,
    ApplicationError
} from "./index";

export function isPrismaError(error: any): boolean {
    return error?.code?.startsWith('P');
}

export function prismaErrorHandler(error: any): ApplicationError {
    const code = error.code;
    const meta = error.meta;
    
    switch (code) {
        case 'P2002':
            {
                const target = meta?.target;
                const field = Array.isArray(target) ? target.join(', ') : target || 'field';
                return new ConflictError(`${field} already exists`, 'DUPLICATE_ENTRY');
            }
        case 'P2001':
            {
                return new NotFoundError('Record does not exist', 'NOT_FOUND');
            }
        case 'P2025':
            {
                return new NotFoundError('Record Not Found', 'NOT_FOUND');
            }
        case 'P2003':
            {
                const field = meta?.field_name || 'relation';
                return new ConflictError(`Invalid reference: ${field}`, 'FOREIGN_KEY_VIOLATION');
            }
        case 'P2000':
            {
                return new BadRequestError('Value too long for column', 'VALUE_TOO_LONG');
            }
        case 'P2014':
            {
                return new BadRequestError('Required relation violation', 'REQUIRED_RELATION');
            }
        case 'P2021':
        case 'P2024':
            {
                return new InternalServerError('Database error', 'DATABASE_ERROR');
            }
        default:
            {
                console.error('Prisma error code:', code, 'Full error:', JSON.stringify(error, null, 2));
                return new InternalServerError(error.message || 'Database error', 'DATABASE_ERROR');
            }
    }
}

