export const AUTH = {
	LOGIN: 'auth/login',
	REGISTER: 'auth/register',
	REFRESH: 'auth/refresh',
	LOGOUT: 'auth/logout',
	EMAIL_VERIFY: 'auth/verify-email',
	RESEND_VERIFICATION: 'auth/resend-verification',
	FORGOT_PASSWORD: 'auth/forgot-password',
	RESET_PASSWORD: 'auth/reset-password',
	GOOGLE_AUTH: 'auth/google',
	GOOGLE_UNLINK: 'auth/google/unlink',
}	as const;