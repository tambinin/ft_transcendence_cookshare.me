import { FastifyRequest, FastifyReply } from "fastify";
import {
    sendCreated,
    sendDeleted,
    sendSuccess,
    sendError
 } from "@transcendence/common";
import {
    createComment,
    getCommentsByRecipeId,
    updateComment,
    deleteComment,
    createReplyToComment
} from "../services/comment.service";
import {
    NotFoundError,
    ForbiddenError,
    UnauthorizedError
} from "@transcendence/common";
import { notifyRecipeRoom } from "../utils/notifyWebsocket";

export async function getComments(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };
    const { page, limit } = request.query as {
        page?: string;
        limit?: string;
    };
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const commentsData = await getCommentsByRecipeId(
        id,
        pageNum,
        limitNum
    );
    sendSuccess(reply, commentsData, "Comments retrieved successfully");
}

export async function createCommentHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };
    const userId  = request.user!.id;
    if (!userId) {
        throw new UnauthorizedError("User not authenticated");
    }
    if (!content || content.trim().length === 0) {
        return sendError(reply, "Content cannot be empty", 400);
    }
    const comment = await createComment(
        id,
        userId,
        content
    );
    notifyRecipeRoom(id, 'new_comment', { recipeId: id, comment }).catch(() => {});
    sendCreated(reply, comment, "Comment created successfully");
}

export async function updateCommentHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id, commentId } = request.params as {
        id: string;
        commentId: string
    };
    const { content } = request.body as { content: string };
    const userId = request.user!.id;
    if (!userId) {
        throw new UnauthorizedError("User not authenticated");
    }
    if (!content || content.trim().length === 0) {
        return sendError(reply, "Content cannot be empty", 400);
    }
    const updatedComment = await updateComment(
        commentId,
        userId,
        content
    );
    notifyRecipeRoom(id, 'comment_updated', { recipeId: id, comment: updatedComment }).catch(() => {});
    sendSuccess(reply, updatedComment, "Comment updated successfully");
}

export async function deleteCommentHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id, commentId } = request.params as {
        id: string;
        commentId: string
    };
    const userId = request.user!.id;
    if (!userId) {
        throw new UnauthorizedError("User not authenticated");
    }
    await deleteComment(
        commentId,
        userId
    );
    notifyRecipeRoom(id, 'comment_deleted', { recipeId: id, commentId }).catch(() => {});
    sendDeleted(reply, null, "Comment deleted successfully");
}

export async function createReplyHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id, commentId } = request.params as {
        id: string;
        commentId: string
    };
    const { content } = request.body as { content: string };
    const userId = request.user!.id;
    if (!userId) {
        throw new UnauthorizedError("User not authenticated");
    }
    if (!content || content.trim().length === 0) {
        return sendError(reply, "Content cannot be empty", 400);
    }
    const replyComment = await createReplyToComment(
        commentId,
        userId,
        content
    );
    notifyRecipeRoom(id, 'new_comment', { recipeId: id, comment: { ...replyComment, parentId: commentId } }).catch(() => {});
    sendCreated(reply, replyComment, "Reply created successfully");
}