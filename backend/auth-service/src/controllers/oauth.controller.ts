import { FastifyRequest, FastifyReply } from "fastify";
import {
	buildGoogleAuthUrl,
	validateState,
	exchangeCodeForTokens,
	fetchGoogleProfile,
	validateGoogleProfile,
	upsertOAuthUser,
	createOAuthRefreshToken,
	OAuthError,
} from "../services/oauth.service";
import { sendSuccess, HttpStatus, sendError, UserRole, fetchWithTimeout } from "@transcendence/common";
import pino from "pino";

const logger = pino({ name: "auth-service:oauth-controller" });
const DOMAIN = process.env.DOMAIN || "cookshare.me";

export async function googleAuthHandler(_request: FastifyRequest, reply: FastifyReply) {
	try {
		const { url, state } = buildGoogleAuthUrl();

		reply.setCookie("oauth_state", state, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/api/v1/auth",
			maxAge: 600,
		});

		return reply.redirect(url);
	} catch (error) {
		logger.error({ err: error }, "Failed to build Google auth URL");
		return reply.redirect(`https://${DOMAIN}/login?oauth_error=server_error`);
	}
}

export async function googleCallbackHandler(request: FastifyRequest, reply: FastifyReply) {
	const { code, state, error: oauthError } = request.query as {
		code?: string;
		state?: string;
		error?: string;
	};

	if (oauthError === "access_denied" || !code) {
		return reply.redirect(`https://${DOMAIN}/login?oauth_error=access_denied`);
	}

	if (!state) {
		return reply.redirect(`https://${DOMAIN}/login?oauth_error=invalid_state`);
	}

	try {
		const cookieState = request.cookies.oauth_state;
		if (!cookieState || cookieState !== state) {
			logger.warn("OAuth state mismatch (CSRF protection)");
			return reply.redirect(`https://${DOMAIN}/login?oauth_error=invalid_state`);
		}

		const codeVerifier = validateState(state);
		if (!codeVerifier) {
			return reply.redirect(`https://${DOMAIN}/login?oauth_error=invalid_state`);
		}

		reply.clearCookie("oauth_state", {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/api/v1/auth",
		});

		logger.info("OAuth: exchanging code for tokens...");
		const tokens = await exchangeCodeForTokens(code, codeVerifier);
		logger.info("OAuth: tokens received, fetching Google profile...");

		const profile = await fetchGoogleProfile(tokens.access_token);
		logger.info({ email: profile.email, sub: profile.sub }, "OAuth: Google profile fetched");

		const profileError = validateGoogleProfile(profile);
		if (profileError) {
			logger.warn({ profileError }, "OAuth: profile validation failed");
			return reply.redirect(`https://${DOMAIN}/login?oauth_error=${profileError}`);
		}

		logger.info("OAuth: upserting user...");
		const { user, isNewUser } = await upsertOAuthUser(profile);
		logger.info({ userId: user.id, isNewUser }, "OAuth: user upserted successfully");

		const refreshToken = await createOAuthRefreshToken(user.id, user.username);
		const accessToken = request.server.jwt.sign(
			{
				id: user.id,
				username: user.username,
				role: (user.role as UserRole) || "USER",
				isSuperAdmin: user.isSuperAdmin || false,
			},
			{ expiresIn: "15m" }
		);

		reply.setCookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			path: "/api/v1/auth",
			maxAge: 7 * 24 * 60 * 60,
		});

		const params = new URLSearchParams({
			token: accessToken,
			new_user: isNewUser ? "1" : "0",
		});

		return reply.redirect(`https://${DOMAIN}/oauth/callback?${params.toString()}`);
	} catch (error) {
		if (error instanceof OAuthError) {
			logger.warn({ code: error.code, message: error.message, stack: error.stack }, "OAuth flow error");
			return reply.redirect(`https://${DOMAIN}/login?oauth_error=${error.code}`);
		}
		logger.error({ err: error, message: (error as Error).message, stack: (error as Error).stack }, "Unexpected error in Google callback");
		return reply.redirect(`https://${DOMAIN}/login?oauth_error=server_error`);
	}
}

export async function googleUnlinkHandler(request: FastifyRequest, reply: FastifyReply) {
	const userId = (request as any).user?.id;
	if (!userId) {
		return sendError(reply, "Authentication required", HttpStatus.UNAUTHORIZED);
	}

	try {
		const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
		const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${process.env.USER_SERVICE_PORT || 3004}`;

		const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/${userId}/unlink-google`, {
			method: "DELETE",
			headers: { "x-internal-api-key": INTERNAL_API_KEY! },
		});

		if (!response.ok) {
			const body = await response.json().catch(() => ({})) as Record<string, unknown>;
			const msg = (body.message as string) || "Failed to unlink Google account";
			return sendError(reply, msg, response.status as number);
		}

		const result = await response.json() as { data: unknown };
		return sendSuccess(reply, result.data, "Google account unlinked successfully");
	} catch (error) {
		logger.error({ err: error }, "Failed to unlink Google account");
		return sendError(reply, "Failed to unlink Google account", HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
