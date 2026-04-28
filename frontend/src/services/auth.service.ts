import api from './api.client';
import { AUTH } from '../constants/auth.const';
import axios from 'axios';
import type {
	LoginCredentials,
	RegisterData,
	AuthResponse,
	ApiResponse,
	EmailVerifyData,
	ResendVerificationData,
	ForgotPasswordData,
	ResetPasswordData,
} from "../types/auth.type"
const TOKEN_KEY = 'cookshare_token';
const PERSIST_KEY = 'cookshare_persist';
let accessToken: string | null = null;

export function getAccessToken(): string | null {
	if (accessToken) return accessToken;
	accessToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
	return accessToken;
}

export function setAccessToken(token: string | null, rememberMe?: boolean): void {
	accessToken = token;
	if (token) {
		const persist = rememberMe ?? localStorage.getItem(PERSIST_KEY) === 'true';
		if (persist) {
			localStorage.setItem(PERSIST_KEY, 'true');
			localStorage.setItem(TOKEN_KEY, token);
			sessionStorage.removeItem(TOKEN_KEY);
		} else {
			localStorage.removeItem(PERSIST_KEY);
			localStorage.removeItem(TOKEN_KEY);
			sessionStorage.setItem(TOKEN_KEY, token);
		}
	} else {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(PERSIST_KEY);
		sessionStorage.removeItem(TOKEN_KEY);
	}
}

const authService = {
	async login(data: LoginCredentials): Promise<AuthResponse | null> {
		const { rememberMe, ...credentials } = data;
		try {
			const response = await api.post<AuthResponse>(AUTH.LOGIN, credentials);
			const token = response.data?.data?.accessToken;
			if (token) {
				setAccessToken(token, rememberMe);
			}
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				// Handle silently, no console.error
				return null;
			}
			throw error;
		}
	},

	async register(data: RegisterData): Promise<ApiResponse> {
		const response = await api.post<ApiResponse>(AUTH.REGISTER, data);
		return response.data;
	},

	async logout(): Promise<void> {
		try {
			await api.post(AUTH.LOGOUT);
		} finally {
			setAccessToken(null);
		}
	},

	async emailVerify(data: EmailVerifyData): Promise<ApiResponse> {
		const response = await api.post<ApiResponse>(AUTH.EMAIL_VERIFY, data);
		return response.data;
	},

	async resendVerification(data: ResendVerificationData): Promise<void> {
		await api.post(AUTH.RESEND_VERIFICATION, data);
	},

	async forgotPassword(data: ForgotPasswordData): Promise<void> {
		await api.post(AUTH.FORGOT_PASSWORD, data);
	},

	async resetPassword(data: ResetPasswordData): Promise<void> {
		await api.post(AUTH.RESET_PASSWORD, data);
	},

	async refresh(): Promise<AuthResponse> {
		const wasPersist = localStorage.getItem(PERSIST_KEY) === 'true';
		const response = await api.post<AuthResponse>(AUTH.REFRESH);
		const token = response.data?.data?.accessToken;
		if (token) {
			setAccessToken(token, wasPersist);
		}
		return response.data;
	},

	isAuthenticated(): boolean {
		return !!getAccessToken();
	},

	getToken(): string | null {
		return getAccessToken();
	},

	/**
	 * Initiates Google OAuth by redirecting to the API gateway.
	 * The backend handles the full redirect chain.
	 */
	startGoogleOAuth(): void {
		const baseUrl = api.defaults.baseURL || '';
		window.location.href = `${baseUrl}/${AUTH.GOOGLE_AUTH}`;
	},

	/**
	 * Called after Google OAuth callback — stores the access token.
	 */
	handleOAuthCallback(token: string, rememberMe = true): void {
		setAccessToken(token, rememberMe);
	},

	/**
	 * Unlinks Google from the user's account.
	 */
	async unlinkGoogle(): Promise<void> {
		await api.post(AUTH.GOOGLE_UNLINK);
	},
}

export default authService;