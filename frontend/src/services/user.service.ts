import api from './api.client';
import { USER } from '../constants/user.const'
import type { User, UserResponse, UserUpdateData, UserUpdateResponse } from '../types/user.type'

interface ApiResponse<T = unknown> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}

const userService = {
	async getMe(): Promise<UserResponse> {
		const response = await api.get<UserResponse>(USER.ME);
		return response.data;
	},

	async updateProfile(userId: string, data: UserUpdateData): Promise<UserUpdateResponse> {
		try {
			const response = await api.put<UserUpdateResponse>(`${USER.BASE}/${userId}`, data);
			return response.data;
		} catch (error: any) {
			if (error.response?.status === 409) {
				throw new Error('Username is already taken.');
			}
			throw new Error(error.response?.data?.message || 'Error updating profile.');
		}
	},

	async updateAvatar(avatarFile: File): Promise<UserUpdateResponse> {
		const formData = new FormData();
		formData.append('avatar', avatarFile);
		try {
			const response = await api.post<UserUpdateResponse>(USER.AVATAR, formData);
			return response.data;
		} catch (error: any) {
			throw new Error(error.response?.data?.message || 'Error updating avatar.');
		}
	},

	async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<Record<string, never>>> {
		const response = await api.post<ApiResponse<Record<string, never>>>(USER.CHANGE_PASSWORD, {
			oldPassword,
			newPassword,
		});
		return response.data;
	},

	async getUserById(userId: string): Promise<UserResponse> {
		const response = await api.get<UserResponse>(`${USER.BASE}/${userId}`);
		return response.data;
	},

	async deleteAccount(userId: string): Promise<ApiResponse<User>> {
		const response = await api.delete<ApiResponse<User>>(`${USER.BASE}/${userId}`);
		return response.data;
	},

	async requestAccountDeletion(userId: string): Promise<ApiResponse<{ message: string }>> {
		const response = await api.post<ApiResponse<{ message: string }>>(`${USER.BASE}/${userId}/request-deletion`);
		return response.data;
	},
}
export default userService;