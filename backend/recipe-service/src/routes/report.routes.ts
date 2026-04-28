import { FastifyInstance } from "fastify";
import {
    reportRecipeHandler,
    reportCommentHandler,
    getReportsHandler,
    getReportStatsHandler,
    getReportByIdHandler,
    updateReportStatusHandler,
    createReportSchema,
    updateReportStatusSchema
} from "../controllers/report.controller";
import {
    authMiddleware,
    adminMiddleware,
    bodyValidator
} from "@transcendence/common";

export async function reportRoutes(app: FastifyInstance) {

    app.post("/recipes/:id/report", {
        preHandler: [authMiddleware, bodyValidator(createReportSchema)]
    }, reportRecipeHandler);

    app.post("/comments/:id/report", {
        preHandler: [authMiddleware, bodyValidator(createReportSchema)]
    }, reportCommentHandler);

    app.get("/admin/reports", {
        preHandler: [authMiddleware, adminMiddleware]
    }, getReportsHandler);

    app.get("/admin/reports/stats", {
        preHandler: [authMiddleware, adminMiddleware]
    }, getReportStatsHandler);

    app.get("/admin/reports/:id", {
        preHandler: [authMiddleware, adminMiddleware]
    }, getReportByIdHandler);

    app.put("/admin/reports/:id", {
        preHandler: [authMiddleware, adminMiddleware, bodyValidator(updateReportStatusSchema)]
    }, updateReportStatusHandler);
}
