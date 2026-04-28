import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationError, ValidationError } from '../error';
import { isPrismaError, prismaErrorHandler } from '../error/prisma-error-handler';

export function globalErrorHandler(
    error: FastifyError | ApplicationError | Error,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    request.log.error(error);
    
    if (isPrismaError(error)) {
        const appError = prismaErrorHandler(error);
        return reply.status(appError.statusCode).send({
            status: 'error',
            message: appError.message,
            code: appError.code
        });
    }

    if (error instanceof ApplicationError) {
        return reply.status(error.statusCode).send({
            status: 'error',
            message: error.message,
            code: error.code
        });
    }

    if (error instanceof ValidationError) {
        return reply.status(error.statusCode).send({
            status: 'error',
            message: error.message,
            errors: error.errors
        });
    }

    if ('validation' in error && error.validation) {
        return reply.status(400).send({
            status: 'error',
            message: 'Validation Error',
            errors: error.validation
        });
    }

    return reply.status(500).send({
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    });
}