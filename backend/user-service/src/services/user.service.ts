import db from "../utils/dbPlugin";
import type { AuthProvider } from "../generated/prisma";
import {
    hashPassword,
    isValidEmail,
    BadRequestError,
    NotFoundError
} from "@transcendence/common";
import bcrypt from "bcrypt";
import crypto, { randomBytes } from "crypto";
import { MultipartFile } from "@fastify/multipart";
import {
    uploadImageFromBuffer,
    deleteImage,
    getThumbnailUrl
} from "./cloudinary.service";

export async function createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    bio?: string;
}, avatarFile?: { buffer: Buffer, filename: string, mimetype: string }) {
    const isSafeEmail = await isValidEmail(data.email);
    if (!isSafeEmail) {
        throw new BadRequestError("Invalid email or email address doesn't exist");
    }

    if (data.password.length < 8 || data.password.length > 142) {
        throw new BadRequestError("Password must be between 8 and 142 characters");
    }

    const hashedPassword = await hashPassword(data.password);

    let finalAvatarUrl = data.avatarUrl;

    if (avatarFile) {
        const buffer = avatarFile.buffer;
        const result = await uploadImageFromBuffer(buffer, {
            folder: 'avatars',
            publicId: `avatar_${Date.now()}_${data.username}`,
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });
        finalAvatarUrl = result.secureUrl;
    }
    const assignedRole = (data as any).role || 'USER';

    const isSuperAdmin = false;

    const user = await db.user.create({
        data: {
            ...data,
            password: hashedPassword,
            avatarUrl: finalAvatarUrl,
            role: assignedRole,
            isSuperAdmin: isSuperAdmin
        } as any
    });
    return user;
}

export async function getAllUsers() {
    const users = await db.user.findMany();
    return users;
}

export async function getAdmins() {
    return await db.user.findMany({
        where: {
            OR: [
                { role: 'ADMIN' },
                { role: 'MODERATOR' }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getUserById(id: string) {
    const user = await db.user.findUnique({ where: { id } });
    return user;
}

export async function updateUser(id: string, data: {
    username?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    bio?: string;
}, avatarFile?: { buffer: Buffer, filename: string, mimetype: string }) {

    if (avatarFile) {
        const buffer = avatarFile.buffer;
        const result = await uploadImageFromBuffer(buffer, {
            folder: 'avatars',
            publicId: `avatar_${id}`,
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });
        data.avatarUrl = result.secureUrl;
    }

    const user = await db.user.update({
        where: { id },
        data: {
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            avatarUrl: data.avatarUrl,
            bio: data.bio
        }
    });
    return user;
}

export async function updateUserRole(id: string, role: 'USER' | 'MODERATOR' | 'ADMIN') {
    const userToUpdate = await db.user.findUnique({ where: { id } });
    if (!userToUpdate) {
        throw new NotFoundError("User not found");
    }

    if ((userToUpdate as any).isSuperAdmin && role !== 'ADMIN') {
        throw new BadRequestError("Cannot demote the Super Admin via role update");
    }

    let isSuperAdmin = (userToUpdate as any).isSuperAdmin;
    if (role === 'ADMIN' && !isSuperAdmin) {
        const superAdminExists = await db.user.count({ where: { isSuperAdmin: true } } as any) > 0;
        if (!superAdminExists) {
            isSuperAdmin = true;
        }
    }

    const user = await db.user.update({
        where: { id },
        data: {
            role,
            isSuperAdmin
        } as any
    });
    return user;
}

export async function promoteUser(id: string, role: 'ADMIN' | 'MODERATOR') {
    if (role === 'ADMIN') {
        const superAdminExists = await db.user.count({ where: { isSuperAdmin: true } } as any) > 0;

        return await db.user.update({
            where: { id },
            data: {
                role,
                isSuperAdmin: !superAdminExists
            } as any
        });
    }

    return await db.user.update({
        where: { id },
        data: { role } as any
    });
}

export async function demoteUser(id: string) {
    const user = await db.user.findUnique({ where: { id } });
    if (user && (user as any).isSuperAdmin) {
        throw new BadRequestError("Cannot demote the Super Admin");
    }
    return await db.user.update({
        where: { id },
        data: {
            role: 'USER',
            isSuperAdmin: false
        }
    });
}

export async function updateAvatar(userId: string, data: { buffer: Buffer, filename: string, mimetype: string }) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const buffer = data.buffer;
    const result = await uploadImageFromBuffer(buffer, {
        folder: 'avatars',
        publicId: `avatar_${userId}`,
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ]
    });

    const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
            avatarUrl: result.secureUrl
        }
    });

    return updatedUser;
}

export async function deleteUser(id: string) {
    const userToDelete = await db.user.findUnique({ where: { id } });
    if (userToDelete && (userToDelete as any).isSuperAdmin) {
        throw new BadRequestError("Cannot delete the Super Admin");
    }
    const user = await db.user.delete({ where: { id } });
    return user;
}

export async function getUsersByIds(ids: string[]) {
    const users = await db.user.findMany({
        where: { id: { in: ids } },
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            isOnline: true
        }
    });
    return users;
}

export async function getUserByIdentifier(identifier: string) {
    const user = await db.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });
    return user;
}

export async function searchUsers(query: string) {
    return await db.user.findMany({
        where: {
            OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
        },
        take: 20
    });
}

export async function getUserByEmailIdentifier(email: string) {
    const user = await db.user.findUnique({
        where: {
            email: email
        }
    });
    if (user) {
        const resetToken = crypto.randomBytes(64).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
        await db.passwordResetToken.create({
            data: {
                token: hashedToken,
                userId: user.id,
                expiresAt
            }
        });
        return { user, resetToken };
    }
    return null;
}

export async function verifyResetToken(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await db.passwordResetToken.findUnique({
        where: { token: hashedToken },
        include: { user: true }
    });
    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.used) {
        throw new BadRequestError("Invalid or expired reset token");
    }
    await db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
    });
    return resetToken.user;
}

export async function updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
}

export async function updateUserStatus(userId: string, isOnline: boolean) {
    return await db.user.update({
        where: { id: userId },
        data: {
            isOnline,
            lastSeenAt: isOnline ? null : new Date()
        }
    });
}
export async function changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
        throw new BadRequestError("Invalid old password");
    }

    if (newPass.length < 8 || newPass.length > 142) {
        throw new BadRequestError("Password must be between 8 and 142 characters");
    }

    const hashedPassword = await hashPassword(newPass);
    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
}

export async function createEmailVerificationToken(userId: string) {
    const token = crypto.randomBytes(64).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.emailVerificationToken.create({
        data: {
            token: hashedToken,
            userId,
            expiresAt
        }
    });
    return token;
}

export async function verifyEmailToken(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verificationToken = await db.emailVerificationToken.findUnique({
        where: { token: hashedToken },
        include: { user: true }
    });
    if (!verificationToken || verificationToken.expiresAt < new Date() || verificationToken.used) {
        throw new BadRequestError("Invalid or expired email verification token");
    }
    await db.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true }
    });
    await db.user.update({
        where: { id: verificationToken.userId },
        data: { isEmailVerified: true }
    });
    return verificationToken.user;
}

// ==================== OAUTH ====================

export async function getUserByGoogleId(googleId: string) {
	return await db.user.findUnique({
		where: { googleId },
		select: {
			id: true,
			username: true,
			email: true,
			role: true,
			isSuperAdmin: true,
			avatarUrl: true,
			provider: true,
			googleId: true,
		},
	});
}

export async function linkGoogleToUser(
	userId: string,
	data: { googleId: string; avatarUrl?: string }
) {
	const user = await db.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new NotFoundError("User not found");
	}

	const updateData: { googleId: string; provider: AuthProvider; avatarUrl?: string } = {
		googleId: data.googleId,
		provider: "GOOGLE",
	};

	// Only update avatar if user still has the default one
	if (data.avatarUrl && (!user.avatarUrl || user.avatarUrl === "/default-avatar.png")) {
		updateData.avatarUrl = data.avatarUrl;
	}

	return await db.user.update({
		where: { id: userId },
		data: updateData,
		select: {
			id: true,
			username: true,
			email: true,
			role: true,
			isSuperAdmin: true,
			avatarUrl: true,
			provider: true,
			googleId: true,
		},
	});
}

export async function createOAuthUser(data: {
	email: string;
	baseUsername: string;
	firstName?: string | null;
	lastName?: string | null;
	avatarUrl?: string | null;
	googleId: string;
	provider: AuthProvider;
	isEmailVerified: boolean;
}) {
	// Generate unique username
	let username: string;
	let attempts = 0;
	const maxAttempts = 10;
	do {
		username = `${data.baseUsername}${randomBytes(3).toString("hex")}`;
		try {
			const existing = await db.user.findUnique({ where: { username } });
			if (!existing) break;
		} catch (error) {
			// If error, continue to try again
		}
		attempts++;
	} while (attempts < maxAttempts);

	if (attempts >= maxAttempts) {
		throw new Error("Failed to generate unique username");
	}

	return await db.user.create({
		data: {
			email: data.email,
			username,
			password: "", // Added because password might be required in DB schema for local users (or was altered directly in db)
			firstName: data.firstName ?? undefined,
			lastName: data.lastName ?? undefined,
			avatarUrl: data.avatarUrl ?? "/default-avatar.png",
			googleId: data.googleId,
			provider: data.provider,
			isEmailVerified: data.isEmailVerified,
			role: "USER",
			isSuperAdmin: false,
		},
		select: {
			id: true,
			username: true,
			email: true,
			role: true,
			isSuperAdmin: true,
			avatarUrl: true,
			provider: true,
			googleId: true,
		},
	});
}

export async function unlinkGoogleFromUser(userId: string) {
	const user = await db.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new NotFoundError("User not found");
	}

	// Cannot unlink Google if user has no password (would lock them out)
	if (!user.password) {
		throw new BadRequestError("Cannot unlink Google — set a password first");
	}

	return await db.user.update({
		where: { id: userId },
		data: {
			googleId: null,
			provider: "LOCAL",
		},
		select: {
			id: true,
			username: true,
			email: true,
			role: true,
			isSuperAdmin: true,
			avatarUrl: true,
			provider: true,
			googleId: true,
		},
	});
}