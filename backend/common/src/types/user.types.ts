export interface UserPublic {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}

export function stripPassword<T>(
    user: T
): Omit<T, 'password'> {
    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
}