import type { User, UserUpdateData } from './user.type'

interface	LoginCredentials {
	identifier: string;
	password: string;
	rememberMe?: boolean;
}

interface	RegisterData {
	email: string;
	username: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

interface ApiResponse<T = unknown> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}

interface AuthTokenData {
	accessToken: string;
	user?: User;
}

type AuthResponse = ApiResponse<AuthTokenData>;

interface EmailVerifyData {
	token: string;
}

interface ResendVerificationData {
	email: string;
}

interface ForgotPasswordData {
	email: string;
}

interface ResetPasswordData {
	token: string;
	newPassword: string;
}

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	register: (data: RegisterData) => Promise<void>;
	verifyEmail: (data: EmailVerifyData) => Promise<void>;
	resendVerification: (data: ResendVerificationData) => Promise<void>;
	logout: () => Promise<void>;
	clearError: () => void;
	updateUserProfile: (data: UserUpdateData) => Promise<void>;
	refreshUser: () => Promise<void>;
}

export type {
	LoginCredentials,
	RegisterData,
	ApiResponse,
	AuthTokenData,
	AuthResponse,
	AuthContextType,
	EmailVerifyData,
	ResendVerificationData,
	ForgotPasswordData,
	ResetPasswordData,
}
