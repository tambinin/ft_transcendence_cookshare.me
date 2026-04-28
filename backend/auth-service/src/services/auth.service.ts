import { hashPassword, comparePassword, verifyPassword, isValidEmail, UnauthorizedError, fetchWithTimeout } from "@transcendence/common";
import { BadRequestError } from "@transcendence/common";
import { PrismaClient } from "../generated/prisma";
import { randomBytes, createHash } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import pino from "pino";

const logger = pino({ name: 'auth-service' });

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${process.env.USER_SERVICE_PORT || 3004}`;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `https://notification:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`;

const AUTH_DATABASE_URL = process.env.AUTH_DATABASE_URL;

if (!AUTH_DATABASE_URL) {
    throw new Error("AUTH_DATABASE_URL is not defined");
}

const dbUrl = new URL(AUTH_DATABASE_URL);
const schema = dbUrl.searchParams.get('schema') || 'public';

const pool = new Pool({
    connectionString: AUTH_DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter: new PrismaPg(pool, { schema }),
});

if (!USER_SERVICE_URL) {
    throw new Error("USER_SERVICE_URL is not defined");
}

if (!INTERNAL_API_KEY) {
    throw new Error("INTERNAL_API_KEY is not defined");
}

export async function registerUser(userData: any, avatarFile?: { buffer: Buffer, filename: string, mimetype: string }) {
    const isSafeEmail = await isValidEmail(userData.email);
    if (!isSafeEmail) {
        throw new BadRequestError("Invalid email or email address doesn't exist");
    }

    const path = "/api/v1/users";
    let response: Response;

    if (avatarFile) {
        const formData = new FormData();
        for (const key in userData) {
            if (userData[key] !== undefined) {
                formData.append(key, userData[key].toString());
            }
        }
        const buffer = avatarFile.buffer;
        formData.append('avatar', new Blob([buffer]), avatarFile.filename);

        response = await fetchWithTimeout(`${USER_SERVICE_URL}${path}`, {
            method: 'POST',
            headers: {
                'x-internal-api-key': INTERNAL_API_KEY as string
            },
            body: formData
        });
    } else {
        response = await fetchWithTimeout(`${USER_SERVICE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': INTERNAL_API_KEY as string
            },
            body: JSON.stringify(userData)
        });
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to register user");
    }

    if (result.data !== null && result.data.password) {
        const { password: _, ...userWithoutPassword } = result.data;
        result.data = userWithoutPassword;
    }

    const verificationResponse = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/create-verification-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': INTERNAL_API_KEY
        },
        body: JSON.stringify({ userId: result.data.id })
    });
    const verificationResult = await verificationResponse.json();
    if (verificationResult.status === 'success') {
        await fetchWithTimeout(`${NOTIFICATION_SERVICE_URL}/api/v1/internal/send-verification-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-api-key': INTERNAL_API_KEY
            },
            body: JSON.stringify({ email: result.data.email, verificationToken: verificationResult.data.verificationToken })
        });
    }

    return result.data;
}

export async function loginUser(credentials: any) {
    const { identifier, password } = credentials;
    const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/by-identifier/${identifier}`, {
        headers: {
            'x-internal-api-key': INTERNAL_API_KEY
        }
    });
    const result = await response.json();

    if (result.status === 'error') {
        throw new Error(result.message || "User not found");
    }

    const user = result.data;
    await verifyPassword(password, user.password, identifier);

    if (!user.isEmailVerified) {
        throw new UnauthorizedError("Please verify your email address before logging in");
    }

    const { password: _, ...userWithoutPassword } = user;
    const refreshToken = await createRefreshToken(user.id, user.username);
    return { ...userWithoutPassword, refreshToken };
}

export async function forgotPasswordByEmailIdentifier(email: string) {
    const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/by-email-identifier/${email}`, {
        headers: {
            'x-internal-api-key': INTERNAL_API_KEY
        }
    });
    const result = await response.json();

    if (result.status === 'error' || !result.data) {
        return;
    }

    const { user, resetToken } = result.data;
    await fetchWithTimeout(`${NOTIFICATION_SERVICE_URL}/api/v1/internal/send-reset-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': INTERNAL_API_KEY
        },
        body: JSON.stringify({ email: user.email, resetToken })
    });
}

export async function resetPassword(token: string, newPassword: string) {
    const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/verify-reset-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': INTERNAL_API_KEY
        },
        body: JSON.stringify({ token })
    });
    const result = await response.json();

    if (result.status === 'error') {
        throw new Error(result.message || "Invalid or expired reset token");
    }
    const user = result.data;
    const updateResponse = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/update-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': INTERNAL_API_KEY
        },
        body: JSON.stringify({ userId: user.id, newPassword })
    });

    if (!updateResponse.ok) {
        throw new Error('Failed to update password');
    }
}

export async function createRefreshToken(userId: string, username: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: { token: hashedToken, userId, username, expiresAt }
    });
    return token;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ userId: string; username: string; role: string; refreshToken: string }> {
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');
    logger.debug({ hashedToken }, "Hashed token for lookup");
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: hashedToken } });
    if (!storedToken) {
        logger.debug({ hashedToken }, "Token not found in database");
        throw new BadRequestError('Invalid or expired refresh token');
    }
    if (storedToken.expiresAt < new Date()) {
        logger.debug({ expiresAt: storedToken.expiresAt }, "Token expired");
        throw new BadRequestError('Invalid or expired refresh token');
    }
    logger.debug({ userId: storedToken.userId }, "Token found for user");

    let role = 'USER';
    let isSuperAdmin = false;
    try {
        const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/${storedToken.userId}`, {
            headers: { 'x-internal-api-key': INTERNAL_API_KEY }
        });
        const result = await response.json();
        if (result.status === 'success' && result.data) {
            role = result.data.role || 'USER';
            isSuperAdmin = result.data.isSuperAdmin || false;
        }
    } catch (error) {
        logger.error({ err: error, userId: storedToken.userId }, "Failed to fetch user data");
    }

    await prisma.refreshToken.delete({ where: { token: hashedToken } });
    const newRefreshToken = await createRefreshToken(storedToken.userId, storedToken.username);
    return { userId: storedToken.userId, username: storedToken.username, role, isSuperAdmin, refreshToken: newRefreshToken };
}

export async function deleteRefreshToken(refreshToken: string): Promise<void> {
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.delete({ where: { token: hashedToken } });
}

