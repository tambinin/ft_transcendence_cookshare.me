import { useState, useCallback } from 'react';
import socialService from '../services/social.service';
import logger from '../utils/logger';
import type {
	Friend,
	FollowUser,
	FriendRequest,
	SearchUser,
} from '../types/social.type';

interface UseSocialReturn {
	isLoading: boolean;
	error: string | null;
	searchUsers: (query: string, limit?: number) => Promise<SearchUser[]>;
	followUser: (userId: string) => Promise<void>;
	unfollowUser: (userId: string) => Promise<void>;
	checkIsFollowing: (userId: string) => Promise<boolean>;
	sendFriendRequest: (userId: string) => Promise<void>;
	acceptFriendRequest: (requestId: string) => Promise<void>;
	rejectFriendRequest: (requestId: string) => Promise<void>;
	removeFriend: (friendId: string) => Promise<void>;
	getMyFriends: () => Promise<Friend[]>;
	getMyFollowers: () => Promise<FollowUser[]>;
	getMyFollowing: () => Promise<FollowUser[]>;
	getMyFriendRequests: () => Promise<FriendRequest[]>;
	clearError: () => void;
}

export function useSocial(): UseSocialReturn {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleError = (err: unknown, fallback: string) => {
		const message = err instanceof Error ? err.message : fallback;
		setError(message);
		logger.error('[useSocial]', message, err);
	};
	const searchUsers = useCallback(async (query: string, limit = 10): Promise<SearchUser[]> => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await socialService.searchUsers(query, limit);
			return response.data;
		} catch (err) {
			handleError(err, 'Search failed. Be less generic.');
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);
	const followUser = useCallback(async (userId: string): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			await socialService.followUser(userId);
		} catch (err) {
			handleError(err, "Can't follow them. They already know you're weird.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const unfollowUser = useCallback(async (userId: string): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			await socialService.unfollowUser(userId);
		} catch (err) {
			handleError(err, "Can't unfollow them.You are bound for eternity.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const checkIsFollowing = useCallback(async (userId: string): Promise<boolean> => {
		try {
			const response = await socialService.isFollowing(userId);
			return response.data.isFollowing;
		} catch {
			return false;
		}
	}, []);
	const sendFriendRequest = useCallback(async (userId: string): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			await socialService.sendFriendRequest(userId);
		} catch (err) {
			handleError(err, "Can't send friend request. Stay lonely.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const acceptFriendRequest = useCallback(async (requestId: string): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			await socialService.acceptFriendRequest(requestId);
		} catch (err) {
			handleError(err, "Can't accept friend request. Too awkward.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const rejectFriendRequest = useCallback(async (requestId: string): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			await socialService.rejectFriendRequest(requestId);
		} catch (err) {
			handleError(err, "Can't reject friend request. You have to be friends now.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const removeFriend = useCallback(async (friendId: string): Promise<void> => {
		setIsLoading(true);
		setError(null);
		try {
			await socialService.removeFriend(friendId);
		} catch (err) {
			handleError(err, "Can't remove friend.Trapped in friendship.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);
	const getMyFriends = useCallback(async (): Promise<Friend[]> => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await socialService.getMyFriends();
			return response.data;
		} catch (err) {
			handleError(err, "Can't load friends list.Not that it's long anyway.");
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	const getMyFollowers = useCallback(async (): Promise<FollowUser[]> => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await socialService.getMyFollowers();
			return response.data;
		} catch (err) {
			handleError(err, "Can't load followers.All 0 of them.");
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	const getMyFollowing = useCallback(async (): Promise<FollowUser[]> => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await socialService.getMyFollowing();
			return response.data;
		} catch (err) {
			handleError(err, "Can't load following.You follow too many people.");
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	const getMyFriendRequests = useCallback(async (): Promise<FriendRequest[]> => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await socialService.getMyFriendRequests();
			return response.data;
		} catch (err) {
			handleError(err, "Can't load friend requests.Still 0.");
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearError = useCallback(() => setError(null), []);

	return {
		isLoading,
		error,
		searchUsers,
		followUser,
		unfollowUser,
		checkIsFollowing,
		sendFriendRequest,
		acceptFriendRequest,
		rejectFriendRequest,
		removeFriend,
		getMyFriends,
		getMyFollowers,
		getMyFollowing,
		getMyFriendRequests,
		clearError,
	};
}

export default useSocial;
