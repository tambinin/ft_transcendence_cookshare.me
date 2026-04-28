import { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../error';
import { ZodError } from 'zod';

// Utilise un type plus flexible pour la compatibilité entre versions de Zod
type ZodSchemaLike = {
    parse: (data: unknown) => unknown;
};

export function bodyValidator(schema: ZodSchemaLike) {
    return async (
        request: FastifyRequest,
        reply: FastifyReply
    ) => {
        try {
            request.body = schema.parse(request.body);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ValidationError(
                    'Validation failed', error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message,
                        code: issue.code
                    }))
                );
            }
            throw error;
        }
    }
}


export function queryValidator(schema: ZodSchemaLike) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            request.query = schema.parse(request.query) as any;
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ValidationError('Invalid query parameters', error.issues);
            }
            throw error;
        }
    };
}

export function paramValidator(schema: ZodSchemaLike) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            request.params = schema.parse(request.params) as any;
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ValidationError('Invalid URL parameters', error.issues);
            }
            throw error;
        }
    };
}