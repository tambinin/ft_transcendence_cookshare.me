import db from "../utils/dbPlugin";
import { BadRequestError, NotFoundError, ConflictError, NotificationType } from "@transcendence/common";
import { notifyUser } from "../utils/notifyUser";

export async function followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new BadRequestError("You cannot follow yourself");
    }
    const followingUser = await db.user.findUnique({
        where: { id: followingId }
    });
    if (!followingUser) {
        throw new NotFoundError("User to follow not found");
    }
    try {
        const follow = await db.follow.create({
            data: {
                followerId,
                followingId
            }
        });

        const follower = await db.user.findUnique({ where: { id: followerId }, select: { username: true, avatarUrl: true } });
        notifyUser(
            followingId,
            NotificationType.NEW_FOLLOWER,
            'New Follower',
            `${follower?.username || 'Someone'} started following you`,
            { userId: followerId, username: follower?.username || 'Someone', avatarUrl: follower?.avatarUrl || null }
        );

        return follow;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ConflictError("You are already following this user");
        }
        throw error;
    }
}

export async function unfollowUser(followerId: string, followingId: string) {
    try {
        const follow = await db.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId
                }
            }
        });
        return follow;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new NotFoundError("You are not following this user");
        }
        throw error;
    }
}

export async function getFollowers(userId: string) {
    const followers = await db.follow.findMany({
        where: { followingId: userId },
        include: {
            follower: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    isOnline: true
                }
            }
        }
    });
    return followers.map(f => f.follower);
}

export async function getFollowing(userId: string) {
    const following = await db.follow.findMany({
        where: { followerId: userId },
        include: {
            following: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    isOnline: true
                }
            }
        }
    });
    return following.map(f => f.following);
}

export async function checkIsFollowing(followerId: string, followingId: string) {
    const follow = await db.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId
            }
        }
    });
    return !!follow;
}