import { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError } from '../error';
import { UserRole } from './auth.middleware';

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userRole = request.user?.role as UserRole | undefined;

    if (!userRole || !['ADMIN', 'MODERATOR'].includes(userRole)) {
        throw new ForbiddenError('Admin access required');
    }
}

export async function adminOnlyMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userRole = request.user?.role as UserRole | undefined;

    if (userRole !== 'ADMIN') {
        throw new ForbiddenError('Admin only access');
    }
}

export async function superAdminOnlyMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const isSuperAdmin = request.user?.isSuperAdmin;

    if (!isSuperAdmin) {
        throw new ForbiddenError('Super Admin access required');
    }
}
