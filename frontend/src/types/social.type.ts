import type { ApiResponse } from './api.type';

export interface Follow {
	id: string;
	followerId: string;
	followingId: string;
	createdAt: string;
}

export interface FollowUser {
	id: string;
	username: string;
	avatarUrl: string | null;
	isOnline: boolean;
}

export type FollowResponse = ApiResponse<Follow>;
export type FollowListResponse = ApiResponse<FollowUser[]>;
export type IsFollowingResponse = ApiResponse<{ isFollowing: boolean }>;
export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export interface FriendRequest {
	id: string;
	senderId: string;
	receiverId: string;
	status: FriendRequestStatus;
	createdAt: string;
	sender?: FollowUser;
	receiver?: FollowUser;
}

export interface Friend {
	id: string;
	username: string;
	avatarUrl: string | null;
	isOnline: boolean;
}

export type FriendRequestResponse = ApiResponse<FriendRequest>;
export type FriendRequestListResponse = ApiResponse<FriendRequest[]>;
export type FriendListResponse = ApiResponse<Friend[]>;

export interface SearchUser {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
}

export type SearchUserResponse = ApiResponse<SearchUser[]>;

export interface BlockedUser {
	id: string;
	username: string;
	avatarUrl: string | null;
	blockedAt: string;
}

export type BlockedUsersResponse = ApiResponse<BlockedUser[]>;

export interface SocialContextType {
	friends: Friend[];
	followers: FollowUser[];
	following: FollowUser[];
	friendRequests: FriendRequest[];
	isLoading: boolean;
	error: string | null;
	followUser: (userId: string) => Promise<void>;
	unfollowUser: (userId: string) => Promise<void>;
	isFollowing: (userId: string) => Promise<boolean>;
	sendFriendRequest: (userId: string) => Promise<void>;
	acceptFriendRequest: (requestId: string) => Promise<void>;
	rejectFriendRequest: (requestId: string) => Promise<void>;
	removeFriend: (friendId: string) => Promise<void>;
	refreshFriends: () => Promise<void>;
	refreshFollowers: () => Promise<void>;
	refreshFollowing: () => Promise<void>;
	refreshFriendRequests: () => Promise<void>;
}
