import { useState } from 'react';
import { useAuth } from '../contexts/auth.context';
import userService from '../services/user.service';
import type { UserUpdateData } from '../types/user.type';

export const useProfileUpdate = () => {
	const { user, updateUserProfile, refreshUser } = useAuth();
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateError, setUpdateError] = useState<string | null>(null);

	const updateProfile = async (data: UserUpdateData) => {
		setIsUpdating(true);
		setUpdateError(null);
		try {
			await updateUserProfile(data);
		} catch (error: any) {
			if (error.message === 'Username is already taken.') {
				setUpdateError("Ce nom d'utilisateur est déjà pris.");
			} else {
				setUpdateError(error.message);
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const updateAvatar = async (avatarFile: File) => {
		if (!user) {
			setUpdateError('User not logged in');
			return;
		}
		
		const maxSize = 5 * 1024 * 1024; // 5MB
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		
		if (avatarFile.size > maxSize) {
			setUpdateError('File must not exceed 5MB');
			return;
		}
		
		if (!allowedTypes.includes(avatarFile.type)) {
			setUpdateError('Unsupported file format. Use JPG, PNG, or WebP');
			return;
		}
		
		setIsUpdating(true);
		setUpdateError(null);
		try {
			await userService.updateAvatar(avatarFile);
			await refreshUser();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update avatar. You\'re stuck with that face.';
			setUpdateError(errorMessage);
		} finally {
			setIsUpdating(false);
		}
	};

	const clearError = () => setUpdateError(null);

	return {
		user,
		isUpdating,
		updateError,
		updateProfile,
		updateAvatar,
		clearError,
	};
};

export default useProfileUpdate;