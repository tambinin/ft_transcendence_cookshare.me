import { FastifyRequest, FastifyReply } from "fastify";
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkIsFollowing
} from "../services/follow.service";
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriends,
    getFriendRequests,
    getSentFriendRequests,
    cancelFriendRequest
} from "../services/friend.service";
import {
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkIsBlocked
} from "../services/block.service";
import {
    sendSuccess,
    sendCreated
} from "@transcendence/common";
import { z } from "zod";

// ==================== SCHEMAS ====================

export const friendRequestSchema = z.object({
    receiverId: z.string().min(1, "Receiver ID is required")
});

// ==================== FOLLOW ====================

export async function followUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const followerId = request.user!.id;
    const result = await followUser(followerId, id);
    sendCreated(reply, result, 'User followed successfully');
}

export async function unfollowUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const followerId = request.user!.id;
    const result = await unfollowUser(followerId, id);
    sendSuccess(reply, result, 'User unfollowed successfully');
}

export async function getFollowersHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const followers = await getFollowers(id);
    sendSuccess(reply, followers, 'Followers retrieved successfully');
}

export async function getMyFollowersHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const followers = await getFollowers(userId);
    sendSuccess(reply, followers, 'Followers retrieved successfully');
}

export async function getFollowingHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const following = await getFollowing(id);
    sendSuccess(reply, following, 'Following list retrieved successfully');
}

export async function getMyFollowingHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const following = await getFollowing(userId);
    sendSuccess(reply, following, 'Following list retrieved successfully');
}

export async function checkIsFollowingHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const followerId = request.user!.id;
    const isFollowing = await checkIsFollowing(followerId, id);
    sendSuccess(reply, { isFollowing }, 'Follow status retrieved successfully');
}

// ==================== FRIENDS ====================

export async function sendFriendRequestHandler(request: FastifyRequest, reply: FastifyReply) {
    const { receiverId } = request.body as z.infer<typeof friendRequestSchema>;
    const senderId = request.user!.id;
    const result = await sendFriendRequest(senderId, receiverId);
    sendCreated(reply, result, 'Friend request sent successfully');
}

export async function acceptFriendRequestHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const result = await acceptFriendRequest(id, userId);
    sendSuccess(reply, result, 'Friend request accepted successfully');
}

export async function rejectFriendRequestHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const result = await rejectFriendRequest(id, userId);
    sendSuccess(reply, result, 'Friend request rejected successfully');
}

export async function removeFriendHandler(request: FastifyRequest, reply: FastifyReply) {
    const { friendId } = request.params as { friendId: string };
    const userId = request.user!.id;
    const result = await removeFriend(userId, friendId);
    sendSuccess(reply, result, 'Friend removed successfully');
}

export async function getFriendsHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const friends = await getFriends(userId);
    sendSuccess(reply, friends, 'Friends list retrieved successfully');
}

export async function getFriendRequestsHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const requests = await getFriendRequests(userId);
    sendSuccess(reply, requests, 'Friend requests retrieved successfully');
}

export async function getSentFriendRequestsHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const requests = await getSentFriendRequests(userId);
    sendSuccess(reply, requests, 'Sent friend requests retrieved successfully');
}

export async function cancelFriendRequestHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const result = await cancelFriendRequest(id, userId);
    sendSuccess(reply, result, 'Friend request cancelled successfully');
}

// ==================== BLOCK ====================

export async function blockUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const result = await blockUser(userId, id);
    sendCreated(reply, result, 'User blocked successfully');
}

export async function unblockUserHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const result = await unblockUser(userId, id);
    sendSuccess(reply, result, 'User unblocked successfully');
}

export async function getBlockedUsersHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const blockedUsers = await getBlockedUsers(userId);
    sendSuccess(reply, blockedUsers, 'Blocked users retrieved successfully');
}

// ==================== INTERNAL ====================

export async function internalCheckBlockStatusHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id, otherId } = request.params as { id: string, otherId: string };
    const isBlockedBy = await checkIsBlocked(otherId, id); // Is 'id' blocked by 'otherId'?
    const hasBlocked = await checkIsBlocked(id, otherId);  // Has 'id' blocked 'otherId'?

    sendSuccess(reply, { isBlockedBy, hasBlocked }, 'Block status retrieved');
}
