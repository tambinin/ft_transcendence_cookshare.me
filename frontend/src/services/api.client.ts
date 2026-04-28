import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { AUTH } from "../constants/auth.const";
import { getAccessToken, setAccessToken } from "./auth.service";
import { getApiBaseUrl } from "./url-resolver";

const NO_REFRESH_ROUTES = [
	AUTH.LOGIN,
	AUTH.REGISTER,
	AUTH.REFRESH,
	AUTH.FORGOT_PASSWORD,
	AUTH.RESET_PASSWORD,
	AUTH.EMAIL_VERIFY,
	AUTH.RESEND_VERIFICATION,
];

const api = axios.create({
	baseURL: getApiBaseUrl(),
	timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

export function initApiBaseUrl(): void {
	api.defaults.baseURL = getApiBaseUrl();
}

let isRefreshing = false;
let refreshSubscribers: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

function onRefreshed(token: string) {
	refreshSubscribers.forEach(({ resolve }) => resolve(token));
	refreshSubscribers = [];
}

function onRefreshFailed(error: unknown) {
	refreshSubscribers.forEach(({ reject }) => reject(error));
	refreshSubscribers = [];
}

let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: () => void) {
	onSessionExpired = handler;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = getAccessToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	if (config.data instanceof FormData) {
		delete config.headers['Content-Type'];
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
		const requestUrl = originalRequest?.url || "";

		const isNoRefreshRoute = NO_REFRESH_ROUTES.some((route) =>
			requestUrl.includes(route)
		);
		const status = error.response?.status;
		const isAuthError =
			status === 401 ||
			(status === 403 && error.response?.data?.message === "Authentication required");

		if (
			isAuthError &&
			!originalRequest._retry &&
			!isNoRefreshRoute &&
			getAccessToken()
		) {
			originalRequest._retry = true;
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					refreshSubscribers.push({
						resolve: (token: string) => {
							originalRequest.headers = {
								...originalRequest.headers,
								Authorization: `Bearer ${token}`,
							};
							resolve(api(originalRequest));
						},
						reject,
					});
				});
			}
			isRefreshing = true;
			try {
				const wasPersist = localStorage.getItem('cookshare_persist') === 'true';
				const response = await api.post(AUTH.REFRESH);
				const newToken = response.data?.data?.accessToken;

				if (newToken) {
					setAccessToken(newToken, wasPersist);
					originalRequest.headers = {
						...originalRequest.headers,
						Authorization: `Bearer ${newToken}`,
					};
					onRefreshed(newToken);
					return api(originalRequest);
				}

				throw new Error("No access token in refresh response");
			} catch (refreshError) {
				onRefreshFailed(refreshError);
				setAccessToken(null);
				if (onSessionExpired) {
					onSessionExpired();
				} else {
					const publicPaths = ['/', '/login', '/register', '/email-verify', '/reset-password', '/terms-of-service', '/privacy-policy'];
					if (!publicPaths.includes(window.location.pathname)) {
						window.location.href = "/login";
					}
				}
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// For non-auth errors, throw a plain Error to silence axios console errors
		throw new Error(error.response?.data?.message || `Request failed with status ${status}`);
	}
);

export default api;