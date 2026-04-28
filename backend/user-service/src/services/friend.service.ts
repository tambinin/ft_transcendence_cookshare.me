
import db from "../utils/dbPlugin";
import { BadRequestError, NotFoundError, UnauthorizedError, NotificationType, ConflictError } from "@transcendence/common";
import { notifyUser } from "../utils/notifyUser";

export async function sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
        throw new BadRequestError("You cannot send a friend request to yourself");
    }
    const receiver = await db.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
        throw new NotFoundError("User not found");
    }
    const existingRequest = await db.friendRequest.findFirst({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }
    });
    if (existingRequest) {
        if (existingRequest.status === 'ACCEPTED') {
            throw new ConflictError("You are already friends");
        }
        if (existingRequest.status === 'PENDING') {
            throw new ConflictError("A friend request is already pending");
        }
        if (existingRequest.status === 'REJECTED') {
            return await db.friendRequest.update({
                where: { id: existingRequest.id },
                data: {
                    senderId,
                    receiverId,
                    status: 'PENDING'
                }
            });
        }
    }
    const request = await db.friendRequest.create({
        data: {
            senderId,
            receiverId,
            status: 'PENDING'
        }
    });

    const sender = await db.user.findUnique({ where: { id: senderId }, select: { username: true, avatarUrl: true } });
    notifyUser(
        receiverId,
        NotificationType.NEW_FRIEND_REQUEST,
        'New Friend Request',
        `${sender?.username || 'Someone'} sent you a friend request`,
        { userId: senderId, senderId, username: sender?.username || 'Someone', avatarUrl: sender?.avatarUrl || null, requestId: request.id }
    );

    return request;
}

export async function acceptFriendRequest(requestId: string, userId: string) {
    const request = await db.friendRequest.findUnique({ where: { id: requestId } });
    if (!request) {
        throw new NotFoundError("Friend request not found");
    }
    if (request.receiverId !== userId) {
        throw new BadRequestError("You are not the receiver of this friend request");
    }
    if (request.status !== 'PENDING') {
        throw new BadRequestError("Friend request is not pending");
    }
    const updatedRequest = await db.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
    });

    const acceptor = await db.user.findUnique({ where: { id: userId }, select: { username: true, avatarUrl: true } });
    notifyUser(
        request.senderId,
        NotificationType.FRIEND_REQUEST_ACCEPTED,
        'Friend Request Accepted',
        `${acceptor?.username || 'Someone'} accepted your friend request`,
        { userId, username: acceptor?.username || 'Someone', avatarUrl: acceptor?.avatarUrl || null, acceptorId: userId }
    );

    return updatedRequest;
}

export async function rejectFriendRequest(requestId: string, userId: string) {
    const request = await db.friendRequest.findUnique({ where: { id: requestId } });
    if (!request) {
        throw new NotFoundError("Friend request not found");
    }
    if (request.receiverId !== userId) {
        throw new BadRequestError("You are not the receiver of this friend request");
    }
    if (request.status !== 'PENDING') {
        throw new BadRequestError("Friend request is not pending");
    }
    const updatedRequest = await db.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
    });

    const rejector = await db.user.findUnique({ where: { id: userId }, select: { username: true } });
    notifyUser(
        request.senderId,
        NotificationType.FRIEND_REQUEST_REJECTED,
        'Friend Request Declined',
        `${rejector?.username || 'Someone'} declined your friend request`,
        { rejectorId: userId }
    );

    return updatedRequest;
}

export async function removeFriend(userId: string, friendId: string) {
    const request = await db.friendRequest.findFirst({
        where: {
            OR: [
                { senderId: userId, receiverId: friendId, status: 'ACCEPTED' },
                { senderId: friendId, receiverId: userId, status: 'ACCEPTED' }
            ]
        }
    });

    if (!request) {
        throw new NotFoundError("Friendship not found");
    }

    await db.friendRequest.delete({ where: { id: request.id } });
    return { message: "Friend removed" };
}

export async function getFriends(userId: string) {
    const requests = await db.friendRequest.findMany({
        where: {
            OR: [
                { senderId: userId, status: 'ACCEPTED' },
                { receiverId: userId, status: 'ACCEPTED' }
            ]
        },
        include: {
            sender: { select: { id: true, username: true, avatarUrl: true, isOnline: true } },
            receiver: { select: { id: true, username: true, avatarUrl: true, isOnline: true } }
        }
    });

    return requests.map(req => {
        if (req.senderId === userId) return req.receiver;
        return req.sender;
    });
}

export async function getFriendRequests(userId: string) {
    const requests = await db.friendRequest.findMany({
        where: {
            receiverId: userId,
            status: 'PENDING'
        },
        include: {
            sender: { select: { id: true, username: true, avatarUrl: true } }
        }
    });
    return requests;
}

export async function getSentFriendRequests(userId: string) {
    const requests = await db.friendRequest.findMany({
        where: {
            senderId: userId,
            status: 'PENDING'
        },
        include: {
            receiver: { select: { id: true, username: true, avatarUrl: true } }
        }
    });
    return requests;
}

export async function cancelFriendRequest(requestId: string, userId: string) {
    const request = await db.friendRequest.findUnique({ where: { id: requestId } });
    if (!request) {
        throw new NotFoundError("Friend request not found");
    }
    if (request.senderId !== userId) {
        throw new BadRequestError("You are not the sender of this friend request");
    }
    if (request.status !== 'PENDING') {
        throw new BadRequestError("Friend request is not pending");
    }
    await db.friendRequest.delete({ where: { id: requestId } });
    return { message: "Friend request cancelled" };
}
