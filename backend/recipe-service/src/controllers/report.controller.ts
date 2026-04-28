import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
    createReport,
    getReportsByStatus,
    getReportById,
    updateReportStatus,
    getReportStats
} from "../services/report.service";
import { getRecipeById } from "../services/recipe.service";
import { getCommentById } from "../services/comment.service";
import {
    sendSuccess,
    sendCreated,
    NotFoundError,
    ForbiddenError,
    ConflictError
} from "@transcendence/common";

const reportReasons = [
    'SPAM',
    'INAPPROPRIATE_CONTENT',
    'HARASSMENT',
    'COPYRIGHT',
    'MISLEADING',
    'OTHER'
] as const;

export const createReportSchema = z.object({
    reason: z.enum(reportReasons),
    description: z.string().max(1000).optional()
});

export const updateReportStatusSchema = z.object({
    status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED'])
});

export async function reportRecipeHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof createReportSchema>;

    const recipe = await getRecipeById(id);
    if (!recipe) {
        throw new NotFoundError("Recipe not found");
    }

    if (recipe.authorId === request.user!.id) {
        throw new ForbiddenError("You cannot report your own content");
    }

    const result = await createReport({
        reporterId: request.user!.id,
        targetType: 'RECIPE',
        targetId: id,
        reason: body.reason,
        description: body.description
    });

    if (result.alreadyReported) {
        throw new ConflictError("You have already reported this content");
    }

    sendCreated(reply, result.report, "Recipe reported successfully");
}

export async function reportCommentHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof createReportSchema>;

    const comment = await getCommentById(id);
    if (!comment) {
        throw new NotFoundError("Comment not found");
    }

    if (comment.userId === request.user!.id) {
        throw new ForbiddenError("You cannot report your own content");
    }

    const result = await createReport({
        reporterId: request.user!.id,
        targetType: 'COMMENT',
        targetId: id,
        reason: body.reason,
        description: body.description
    });

    if (result.alreadyReported) {
        throw new ConflictError("You have already reported this content");
    }

    sendCreated(reply, result.report, "Comment reported successfully");
}

export async function getReportsHandler(request: FastifyRequest, reply: FastifyReply) {
    const { status, page, limit } = request.query as {
        status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
        page?: string;
        limit?: string;
    };

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await getReportsByStatus(status, pageNum, limitNum);
    sendSuccess(reply, result, "Reports retrieved");
}

export async function getReportStatsHandler(request: FastifyRequest, reply: FastifyReply) {
    const stats = await getReportStats();
    sendSuccess(reply, stats, "Report stats retrieved");
}

export async function getReportByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const report = await getReportById(id);
    if (!report) {
        throw new NotFoundError("Report not found");
    }

    sendSuccess(reply, report, "Report retrieved");
}

export async function updateReportStatusHandler(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { status } = request.body as z.infer<typeof updateReportStatusSchema>;

    const existing = await getReportById(id);
    if (!existing) {
        throw new NotFoundError("Report not found");
    }

    const updated = await updateReportStatus(id, status, request.user!.id);
    sendSuccess(reply, updated, "Report status updated");
}
