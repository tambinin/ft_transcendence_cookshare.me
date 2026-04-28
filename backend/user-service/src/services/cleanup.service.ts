import db from "../utils/dbPlugin";
import { FastifyInstance } from "fastify";

export async function cleanupUnverifiedUsers(log: FastifyInstance['log']) {
    try {
        const EXPIRATION_MINUTES = 2;
        const expirationDate = new Date(Date.now() - (EXPIRATION_MINUTES * 60 * 1000));

        const result = await db.user.deleteMany({
            where: {
                isEmailVerified: false,
                createdAt: {
                    lt: expirationDate
                }
            }
        });

        if (result.count > 0) {
            log.info(`[Cleanup] Deleted ${result.count} unverified users older than 24h.`);
        }
    } catch (error: any) {
        log.error(error, `[Cleanup] Error during unverified users cleanup`);
    }
}

export function startCleanupTask(app: FastifyInstance) {
    const ONE_HOUR = 60 * 1000;

    cleanupUnverifiedUsers(app.log);

    const interval = setInterval(() => {
        cleanupUnverifiedUsers(app.log);
    }, ONE_HOUR);
    app.addHook('onClose', (instance, done) => {
        clearInterval(interval);
        done();
    });
}
