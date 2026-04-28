import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
    sendSuccess,
    sendCreated,
    sendBadRequest,
    sendConflict,
    sendError,
    HttpStatus,
    UserRole,
    fetchWithTimeout
} from "@transcendence/common";
import {
    loginUser,
    registerUser,
    refreshAccessToken,
    deleteRefreshToken,
    resetPassword,
    forgotPasswordByEmailIdentifier
} from "../services/auth.service";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${process.env.USER_SERVICE_PORT || 3004}`;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `https://notification:${process.env.NOTIFICATION_SERVICE_PORT || 3006}`;

export const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(142),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatarUrl: z.string().optional(),
    bio: z.string().optional(),
});

export const loginSchema = z.object({
    identifier: z.string().min(3).max(50),
    password: z.string().min(8).max(142),
});

export const refreshSchema = z.object({
    refreshToken: z.string(),
});

export const logoutSchema = z.object({
    refreshToken: z.string(),
});

export const emailSchema = z.object({
    email: z.string().email()
});

export const resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string().min(8).max(142)
});

export const tokenSchema = z.object({
    token: z.string()
});

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
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


    try {
        const validatedBody = registerSchema.parse(body);
        const result = await registerUser(validatedBody, fileData);
        sendCreated(reply, result, 'User registered successfully');
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendBadRequest(reply, error.issues[0].message);
        }
        if (error.code === 'P2002' || error.message.includes('exists')) {
            return sendConflict(reply, "User with this email or username already exists");
        }
        request.log.error(error);
        sendError(reply, "Registration failed", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const result = await loginUser(request.body as z.infer<typeof loginSchema>);
        const { refreshToken, ...user } = result;
        const accessToken = request.server.jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role || 'USER',
                isSuperAdmin: (user as any).isSuperAdmin || false,
            } as any,
            {
                expiresIn: '15m',
            }
        );
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth',
            maxAge: 7 * 24 * 60 * 60
        });

        sendSuccess(reply, { accessToken }, 'Login successful');
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return sendError(reply, "Invalid email/username or password", HttpStatus.UNAUTHORIZED);
        }
        if (error.message.includes('Too many attempts')) {
            return sendError(reply, error.message, 429 as any);
        }
        if (error.message.includes('not found')) {
            return sendError(reply, "User not found", HttpStatus.NOT_FOUND);
        }
        request.log.error(error);
        if (error.message.includes('Please verify your email address before logging in')) {
            return sendError(reply, "Please verify your email address before logging in", HttpStatus.FORBIDDEN);
        }
        request.log.error(error);
        sendError(reply, "Authentication failed", HttpStatus.UNAUTHORIZED);
    }
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
        return sendBadRequest(reply, "Refresh token is required");
    }
    try {
        const result = await refreshAccessToken(refreshToken);
        const accessToken = request.server.jwt.sign(
            {
                id: result.userId,
                username: result.username,
                role: (result.role as UserRole) || 'USER',
                isSuperAdmin: result.isSuperAdmin || false,
            },
            {
                expiresIn: '15m',
            }
        );
        reply.setCookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth',
            maxAge: 7 * 24 * 60 * 60
        });
        sendSuccess(reply, { accessToken }, 'Access token refreshed successfully');
    } catch (error: any) {
        request.log.error(error);
        sendError(reply, "Token refresh failed - please login again", HttpStatus.UNAUTHORIZED);
    }
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
        return sendBadRequest(reply, "Refresh token is required");
    }
    try {
        await deleteRefreshToken(refreshToken);
        reply.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth',
        });
        sendSuccess(reply, {}, 'Logout successful');
    } catch (error: any) {
        request.log.error(error);
        sendSuccess(reply, {}, 'Logout successful');
    }
}

export async function resetPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
    const { token, newPassword } = request.body as z.infer<typeof resetPasswordSchema>;
    try {
        await resetPassword(token, newPassword);
        sendSuccess(reply, {}, 'Password reset successfully');
    } catch (error: any) {
        request.log.error(error);
        sendError(reply, "Password reset failed", HttpStatus.BAD_REQUEST);
    }
}

export async function forgotPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as z.infer<typeof emailSchema>;
    try {
        await forgotPasswordByEmailIdentifier(email);
        sendSuccess(reply, {}, 'If an account with that email exists, a password reset link has been sent.');
    } catch (error: any) {
        request.log.error(error);
        sendSuccess(reply, {}, 'If an account with that email exists, a password reset link has been sent.');
    }
}

export async function verifyEmailHandler(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.body as z.infer<typeof tokenSchema>;
    try {
        const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/verify-email-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY as string },
            body: JSON.stringify({ token })
        });
        if (!response.ok) {
            throw new Error('Verification failed');
        }
        const result = await response.json();
        if (result.status === 'error') {
            throw new Error(result.message || 'Invalid token');
        }
        sendSuccess(reply, {}, 'Email verified');
    } catch (error: any) {
        request.log.error(error);
        return sendBadRequest(reply, 'Invalid or expired verification token');
    }
}

export async function resendVerificationHandler(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as z.infer<typeof emailSchema>;
    try {
        const userResponse = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/by-email-identifier/${email}`, {
            headers: { 'x-internal-api-key': INTERNAL_API_KEY as string }
        });
        const userResult = await userResponse.json();
        if (userResult.status === 'error') {
            return sendSuccess(reply, {}, 'If an account with that email exists, a verification email has been sent.');
        }
        const { user } = userResult.data;
        const tokenResponse = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/create-verification-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY as string },
            body: JSON.stringify({ userId: user.id })
        });
        const tokenResult = await tokenResponse.json();
        if (tokenResult.status === 'success') {
            await fetchWithTimeout(`${NOTIFICATION_SERVICE_URL}/api/v1/internal/send-verification-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY as string },
                body: JSON.stringify({ email: user.email, verificationToken: tokenResult.data.verificationToken })
            });
        }
        sendSuccess(reply, {}, 'If an account with that email exists, a verification email has been sent.');
    } catch (error: any) {
        request.log.error(error);
        return sendError(reply, 'Service unavailable, please try again later', HttpStatus.SERVICE_UNAVAILABLE);
    }
}
