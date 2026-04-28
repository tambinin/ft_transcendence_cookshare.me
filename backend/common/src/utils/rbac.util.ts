import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError } from './response.util';
import { HttpStatus } from '../types/http-status.enum';

export enum Role {
    GUEST = 'GUEST',
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN'
}

export enum Permission {
    READ_RECIPE = 'read:recipe',
    CREATE_RECIPE = 'create:recipe',
    UPDATE_RECIPE = 'update:recipe',
    DELETE_RECIPE = 'delete:recipe',
    PUBLISH_RECIPE = 'publish:recipe',

    READ_USER = 'read:user',
    UPDATE_USER = 'update:user',
    DELETE_USER = 'delete:user',
    MANAGE_USERS = 'manage:users',

    CREATE_COMMENT = 'create:comment',
    UPDATE_COMMENT = 'update:comment',
    DELETE_COMMENT = 'delete:comment',
    MODERATE_COMMENTS = 'moderate:comments',

    ACCESS_ADMIN = 'access:admin',
    VIEW_ANALYTICS = 'view:analytics',
    MANAGE_SYSTEM = 'manage:system'
}

const rolePermissions: Record<Role, Permission[]> = {
    [Role.GUEST]: [
        Permission.READ_RECIPE,
        Permission.READ_USER
    ],
    [Role.USER]: [
        Permission.READ_RECIPE,
        Permission.CREATE_RECIPE,
        Permission.UPDATE_RECIPE,
        Permission.DELETE_RECIPE,
        Permission.PUBLISH_RECIPE,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.CREATE_COMMENT,
        Permission.UPDATE_COMMENT,
        Permission.DELETE_COMMENT
    ],
    [Role.MODERATOR]: [
        Permission.READ_RECIPE,
        Permission.CREATE_RECIPE,
        Permission.UPDATE_RECIPE,
        Permission.DELETE_RECIPE,
        Permission.PUBLISH_RECIPE,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.CREATE_COMMENT,
        Permission.UPDATE_COMMENT,
        Permission.DELETE_COMMENT,
        Permission.MODERATE_COMMENTS,
        Permission.VIEW_ANALYTICS
    ],
    [Role.ADMIN]: Object.values(Permission)
};

export function hasPermission(role: Role, permission: Permission): boolean {
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

export function getRolePermissions(role: Role): Permission[] {
    return rolePermissions[role] || [];
}

export function requirePermission(...requiredPermissions: Permission[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user;

        if (!user) {
            return sendError(reply, 'Authentication required', HttpStatus.UNAUTHORIZED);
        }

        const userRole = (user.role as Role) || Role.USER;

        if (!hasAllPermissions(userRole, requiredPermissions)) {
            return sendError(
                reply,
                'Insufficient permissions',
                HttpStatus.FORBIDDEN
            );
        }
    };
}

export function requireAnyPermission(...requiredPermissions: Permission[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user;

        if (!user) {
            return sendError(reply, 'Authentication required', HttpStatus.UNAUTHORIZED);
        }

        const userRole = (user.role as Role) || Role.USER;

        if (!hasAnyPermission(userRole, requiredPermissions)) {
            return sendError(
                reply,
                'Insufficient permissions',
                HttpStatus.FORBIDDEN
            );
        }
    };
}

export function requireRole(...allowedRoles: Role[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user;

        if (!user) {
            return sendError(reply, 'Authentication required', HttpStatus.UNAUTHORIZED);
        }

        const userRole = (user.role as Role) || Role.USER;

        if (!allowedRoles.includes(userRole)) {
            return sendError(
                reply,
                'Access denied',
                HttpStatus.FORBIDDEN
            );
        }
    };
}

export function canAccessResource(userId: string, resourceOwnerId: string, userRole: Role): boolean {
    return userId === resourceOwnerId || userRole === Role.ADMIN || userRole === Role.MODERATOR;
}

export function requireOwnershipOrRole(getResourceOwnerId: (request: FastifyRequest) => Promise<string | null>, ...allowedRoles: Role[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user;

        if (!user) {
            return sendError(reply, 'Authentication required', HttpStatus.UNAUTHORIZED);
        }

        const userRole = (user.role as Role) || Role.USER;

        if (allowedRoles.includes(userRole)) {
            return;
        }

        const resourceOwnerId = await getResourceOwnerId(request);

        if (!resourceOwnerId || resourceOwnerId !== user.id) {
            return sendError(
                reply,
                'Access denied',
                HttpStatus.FORBIDDEN
            );
        }
    };
}
