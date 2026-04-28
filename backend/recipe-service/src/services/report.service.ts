import db from "../utils/db";
import { ReportType, ReportStatus } from "../generated/prisma";

export async function createReport(data: {
    reporterId: string;
    targetType: ReportType;
    targetId: string;
    reason: string;
    description?: string;
}) {
    const existing = await db.report.findFirst({
        where: {
            reporterId: data.reporterId,
            targetType: data.targetType,
            targetId: data.targetId,
            status: { in: ['PENDING', 'REVIEWED'] }
        }
    });

    if (existing) {
        return { alreadyReported: true, report: existing };
    }

    const report = await db.report.create({ data });
    return { alreadyReported: false, report };
}

export async function getReportsByStatus(
    status: ReportStatus | undefined,
    page: number = 1,
    limit: number = 20
) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        db.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        db.report.count({ where })
    ]);

    return {
        reports,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getReportById(id: string) {
    return db.report.findUnique({ where: { id } });
}

export async function updateReportStatus(
    id: string,
    status: ReportStatus,
    reviewedBy: string
) {
    return db.report.update({
        where: { id },
        data: {
            status,
            reviewedBy,
            reviewedAt: new Date()
        }
    });
}

export async function getReportStats() {
    const [pending, reviewed, resolved, dismissed] = await Promise.all([
        db.report.count({ where: { status: 'PENDING' } }),
        db.report.count({ where: { status: 'REVIEWED' } }),
        db.report.count({ where: { status: 'RESOLVED' } }),
        db.report.count({ where: { status: 'DISMISSED' } })
    ]);

    return { pending, reviewed, resolved, dismissed, total: pending + reviewed + resolved + dismissed };
}
