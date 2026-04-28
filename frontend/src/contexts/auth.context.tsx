import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
}	from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
import authService, { getAccessToken, setAccessToken } from "../services/auth.service";
import userService from "../services/user.service";
import { setSessionExpiredHandler } from "../services/api.client";
import { disconnect as wsDisconnect } from "../services/socket.service";
import { broadcastLogout, useSessionWatcher } from "../hooks/useSessionWatcher";
import { getSafeRedirectFrom } from "../utils/navigation.utils";
import logger from "../utils/logger";
import type {
	LoginCredentials,
	RegisterData,
	AuthContextType,
}	from "../types/auth.type";
import type { User, UserUpdateData } from "../types/user.type";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractErrorMessage(err: unknown, fallback: string): string {
	const error = err as AxiosError<{ message?: string }>;
	return error.response?.data?.message || fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const location = useLocation();
	const initialCheckDone = useRef(false);
	const isAuthenticated = !isLoading && (!!getAccessToken() || !!user);

	// ── Cross-tab logout sync + focus re-validation ──
	useSessionWatcher();

	const fetchUserProfile = useCallback(async () => {
			try {
				const response = await userService.getMe();
				setUser(response.data);
			} catch (err) {
				// Silently handle error to avoid console noise
				setUser(null);
			}
		}, []);

	useEffect(() => {
		if (initialCheckDone.current) return;
		initialCheckDone.current = true;

		const checkAuth = async () => {
			const hasStoredToken = !!getAccessToken();
			const hasPersistFlag = !!localStorage.getItem('cookshare_persist');

			if (!hasStoredToken && !hasPersistFlag) {
				setIsLoading(false);
				return;
			}

			// Always validate the token if one exists — this is needed so
			// PublicRoute can redirect /login → /home for logged-in users.
			// On public pages we still try a lightweight refresh; on failure
			// we simply clear the stale token and let them stay on the page.
			try {
				await authService.refresh();
				await fetchUserProfile();
			} catch (error) {
				logger.warn('Session expired or invalid:', error);
				setUser(null);
				setAccessToken(null);
			} finally {
				setIsLoading(false);
			}
		};
		checkAuth();
	}, [fetchUserProfile]);

	useEffect(() => {
		setSessionExpiredHandler(() => {
			setUser(null);
			setAccessToken(null);
			wsDisconnect();
			broadcastLogout();
			// Full navigation to break bfcache — same as logout
			window.location.replace('/login');
		});
	}, []);

	const login = useCallback(async (credentials: LoginCredentials) => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await authService.login(credentials);
			if (result === null) {
				// User not found, redirect to sign up
				navigate('/register', { replace: true });
				return;
			}
			await fetchUserProfile();
			// replace: true — prevent ← from going back to /login after successful login
			// Restore the page the user was trying to reach (from ProtectedRoute state)
			const from = getSafeRedirectFrom((location.state as { from?: unknown })?.from);
			navigate(from, { replace: true });
		} catch (err) {
			const axiosErr = err as AxiosError<{ message?: string }>;
			const status = axiosErr.response?.status;

			if (status === 403) {
				setError("Verify your email first. We don't trust you yet.");
			} else if (status === 429) {
				setError("Whoa, slow down! Try again in a minute.");
			} else {
				setError(extractErrorMessage(err, "Wrong username or password. Is caps lock on?"));
			}
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [navigate, fetchUserProfile, location.state]);

	const register = useCallback(async (data: RegisterData) => {
		setIsLoading(true);
		setError(null);
		try {
			await authService.register(data);
			// Store credentials temporarily for auto-login after email verification
			localStorage.setItem('pendingAuth', JSON.stringify({ email: data.email, password: data.password }));
			navigate("/email-verify", { state: { email: data.email } });
		} catch (err) {
			setError(extractErrorMessage(err, "Could not create account. Blame the server."));
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [navigate]);

	const verifyEmail = useCallback(async (data: { token: string }) => {
		setIsLoading(true);
		setError(null);
		try {
			await authService.emailVerify(data);
			const pending = localStorage.getItem('pendingAuth');
			if (pending) {
				const { email, password } = JSON.parse(pending);
				await authService.login({ identifier: email, password });
				await fetchUserProfile();
				localStorage.removeItem('pendingAuth');
			}
		} catch (err) {
			setError(extractErrorMessage(err, "Verification failed. Nice try though."));
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [fetchUserProfile]);

	const resendVerification = useCallback(async (data: { email: string }) => {
		setIsLoading(true);
		setError(null);
		try {
			await authService.resendVerification(data);
		} catch (err) {
			setError(extractErrorMessage(err, "Failed to resend the code. It's lost in the nether."));
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setIsLoading(true);
		try {
			await authService.logout();
		} catch {
			// Logout can fail silently — still clear local state
		} finally {
			setUser(null);
			setAccessToken(null);
			wsDisconnect();
			broadcastLogout(); // Notify all other tabs
			setIsLoading(false);
			// Full page navigation to /login to completely break the bfcache chain.
			// Using window.location.replace() instead of navigate() ensures:
			// 1. The current page is replaced in history (can't go back)
			// 2. All React state is destroyed (no stale protected-page state)
			// 3. The bfcache is invalidated for this navigation chain
			window.location.replace('/login');
		}
	}, []);

	const clearError = useCallback(() => setError(null), []);
	const updateUserProfile = useCallback(async (data: UserUpdateData) => {
		if (!user) throw new Error("User not logged in. Are you even trying?");
		
		setIsLoading(true);
		setError(null);
		try {
			const response = await userService.updateProfile(user.id, data);
			setUser(response.data);
		} catch (err) {
			setError(extractErrorMessage(err, "Profile update failed. You're stuck like this."));
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				isLoading,
				error,
				login,
				register,
				verifyEmail,
				resendVerification,
				logout,
				clearError,
				updateUserProfile,
				refreshUser: fetchUserProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an <AuthProvider>");
	}
	return context;
}

export default AuthContext;