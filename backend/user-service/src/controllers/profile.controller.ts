import { FastifyRequest, FastifyReply } from "fastify";
import type { AuthProvider } from "../generated/prisma";
import db from "../utils/dbPlugin";
import {
    createEmailVerificationToken,
    createUser,
    deleteUser,
    getAllUsers,
    searchUsers,
    getUserByEmailIdentifier,
    getUserById,
    getUserByIdentifier,
    getUsersByIds,
    updatePassword,
    updateUser,
    updateUserRole,
    getAdmins,
    promoteUser,
    demoteUser,
    updateAvatar,
    changePassword,
    verifyResetToken,
    verifyEmailToken,
    updateUserStatus,
    getUserByGoogleId,
    linkGoogleToUser,
    createOAuthUser,
    unlinkGoogleFromUser,
} from "../services/user.service";
import {
    exportUserData,
    requestAccountDeletion,
    confirmAccountDeletion
} from "../services/gdpr.service";
import {
    sendSuccess,
    sendCreated,
    sendDeleted,
    stripPassword,
    generateApiKey,
    NotFoundError,
    BadRequestError,
    ForbiddenError,
    InternalServerError
} from "@transcendence/common";
import { z } from "zod";

// ==================== SCHEMAS ====================

export const createUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    password: z.string().min(8, "Password must be at least 8 characters").max(142),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional()
});

export const updateUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional()
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(142)
});

export const tokenSchema = z.object({
    token: z.string().min(1, "Token is required")
});

export const updatePasswordSchema = z.object({
    userId: z.string().min(1),
    newPassword: z.string().min(8).max(142)
});

export const userIdSchema = z.object({
    userId: z.string().min(1)
});

export const statusSchema = z.object({
    isOnline: z.boolean()
});

export const updateRoleSchema = z.object({
    role: z.enum(['USER', 'MODERATOR', 'ADMIN'])
});

export const setRoleSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['USER', 'MODERATOR', 'ADMIN'])
});

// ==================== USER CRUD ====================

export async function getAllUsersHandler(request: FastifyRequest, reply: FastifyReply) {
    const users = await getAllUsers();
    sendSuccess(reply, users.map(stripPassword), 'Users retrieved successfully');
}

export async function searchUsersHandler(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { q: string | string[] };
    const q = Array.isArray(query.q) ? query.q[0] : query.q;

    if (!q) {
        return sendSuccess(reply, [], 'No search query provided');
    }
    const users = await searchUsers(q);
    sendSuccess(reply, users, 'Users search completed successfully');
}

export async function getUserByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await getUserById(id);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    sendSuccess(reply, stripPassword(user), 'User retrieved successfully');
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: any = {};
    let fileBuffer: Buffer | null = null;
    let fileName: string | undefined;
    let mimeType: string | undefined;

    if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
            if (part.type === 'file') {
                if (part.filename) {
                    fileBuffer = await part.toBuffer();
                    fileName = part.filename;
                    mimeType = part.mimetype;
                }
            } else {
                const value = part.value;
                if (value !== undefined && value !== null && value !== '') {
                    body[part.fieldname] = value;
                }
            }
        }
    } else {
        body = request.body || {};
    }

    const fileData = fileBuffer ? { buffer: fileBuffer, filename: fileName!, mimetype: mimeType! } : undefined;

    const validatedBody = createUserSchema.parse(body);
    const user = await createUser(validatedBody, fileData);
    sendCreated(reply, stripPassword(user), 'User created');
}

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const user = await getUserById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    sendSuccess(reply, stripPassword(user), 'Profile retrieved successfully');
}

export async function updateUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    if (request.user!.id !== id) {
        throw new ForbiddenError('You can only update your own profile');
    }

    let body: any = {};
    let fileBuffer: Buffer | null = null;
    let fileName: string | undefined;
    let mimeType: string | undefined;

    if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
            if (part.type === 'file') {
                if (part.filename) {
                    fileBuffer = await part.toBuffer();
                    fileName = part.filename;
                    mimeType = part.mimetype;
                }
            } else {
                const value = part.value;
                if (value !== undefined && value !== null && value !== '') {
                    body[part.fieldname] = value;
                }
            }
        }
    } else {
        body = request.body || {};
    }

    const fileData = fileBuffer ? { buffer: fileBuffer, filename: fileName!, mimetype: mimeType! } : undefined;

    const validatedBody = updateUserSchema.parse(body);
    const user = await updateUser(id, validatedBody, fileData);
    sendSuccess(reply, stripPassword(user), 'User updated successfully');
}

export async function deleteUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    if (request.user!.id !== id) {
        throw new ForbiddenError('You can only delete your own profile');
    }
    const user = await deleteUser(id);
    sendDeleted(reply, stripPassword(user), 'User deleted successfully');
}

export async function updateUserRoleHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { role } = request.body as z.infer<typeof updateRoleSchema>;

    const existingUser = await getUserById(id);
    if (!existingUser) {
        throw new NotFoundError('User not found');
    }

    if (existingUser.role === 'ADMIN' || existingUser.role === 'MODERATOR') {
        const superAdminExists = await db.user.count({ where: { isSuperAdmin: true } } as any) > 0;
        const isSelf = request.user?.id === id;

        if (!superAdminExists && request.user?.role === 'ADMIN') {
        } else if (!request.user?.isSuperAdmin) {
            throw new ForbiddenError('Only Super Admin can change existing admin/moderator roles');
        }
    }

    const updatedUser = await updateUserRole(id, role);
    sendSuccess(reply, stripPassword(updatedUser), 'User role updated successfully');
}

export async function getAdminsHandler(request: FastifyRequest, reply: FastifyReply) {
    const admins = await getAdmins();
    sendSuccess(reply, admins.map(stripPassword), 'Admins retrieved successfully');
}

export async function promoteUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { role } = request.body as { role: 'ADMIN' | 'MODERATOR' };

    if (!['ADMIN', 'MODERATOR'].includes(role)) {
        throw new BadRequestError('Invalid role for promotion');
    }

    const user = await promoteUser(id, role);
    sendSuccess(reply, stripPassword(user), `User promoted to ${role} successfully`);
}

export async function demoteUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await demoteUser(id);
    sendSuccess(reply, stripPassword(user), 'User demoted to USER successfully');
}

export async function setUserRoleHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId, role } = request.body as z.infer<typeof setRoleSchema>;

    const existingUser = await getUserById(userId);
    if (!existingUser) {
        throw new NotFoundError('User not found');
    }

    if (existingUser.role === 'ADMIN' || existingUser.role === 'MODERATOR') {
        const superAdminExists = await db.user.count({ where: { isSuperAdmin: true } } as any) > 0;
        const isSelf = request.user?.id === userId;

        if (!superAdminExists && request.user?.role === 'ADMIN') {
        } else if (!request.user?.isSuperAdmin) {
            throw new ForbiddenError('Only Super Admin can change existing admin/moderator roles');
        }
    }

    const updatedUser = await updateUserRole(userId, role);
    sendSuccess(reply, stripPassword(updatedUser), 'User role set successfully');
}

// ==================== AVATAR & PASSWORD ====================

export async function updateAvatarHandler(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) {
        throw new BadRequestError("No image uploaded");
    }
    const buffer = await data.toBuffer();
    const fileData = { buffer, filename: data.filename, mimetype: data.mimetype };

    const userId = request.user!.id;
    const user = await updateAvatar(userId, fileData);
    sendSuccess(reply, stripPassword(user), "Avatar updated successfully");
}

export async function changePasswordHandler(request: FastifyRequest, reply: FastifyReply) {
    const { oldPassword, newPassword } = request.body as z.infer<typeof changePasswordSchema>;
    const userId = request.user!.id;
    await changePassword(userId, oldPassword, newPassword);
    sendSuccess(reply, {}, "Password changed successfully");
}

// ==================== INTERNAL ROUTES ====================

export async function internalGetBatchUsersHandler(request: FastifyRequest, reply: FastifyReply) {
    const { ids } = request.query as { ids: string };
    const splittedIds = ids.split(",");
    const users = await getUsersByIds(splittedIds);
    sendSuccess(reply, users.map(stripPassword), 'Users retrieved successfully');
}

export async function internalGetUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await getUserById(id);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    sendSuccess(reply, { id: user.id, username: user.username, role: user.role }, 'User retrieved successfully');
}

export async function internalGetUserByIdentifierHandler(request: FastifyRequest, reply: FastifyReply) {
    const { identifier } = request.params as { identifier: string };
    const user = await getUserByIdentifier(identifier);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    sendSuccess(reply, user, 'User retrieved successfully');
}

export async function internalVerifyResetTokenHandler(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.body as z.infer<typeof tokenSchema>;
    const user = await verifyResetToken(token);
    sendSuccess(reply, user, 'Token verified successfully');
}

export async function internalUpdatePasswordHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId, newPassword } = request.body as z.infer<typeof updatePasswordSchema>;
    await updatePassword(userId, newPassword);
    sendSuccess(reply, {}, 'Password updated successfully');
}

export async function internalGetUserByEmailHandler(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.params as { email: string };
    const user = await getUserByEmailIdentifier(email);
    sendSuccess(reply, user, 'User retrieved successfully');
}

export async function internalCreateVerificationTokenHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request.body as z.infer<typeof userIdSchema>;
    const verificationToken = await createEmailVerificationToken(userId);
    sendSuccess(reply, { verificationToken }, 'Verification token created successfully');
}

export async function internalVerifyEmailTokenHandler(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.body as z.infer<typeof tokenSchema>;
    const user = await verifyEmailToken(token);
    sendSuccess(reply, user, 'Email verified successfully');
}

export async function internalUpdateUserStatusHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { isOnline } = request.body as z.infer<typeof statusSchema>;
    const user = await updateUserStatus(id, isOnline);
    sendSuccess(reply, { id: user.id, isOnline: user.isOnline }, 'User status updated successfully');
}

// ==================== API KEY ====================

export async function generateApiKeyHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const user = await getUserById(userId);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    if (!user.isEmailVerified) {
        throw new ForbiddenError('Email must be verified to generate an API key');
    }

    const masterSecret = process.env.API_MASTER_SECRET;
    if (!masterSecret) {
        throw new InternalServerError('API_MASTER_SECRET not configured');
    }

    const apiKey = generateApiKey(userId, masterSecret);

    sendCreated(reply, {
        apiKey,
        userId,
        message: 'Store this API key securely. It will not be shown again.',
        usage: {
            header: 'x-gateway-api-key',
            example: `curl -H "x-gateway-api-key: ${apiKey}" https://cookshare.me/api/v1/recipes`
        }
    }, 'API Key generated');
}

// ==================== GDPR ====================

export async function exportUserDataHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const requestingUserId = (request as any).user?.id;

    if (id !== requestingUserId) {
        throw new ForbiddenError("You can only export your own data");
    }

    const data = await exportUserData(id);
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}.json"`);
    sendSuccess(reply, data, 'User data exported successfully');
}

export async function requestDeletionHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const requestingUserId = (request as any).user?.id;

    if (id !== requestingUserId) {
        throw new ForbiddenError("You can only request deletion of your own account");
    }

    const result = await requestAccountDeletion(id);

    sendSuccess(reply, {
        message: 'Account deletion requested. Please check your email to confirm.',
        _devToken: result.token
    }, 'Deletion request created');
}

export async function confirmDeletionHandler(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.body as { token: string };
    const result = await confirmAccountDeletion(token);
    sendDeleted(reply, { email: result.email }, 'Account and all associated data have been permanently deleted');
}

// ==================== INTERNAL OAUTH ROUTES ====================

export async function internalGetUserByGoogleIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { googleId } = request.params as { googleId: string };
    const user = await getUserByGoogleId(googleId);
    if (!user) {
        throw new NotFoundError("User not found");
    }
    sendSuccess(reply, user, "User retrieved successfully");
}

export async function internalLinkGoogleHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { googleId, avatarUrl } = request.body as { googleId: string; avatarUrl?: string };
    const user = await linkGoogleToUser(id, { googleId, avatarUrl });
    sendSuccess(reply, user, "Google account linked successfully");
}

export async function internalCreateOAuthUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
        email: string;
        baseUsername: string;
        firstName?: string | null;
        lastName?: string | null;
        avatarUrl?: string | null;
        googleId: string;
        provider: AuthProvider;
        isEmailVerified: boolean;
    };
    const user = await createOAuthUser(body);
    sendCreated(reply, user, "OAuth user created successfully");
}

export async function internalUnlinkGoogleHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await unlinkGoogleFromUser(id);
    sendSuccess(reply, user, "Google account unlinked successfully");
}
