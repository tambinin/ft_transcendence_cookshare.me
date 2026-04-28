import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { useFeedRefresh } from '../../contexts/feed.context';
import userService from '../../services/user.service';
import socialService from '../../services/social.service';
import api from '../../services/api.client';
import recipeService from '../../services/recipe.service';
import logger from '../../utils/logger';
import type { User } from '../../types/user.type';
import type { RecipeSummary } from '../../types/recipe.type';
import type { Friend, FriendRequest } from '../../types/social.type';

export type TabType = 'recipes' | 'friends';

export interface GamificationData {
	xp: number;
	level: number;
	badges: { id: string; badge: { id: string; name: string; description: string; iconUrl: string }; awardedAt: string }[];
}

export function useProfile() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user: currentUser } = useAuth();
	const { seedOnlineStatus } = useFeedRefresh();
	const [activeTab, setActiveTab] = useState<TabType>('recipes');
	const [actionLoading, setActionLoading] = useState(false);
	const [isFriend, setIsFriend] = useState(false);
	const [pendingRequest, setPendingRequest] = useState<FriendRequest | null>(null);
	const [sentRequest, setSentRequest] = useState<FriendRequest | null>(null);
	const [profileUser, setProfileUser] = useState<User | null>(null);
	const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [friendsCount, setFriendsCount] = useState(0);
	const [isBlocked, setIsBlocked] = useState(false);
	const [blockLoading, setBlockLoading] = useState(false);
	const [gamification, setGamification] = useState<GamificationData | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isOwnProfile = currentUser?.id === id;
	const showActionError = (msg: string) => {
		setActionError(msg);
		setTimeout(() => setActionError(null), 3000);
	};

	const fetchProfileData = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		setError(null);
		try {
			const userResponse = await userService.getUserById(id);
			setProfileUser(userResponse.data);

			// Seed online status so OnlineAvatar shows the dot
			if (userResponse.data?.id) {
				seedOnlineStatus(userResponse.data.id, userResponse.data.isOnline);
			}

			const recipesResponse = await recipeService.getByAuthor(id);
			const recipesData = recipesResponse?.data as unknown;
			setRecipes(
				Array.isArray(recipesData) ? recipesData
				: Array.isArray((recipesData as Record<string, unknown>)?.recipes) ? ((recipesData as Record<string, RecipeSummary[]>).recipes)
				: []
			);

			if (currentUser) {
				try {
					const myFriendsRes = await socialService.getMyFriends();
					const myFriendsData = Array.isArray(myFriendsRes.data) ? myFriendsRes.data : [];

					// Seed online status for all friends
					for (const f of myFriendsData) {
						seedOnlineStatus(f.id, f.isOnline);
					}

					if (currentUser.id === id) {
						setFriends(myFriendsData);
						setFriendsCount(myFriendsData.length);
					} else {
						setFriends([]);
						setFriendsCount(0);
					}

					if (currentUser.id !== id) {
						const isAlreadyFriend = myFriendsData.some(f => f.id === id);
						setIsFriend(isAlreadyFriend);

						if (!isAlreadyFriend) {
							try {
								const requestsRes = await socialService.getMyFriendRequests();
								const requests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
								const pendingFromUser = requests.find(r => r.senderId === id || r.sender?.id === id);
								setPendingRequest(pendingFromUser || null);
							} catch (reqErr) {
								logger.warn('Could not fetch friend requests:', reqErr);
								setPendingRequest(null);
							}

							try {
								const sentRes = await socialService.getMySentFriendRequests();
								const sentRequests = Array.isArray(sentRes.data) ? sentRes.data : [];
								const sentToUser = sentRequests.find(r => r.receiverId === id || r.receiver?.id === id);
								setSentRequest(sentToUser || null);
							} catch (sentErr) {
								logger.warn('Could not fetch sent friend requests:', sentErr);
								setSentRequest(null);
							}
						} else {
							setPendingRequest(null);
							setSentRequest(null);
						}
					}
				} catch (friendsErr) {
					logger.warn('Could not fetch friends:', friendsErr);
					setFriends([]);
					setFriendsCount(0);
				}
			}

			try {
				const gamRes = await api.get(`users/${id}/gamification`);
				setGamification(gamRes.data?.data || gamRes.data);
			} catch {
				setGamification(null);
			}

			if (currentUser && currentUser.id !== id) {
				try {
					const blockedRes = await socialService.getBlockedUsers();
					const blockedList = Array.isArray(blockedRes.data) ? blockedRes.data : [];
					setIsBlocked(blockedList.some(b => b.id === id));
				} catch {
					setIsBlocked(false);
				}
			}
		} catch (err) {
			logger.error('Failed to load profile:', err);
			setError('Unable to load this profile.');
		} finally {
			setLoading(false);
		}
	}, [id, currentUser, seedOnlineStatus]);

	useEffect(() => {
		fetchProfileData();
	}, [fetchProfileData]);

	const handleAddFriend = async () => {
		if (!id || actionLoading) return;
		setActionLoading(true);
		try {
			const response = await socialService.sendFriendRequest(id);
			setSentRequest(response.data || { id: 'temp', senderId: currentUser!.id, receiverId: id, status: 'PENDING', createdAt: new Date().toISOString() });
		} catch (err) {
			logger.error('Failed to send friend request:', err);
			showActionError("Unable to send friend request.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancelRequest = async () => {
		if (!sentRequest || actionLoading) return;
		setActionLoading(true);
		try {
			await socialService.cancelFriendRequest(sentRequest.id);
			setSentRequest(null);
		} catch (err) {
			logger.error('Failed to cancel friend request:', err);
			showActionError("Unable to cancel request.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleRemoveFriend = async () => {
		if (!id || actionLoading) return;
		setActionLoading(true);
		try {
			await socialService.removeFriend(id);
			setIsFriend(false);
			setFriendsCount(prev => Math.max(0, prev - 1));
			setFriends(prev => prev.filter(f => f.id !== id));
		} catch (err) {
			logger.error('Failed to remove friend:', err);
			showActionError("Unable to remove this friend.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleConfirmFriend = async () => {
		if (!pendingRequest || actionLoading) return;
		setActionLoading(true);
		try {
			await socialService.acceptFriendRequest(pendingRequest.id);
			setIsFriend(true);
			setPendingRequest(null);
			setFriendsCount(prev => prev + 1);
			fetchProfileData();
		} catch (err) {
			logger.error('Failed to accept friend request:', err);
			showActionError("Unable to accept request.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleToggleBlock = async () => {
		if (!id || blockLoading) return;
		setBlockLoading(true);
		try {
			if (isBlocked) {
				await socialService.unblockUser(id);
				setIsBlocked(false);
			} else {
				await socialService.blockUser(id);
				setIsBlocked(true);
				setIsFriend(false);
				setPendingRequest(null);
				setSentRequest(null);
			}
			fetchProfileData();
		} catch (err) {
			logger.error('Failed to toggle block:', err);
			showActionError("Unable to block/unblock this user.");
		} finally {
			setBlockLoading(false);
		}
	};

	return {
		id, navigate, currentUser, isOwnProfile,
		activeTab, setActiveTab, actionLoading,
		isFriend, pendingRequest, sentRequest,
		profileUser, recipes, friends, friendsCount,
		isBlocked, blockLoading,
		gamification, actionError,
		loading, error,
		handleAddFriend, handleCancelRequest, handleRemoveFriend, handleConfirmFriend,
		handleToggleBlock,
	};
}
