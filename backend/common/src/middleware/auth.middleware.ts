import { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../error';
import '@fastify/jwt';

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface JwtSignPayload {
    id: string;
    username: string;
    role: UserRole;
    isSuperAdmin: boolean;
}

export interface JwtPayload extends JwtSignPayload {
    iat: number;
    exp: number;
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtSignPayload | JwtPayload;
        user: JwtPayload;
    }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedError('Missing Authorization header');
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            throw new UnauthorizedError('Invalid Authorization header format');
        }

        await request.jwtVerify();
    }
    catch (error: any) {
        if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
            throw new UnauthorizedError('Missing Authorization header');
        }
        if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
            throw new UnauthorizedError('Token expired');
        }
        if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
            throw new UnauthorizedError('Invalid token');
        }
        if (error instanceof UnauthorizedError) {
            throw error;
        }
        throw new UnauthorizedError('Authentication failed');
    }
}