import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/auth.context';
import userService from '../services/user.service';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
	message?: string;
}

export const useSettings = () => {
	const { user, logout } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
		if (!user) throw new Error('User not connected');
		if (newPassword.length < 8) {
			throw new Error('New password needs at least 8 characters. Make it hard to guess.');
		}
		setIsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			await userService.changePassword(oldPassword, newPassword);
			setSuccess('Password updated successfully. Try not to forget it this time.');
		} catch (err) {
			const axiosError = err as AxiosError<ApiErrorResponse>;
			const errorMessage = axiosError.response?.data?.message
				|| (err instanceof Error ? err.message : "Error changing password. That's on us, or maybe you.");
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [user]);
	const deleteAccount = useCallback(async () => {
		if (!user) throw new Error('User not connected');

		setIsLoading(true);
		setError(null);

		try {
			await userService.deleteAccount(user.id);
			await logout();
		} catch (err: unknown) {
			const axiosError = err as AxiosError<ApiErrorResponse>;
			const errorMessage = axiosError?.response?.data?.message 
				|| (err instanceof Error ? err.message : 'Error while deleting account');
			
			throw new Error(errorMessage);
		}
	}, [user, logout]);

	const clearMessages = useCallback(() => {
		setError(null);
		setSuccess(null);
	}, []);

	return {
		user,
		isLoading,
		error,
		success,
		changePassword,
		deleteAccount,
		clearMessages,
	};
};

export default useSettings;
