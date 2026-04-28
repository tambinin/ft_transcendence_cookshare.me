import { createHash, randomBytes, randomUUID } from "crypto";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import pino from "pino";
import { fetchWithTimeout } from "@transcendence/common";
import type {
	GoogleUserProfile,
	GoogleTokenResponse,
	OAuthUpsertResult,
	OAuthErrorCode,
} from "../types/google.types";

const logger = pino({ name: "auth-service:oauth" });

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${process.env.USER_SERVICE_PORT || 3004}`;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const AUTH_DATABASE_URL = process.env.AUTH_DATABASE_URL;

if (!AUTH_DATABASE_URL) throw new Error("AUTH_DATABASE_URL is not defined");
if (!INTERNAL_API_KEY) throw new Error("INTERNAL_API_KEY is not defined");

const dbUrl = new URL(AUTH_DATABASE_URL);
const schema = dbUrl.searchParams.get("schema") || "public";
const pool = new Pool({ connectionString: AUTH_DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_SCOPES = "openid email profile";

function generateCodeVerifier(): string {
	return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
	return createHash("sha256").update(verifier).digest("base64url");
}

const pendingStates = new Map<string, { codeVerifier: string; createdAt: number }>();

setInterval(() => {
	const now = Date.now();
	for (const [key, val] of pendingStates) {
		if (now - val.createdAt > 10 * 60 * 1000) pendingStates.delete(key);
	}
}, 5 * 60 * 1000);


export function buildGoogleAuthUrl(): { url: string; state: string } {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const domain = process.env.DOMAIN || "cookshare.me";
	const callbackUrl = `https://${domain}/api/v1/auth/google/callback`;

	if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");

	const state = randomUUID();
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);

	pendingStates.set(state, { codeVerifier, createdAt: Date.now() });

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: callbackUrl,
		response_type: "code",
		scope: GOOGLE_SCOPES,
		state,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		access_type: "offline",
		prompt: "consent",
	});

	return { url: `${GOOGLE_AUTH_URL}?${params.toString()}`, state };
}

export function validateState(state: string): string | null {
	const pending = pendingStates.get(state);
	if (!pending) return null;
	pendingStates.delete(state);

	if (Date.now() - pending.createdAt > 10 * 60 * 1000) return null;
	return pending.codeVerifier;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<GoogleTokenResponse> {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	const domain = process.env.DOMAIN || "cookshare.me";
	const callbackUrl = `https://${domain}/api/v1/auth/google/callback`;

	if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not configured");

	const body = new URLSearchParams({
		code,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: callbackUrl,
		grant_type: "authorization_code",
		code_verifier: codeVerifier,
	});

	const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	if (!response.ok) {
		const errorText = await response.text();
		logger.error({ status: response.status }, "Google token exchange failed");
		throw new Error(`Google token exchange failed: ${response.status}`);
	}

	return (await response.json()) as GoogleTokenResponse;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleUserProfile> {
	const response = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!response.ok) {
		logger.error({ status: response.status }, "Google userinfo fetch failed");
		throw new Error("Failed to fetch Google profile");
	}

	return (await response.json()) as GoogleUserProfile;
}

export function validateGoogleProfile(profile: GoogleUserProfile): OAuthErrorCode | null {
	if (!profile.email_verified) return "email_not_verified";
	if (!profile.email || !profile.sub) return "provider_error";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return "provider_error";
	return null;
}

/**
 * Upsert user in user-service via internal API.
 *
 * Scenarios:
 * 1. google_id known → login (return existing user)
 * 2. email known + no google_id → link Google to existing account
 * 3. unknown → create new OAuth user
 */
export async function upsertOAuthUser(profile: GoogleUserProfile): Promise<OAuthUpsertResult> {
	const byGoogleId = await fetchInternalUser(`by-google-id/${profile.sub}`);
	if (byGoogleId) {
		logger.info({ userId: byGoogleId.id }, "OAuth login — existing Google user");
		return { user: byGoogleId, isNewUser: false };
	}

	const byEmail = await fetchInternalUser(`by-email-identifier/${profile.email}`);
	if (byEmail) {
		if (byEmail.googleId) {
			logger.warn({ email: profile.email }, "Email has a different Google ID linked");
			throw new OAuthError("google_id_conflict");
		}

		const linked = await linkGoogleToUser(byEmail.id, profile);
		logger.info({ userId: byEmail.id }, "OAuth — linked Google to existing account");
		return { user: linked, isNewUser: false };
	}

	// User doesn't exist
	const newUser = await createOAuthUser(profile);
	logger.info({ userId: newUser.id }, "OAuth — created new Google user");
	return { user: newUser, isNewUser: true };
}

/**
 * Check if OAuth user exists (for sign-in only, doesn't create)
 */
export async function findOAuthUser(profile: GoogleUserProfile): Promise<OAuthUpsertResult["user"] | null> {
	const byGoogleId = await fetchInternalUser(`by-google-id/${profile.sub}`);
	if (byGoogleId) {
		logger.info({ userId: byGoogleId.id }, "OAuth login — existing Google user");
		return byGoogleId;
	}

	const byEmail = await fetchInternalUser(`by-email-identifier/${profile.email}`);
	if (byEmail) {
		if (byEmail.googleId) {
			logger.warn({ email: profile.email }, "Email has a different Google ID linked");
			throw new OAuthError("google_id_conflict");
		}

		const linked = await linkGoogleToUser(byEmail.id, profile);
		logger.info({ userId: byEmail.id }, "OAuth — linked Google to existing account");
		return linked;
	}

	// User doesn't exist
	return null;
}

async function fetchInternalUser(path: string): Promise<OAuthUpsertResult["user"] | null> {
	try {
		const url = `${USER_SERVICE_URL}/api/v1/internal/users/${path}`;
		logger.info({ url }, "Fetching internal user");
		const response = await fetchWithTimeout(url, {
			headers: { "x-internal-api-key": INTERNAL_API_KEY! },
		});
		logger.info({ status: response.status, path }, "Internal user fetch response");
		if (!response.ok) return null;
		const result = await response.json() as { status: string; data: OAuthUpsertResult["user"] | { user: OAuthUpsertResult["user"] } };
		if (result.status !== "success" || !result.data) return null;
		const data = result.data as Record<string, unknown>;
		return (data.user ?? data) as OAuthUpsertResult["user"];
	} catch (error) {
		logger.error({ err: error, path }, "Failed to fetch internal user");
		return null;
	}
}

async function linkGoogleToUser(userId: string, profile: GoogleUserProfile): Promise<OAuthUpsertResult["user"]> {
	const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/${userId}/link-google`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"x-internal-api-key": INTERNAL_API_KEY!,
		},
		body: JSON.stringify({
			googleId: profile.sub,
			avatarUrl: profile.picture || undefined,
		}),
	});

	if (!response.ok) {
		throw new OAuthError("server_error");
	}
	const result = await response.json() as { status: string; data: OAuthUpsertResult["user"] };
	return result.data;
}

async function createOAuthUser(profile: GoogleUserProfile): Promise<OAuthUpsertResult["user"]> {
	const baseUsername = (profile.given_name || profile.name || "user")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.slice(0, 20);

	const url = `${USER_SERVICE_URL}/api/v1/internal/users/oauth`;
	const body = {
		email: profile.email,
		baseUsername,
		firstName: profile.given_name || null,
		lastName: profile.family_name || null,
		avatarUrl: profile.picture || null,
		googleId: profile.sub,
		provider: "GOOGLE",
		isEmailVerified: true,
	};
	logger.info({ url, baseUsername, email: profile.email }, "Creating OAuth user");

	const response = await fetchWithTimeout(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-internal-api-key": INTERNAL_API_KEY!,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errBody = await response.text();
		logger.error({ status: response.status, body: errBody, url }, "Failed to create OAuth user");
		throw new OAuthError("server_error");
	}
	const result = await response.json() as { status: string; data: OAuthUpsertResult["user"] };
	return result.data;
}

export async function createOAuthRefreshToken(userId: string, username: string): Promise<string> {
	const token = randomBytes(64).toString("hex");
	const hashedToken = createHash("sha256").update(token).digest("hex");
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
	await prisma.refreshToken.create({
		data: { token: hashedToken, userId, username, expiresAt },
	});
	return token;
}

export class OAuthError extends Error {
	public code: OAuthErrorCode;
	constructor(code: OAuthErrorCode, message?: string) {
		super(message || `OAuth error: ${code}`);
		this.code = code;
		Object.setPrototypeOf(this, OAuthError.prototype);
	}
}
