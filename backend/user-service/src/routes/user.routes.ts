import { FastifyInstance } from "fastify";
import {
    authMiddleware,
    adminOnlyMiddleware,
    superAdminOnlyMiddleware,
    bodyValidator,
} from "@transcendence/common";
import {
    // Schemas
    createUserSchema,
    updateUserSchema,
    updateRoleSchema,
    setRoleSchema,
    changePasswordSchema,
    updatePasswordSchema,
    tokenSchema,
    userIdSchema,
    statusSchema,
    // User CRUD
    getAllUsersHandler,
    searchUsersHandler,
    getUserByIdHandler,
    createUserHandler,
    getMeHandler,
    updateUserHandler,
    updateUserRoleHandler,
    getAdminsHandler,
    promoteUserHandler,
    demoteUserHandler,
    setUserRoleHandler,
    deleteUserHandler,
    // Avatar & Password
    updateAvatarHandler,
    changePasswordHandler,
    // Internal
    internalGetBatchUsersHandler,
    internalGetUserHandler,
    internalGetUserByIdentifierHandler,
    internalVerifyResetTokenHandler,
    internalUpdatePasswordHandler,
    internalGetUserByEmailHandler,
    internalCreateVerificationTokenHandler,
    internalVerifyEmailTokenHandler,
    internalUpdateUserStatusHandler,
    // API Key
    generateApiKeyHandler,
    // GDPR
    exportUserDataHandler,
    requestDeletionHandler,
    confirmDeletionHandler,
    // OAuth internal
    internalGetUserByGoogleIdHandler,
    internalLinkGoogleHandler,
    internalCreateOAuthUserHandler,
    internalUnlinkGoogleHandler,
} from "../controllers/profile.controller";
import {
    // Schemas
    friendRequestSchema,
    // Follow
    followUserHandler,
    unfollowUserHandler,
    getFollowersHandler,
    getMyFollowersHandler,
    getFollowingHandler,
    getMyFollowingHandler,
    checkIsFollowingHandler,
    // Friends
    sendFriendRequestHandler,
    acceptFriendRequestHandler,
    rejectFriendRequestHandler,
    removeFriendHandler,
    getFriendsHandler,
    getFriendRequestsHandler,
    getSentFriendRequestsHandler,
    cancelFriendRequestHandler,
    // Block
    blockUserHandler,
    unblockUserHandler,
    getBlockedUsersHandler,
    internalCheckBlockStatusHandler
} from "../controllers/friend.controller";

export async function userRoutes(app: FastifyInstance) {

    // ==================== USERS & PROFILE ====================
    app.get("/users", getAllUsersHandler);

    app.get("/users/search", searchUsersHandler);

    app.get("/users/:id", getUserByIdHandler);

    app.post("/users", createUserHandler);

    app.get("/users/me", { preHandler: authMiddleware }, getMeHandler);

    app.put("/users/:id", {
        preHandler: [authMiddleware]
    }, updateUserHandler);

    app.delete("/users/:id", { preHandler: authMiddleware }, deleteUserHandler);

    app.put("/admin/users/:id/role", {
        preHandler: [authMiddleware, adminOnlyMiddleware, bodyValidator(updateRoleSchema)]
    }, updateUserRoleHandler);

    app.get("/admin/users", {
        preHandler: [authMiddleware, adminOnlyMiddleware]
    }, getAdminsHandler);

    app.post("/admin/users/:id/promote", {
        preHandler: [authMiddleware, superAdminOnlyMiddleware]
    }, promoteUserHandler);

    app.delete("/admin/users/:id/demote", {
        preHandler: [authMiddleware, superAdminOnlyMiddleware]
    }, demoteUserHandler);

    app.post("/admin/users/set-role", {
        preHandler: [authMiddleware, adminOnlyMiddleware, bodyValidator(setRoleSchema)]
    }, setUserRoleHandler);

    app.post("/users/me/avatar", { preHandler: authMiddleware }, updateAvatarHandler);

    app.post("/users/change-password", {
        preHandler: [authMiddleware, bodyValidator(changePasswordSchema)]
    }, changePasswordHandler);

    // ==================== FOLLOW ====================
    app.post("/users/:id/follow", { preHandler: authMiddleware }, followUserHandler);

    app.delete("/users/:id/follow", { preHandler: authMiddleware }, unfollowUserHandler);

    app.get("/users/me/followers", { preHandler: authMiddleware }, getMyFollowersHandler);

    app.get("/users/me/following", { preHandler: authMiddleware }, getMyFollowingHandler);

    app.get("/users/:id/followers", getFollowersHandler);

    app.get("/users/:id/following", getFollowingHandler);

    app.get("/users/:id/is-following", { preHandler: authMiddleware }, checkIsFollowingHandler);

    // ==================== FRIENDS ====================
    app.post("/users/friend-requests", {
        preHandler: [authMiddleware, bodyValidator(friendRequestSchema)]
    }, sendFriendRequestHandler);

    app.put("/users/friend-requests/:id/accept", { preHandler: authMiddleware }, acceptFriendRequestHandler);

    app.put("/users/friend-requests/:id/reject", { preHandler: authMiddleware }, rejectFriendRequestHandler);

    app.delete("/users/friends/:friendId", { preHandler: authMiddleware }, removeFriendHandler);

    app.get("/users/me/friends", { preHandler: authMiddleware }, getFriendsHandler);

    app.get("/users/me/friend-requests", { preHandler: authMiddleware }, getFriendRequestsHandler);

    app.get("/users/me/friend-requests/sent", { preHandler: authMiddleware }, getSentFriendRequestsHandler);

    app.delete("/users/friend-requests/:id/cancel", { preHandler: authMiddleware }, cancelFriendRequestHandler);

    // ==================== BLOCK ====================
    app.post("/users/:id/block", { preHandler: authMiddleware }, blockUserHandler);

    app.delete("/users/:id/block", { preHandler: authMiddleware }, unblockUserHandler);

    app.get("/users/me/blocked", { preHandler: authMiddleware }, getBlockedUsersHandler);

    // ==================== API KEY ====================
    app.post("/users/api-key/generate", { preHandler: authMiddleware }, generateApiKeyHandler);

    // ==================== GDPR ====================
    app.get("/users/:id/export-data", { preHandler: authMiddleware }, exportUserDataHandler);

    app.post("/users/:id/request-deletion", { preHandler: authMiddleware }, requestDeletionHandler);

    app.delete("/gdpr/confirm-deletion", { preHandler: bodyValidator(tokenSchema) }, confirmDeletionHandler);

    // ==================== INTERNAL ====================
    app.get("/internal/users/batch", internalGetBatchUsersHandler);

    app.get("/internal/users/:id", internalGetUserHandler);

    app.get("/internal/users/by-identifier/:identifier", internalGetUserByIdentifierHandler);

    app.post("/internal/verify-reset-token", {
        preHandler: bodyValidator(tokenSchema)
    }, internalVerifyResetTokenHandler);

    app.post("/internal/update-password", {
        preHandler: bodyValidator(updatePasswordSchema)
    }, internalUpdatePasswordHandler);

    app.get("/internal/users/by-email-identifier/:email", internalGetUserByEmailHandler);

    app.post("/internal/create-verification-token", {
        preHandler: bodyValidator(userIdSchema)
    }, internalCreateVerificationTokenHandler);

    app.post("/internal/verify-email-token", {
        preHandler: bodyValidator(tokenSchema)
    }, internalVerifyEmailTokenHandler);

    app.put("/internal/users/:id/status", {
        preHandler: bodyValidator(statusSchema)
    }, internalUpdateUserStatusHandler);

    app.get("/internal/users/:id/block-status/:otherId", internalCheckBlockStatusHandler);

    // ==================== INTERNAL OAUTH ====================
    app.get("/internal/users/by-google-id/:googleId", internalGetUserByGoogleIdHandler);

    app.put("/internal/users/:id/link-google", internalLinkGoogleHandler);

    app.post("/internal/users/oauth", internalCreateOAuthUserHandler);

    app.delete("/internal/users/:id/unlink-google", internalUnlinkGoogleHandler);
}