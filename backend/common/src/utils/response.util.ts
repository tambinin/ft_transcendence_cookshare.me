import { FastifyReply } from 'fastify';

import { HttpStatus } from '../types/http-status.enum';
import { ApiResponse } from '../types/api-response.types';

export function sendSuccess<T>(
    reply: FastifyReply,
    data: T,
    message?: string,
    statusCode: number = HttpStatus.OK,
): void {
    reply.status(statusCode).send({
        status: 'success',
        message,
        data
    } as ApiResponse<T>);
}

export function sendCreated<T>(
    reply: FastifyReply,
    data: T,
    message: string = 'Resource created successfully'
): void {
    sendSuccess(reply, data, message, HttpStatus.CREATED);
}

export function sendUpdated<T>(
    reply: FastifyReply,
    data: T,
    message: string = 'Resource updated successfully'
): void {
    sendSuccess(reply, data, message, HttpStatus.OK);
}

export function sendDeleted<T>(
    reply: FastifyReply,
    data: T,
    message: string = 'Resource deleted successfully'
): void {
    sendSuccess(reply, data, message, HttpStatus.OK);
}

export function sendError(
    reply: FastifyReply,
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errors?: any[]
): void {
    reply.status(statusCode).send({
        status: 'error',
        message,
        errors
    } as ApiResponse);
}

export function sendPaginated<T>(
    reply: FastifyReply,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
): void {
    reply.status(HttpStatus.OK).send({
        status: 'success',
        message,
        data,
        meta: {
            page,
            limit,
            total
        }
    } as ApiResponse<T[]>);
}

export function sendBadRequest(
    reply: FastifyReply,
    message: string = 'Bad Request',
    errors?: any[]
): void {
    sendError(reply, message, HttpStatus.BAD_REQUEST, errors);
}

export function sendUnauthorized(
    reply: FastifyReply,
    message: string = 'Unauthorized'
): void {
    sendError(reply, message, HttpStatus.UNAUTHORIZED);
}

export function sendForbidden(
    reply: FastifyReply,
    message: string = 'Forbidden'
): void {
    sendError(reply, message, HttpStatus.FORBIDDEN);
}

export function sendNotFound(
    reply: FastifyReply,
    message: string = 'Resource not found'
): void {
    sendError(reply, message, HttpStatus.NOT_FOUND);
}

export function sendConflict(
    reply: FastifyReply,
    message: string = 'Conflict'
): void {
    sendError(reply, message, HttpStatus.CONFLICT);
}