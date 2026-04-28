interface ApiResponse<T = unknown> {
	status: 'success' | 'error';
	message?: string;
	data: T;
}
interface User {
	id: string;
	username: string;
	lastName: string | null;
	firstName: string | null;
	avatarUrl: string | null;
	isOnline: boolean;
	email: string;
	role?: string;
	provider?: 'LOCAL' | 'GOOGLE';
	googleId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

type UserResponse = ApiResponse<User>;

interface UserUpdateData {
	username?: string;
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
	email?:string;
}

type UserUpdateResponse = ApiResponse<User>;

export type {
	User,
	UserResponse,
	UserUpdateData,
	UserUpdateResponse
}