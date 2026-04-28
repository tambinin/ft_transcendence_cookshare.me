import db from "../utils/dbPlugin";
import { BadRequestError, NotFoundError, ConflictError } from "@transcendence/common";
import { unfollowUser, checkIsFollowing } from "./follow.service";
import { removeFriend } from "./friend.service";

export async function blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
        throw new BadRequestError("You cannot block yourself");
    }

    const userToBlock = await db.user.findUnique({ where: { id: blockedId } });
    if (!userToBlock) {
        throw new NotFoundError("User not found");
    }

    const existingBlock = await db.block.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId
            }
        }
    });

    if (existingBlock) {
        throw new ConflictError("User is already blocked");
    }

    const block = await db.block.create({
        data: {
            blockerId,
            blockedId
        }
    });

    try {
        await unfollowUser(blockerId, blockedId);
    } catch (e) { }

    try {
        await unfollowUser(blockedId, blockerId);
    } catch (e) { }

    try {
        await removeFriend(blockerId, blockedId);
    } catch (e) { }

    return block;
}

export async function unblockUser(blockerId: string, blockedId: string) {
    try {
        const block = await db.block.delete({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId
                }
            }
        });
        return block;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new NotFoundError("User is not blocked");
        }
        throw error;
    }
}

export async function getBlockedUsers(userId: string) {
    const blocks = await db.block.findMany({
        where: { blockerId: userId },
        include: {
            blocked: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true
                }
            }
        }
    });
    return blocks.map(b => b.blocked);
}

export async function checkIsBlocked(blockerId: string, blockedId: string) {
    const block = await db.block.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId
            }
        }
    });
    return !!block;
}
