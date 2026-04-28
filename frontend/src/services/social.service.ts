import api from './api.client';
import { SOCIAL } from '../constants/social.const';
import type { ApiResponse } from '../types/api.type';
import type {
	FollowResponse,
	FollowListResponse,
	IsFollowingResponse,
	FriendRequestResponse,
	FriendRequestListResponse,
	FriendListResponse,
	SearchUserResponse,
	BlockedUsersResponse,
} from '../types/social.type';

const isFollowingCache = new Map<string, { value: boolean; timestamp: number }>();
const isFollowingPending = new Map<string, Promise<IsFollowingResponse>>();
const CACHE_TTL = 30_000; // 30 seconds

const socialService = {
	async searchUsers(query: string, limit: number = 10): Promise<SearchUserResponse> {
		const params = new URLSearchParams({ q: query, limit: limit.toString() });
		const response = await api.get<SearchUserResponse>(`${SOCIAL.SEARCH_USERS}?${params}`);
		return response.data;
	},
	async followUser(userId: string): Promise<FollowResponse> {
		const response = await api.post<FollowResponse>(SOCIAL.FOLLOW(userId));
		isFollowingCache.set(userId, { value: true, timestamp: Date.now() });
		return response.data;
	},
	async unfollowUser(userId: string): Promise<FollowResponse> {
		const response = await api.delete<FollowResponse>(SOCIAL.FOLLOW(userId));
		isFollowingCache.set(userId, { value: false, timestamp: Date.now() });
		return response.data;
	},
	async isFollowing(userId: string): Promise<IsFollowingResponse> {
		const cached = isFollowingCache.get(userId);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return { status: 'success', data: { isFollowing: cached.value }, message: 'Follow status retrieved successfully (cached)' } as IsFollowingResponse;
		}
		const pending = isFollowingPending.get(userId);
		if (pending) {
			return pending;
		}

		const request = api.get<IsFollowingResponse>(SOCIAL.IS_FOLLOWING(userId))
			.then(response => {
				const result = response.data;
				isFollowingCache.set(userId, {
					value: result.data?.isFollowing ?? false,
					timestamp: Date.now()
				});
				return result;
			})
			.finally(() => {
				isFollowingPending.delete(userId);
			});

		isFollowingPending.set(userId, request);
		return request;
	},

	invalidateFollowCache(userId: string): void {
		isFollowingCache.delete(userId);
	},

	async getMyFollowers(): Promise<FollowListResponse> {
		const response = await api.get<FollowListResponse>(SOCIAL.MY_FOLLOWERS);
		return response.data;
	},

	async getMyFollowing(): Promise<FollowListResponse> {
		const response = await api.get<FollowListResponse>(SOCIAL.MY_FOLLOWING);
		return response.data;
	},

	async getUserFollowers(userId: string): Promise<FollowListResponse> {
		const response = await api.get<FollowListResponse>(SOCIAL.USER_FOLLOWERS(userId));
		return response.data;
	},

	async getUserFollowing(userId: string): Promise<FollowListResponse> {
		const response = await api.get<FollowListResponse>(SOCIAL.USER_FOLLOWING(userId));
		return response.data;
	},

	async sendFriendRequest(receiverId: string): Promise<FriendRequestResponse> {
		const response = await api.post<FriendRequestResponse>(SOCIAL.SEND_FRIEND_REQUEST, { receiverId });
		return response.data;
	},

	async acceptFriendRequest(requestId: string): Promise<FriendRequestResponse> {
		const response = await api.put<FriendRequestResponse>(SOCIAL.ACCEPT_FRIEND_REQUEST(requestId));
		return response.data;
	},

	async rejectFriendRequest(requestId: string): Promise<FriendRequestResponse> {
		const response = await api.put<FriendRequestResponse>(SOCIAL.REJECT_FRIEND_REQUEST(requestId));
		return response.data;
	},

	async getMyFriendRequests(): Promise<FriendRequestListResponse> {
		const response = await api.get<FriendRequestListResponse>(SOCIAL.MY_FRIEND_REQUESTS);
		return response.data;
	},

	async getMySentFriendRequests(): Promise<FriendRequestListResponse> {
		const response = await api.get<FriendRequestListResponse>(SOCIAL.MY_SENT_FRIEND_REQUESTS);
		return response.data;
	},

	async cancelFriendRequest(requestId: string): Promise<ApiResponse<{ message: string }>> {
		const response = await api.delete<ApiResponse<{ message: string }>>(SOCIAL.CANCEL_FRIEND_REQUEST(requestId));
		return response.data;
	},

	async getMyFriends(): Promise<FriendListResponse> {
		const response = await api.get<FriendListResponse>(SOCIAL.MY_FRIENDS);
		return response.data;
	},

	async removeFriend(friendId: string): Promise<ApiResponse<{ message: string }>> {
		const response = await api.delete<ApiResponse<{ message: string }>>(SOCIAL.REMOVE_FRIEND(friendId));
		return response.data;
	},

	async blockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
		const response = await api.post<ApiResponse<{ message: string }>>(SOCIAL.BLOCK(userId));
		return response.data;
	},

	async unblockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
		const response = await api.delete<ApiResponse<{ message: string }>>(SOCIAL.BLOCK(userId));
		return response.data;
	},

	async getBlockedUsers(): Promise<BlockedUsersResponse> {
		const response = await api.get<BlockedUsersResponse>(SOCIAL.BLOCKED_USERS);
		return response.data;
	},
};

export default socialService;
