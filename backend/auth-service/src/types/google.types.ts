export interface GoogleUserProfile {
	sub: string;
	email: string;
	email_verified: boolean;
	name: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
}

export interface GoogleTokenResponse {
	access_token: string;
	expires_in: number;
	token_type: string;
	scope: string;
	id_token?: string;
	refresh_token?: string;
}

export interface OAuthUpsertResult {
	user: {
		id: string;
		username: string;
		email: string;
		role: string;
		isSuperAdmin: boolean;
		avatarUrl: string | null;
		provider: string;
		googleId: string | null;
	};
	isNewUser: boolean;
}

export type OAuthErrorCode =
	| 'access_denied'
	| 'invalid_state'
	| 'provider_error'
	| 'email_not_verified'
	| 'email_conflict'
	| 'google_id_conflict'
	| 'server_error';
