import { FastifyInstance } from "fastify";
import { sendMessageController, getMessagesController, getConversationsController, markAsReadController, getUnreadCountController } from "../controllers/message.controller";
import { authMiddleware } from "@transcendence/common";

export async function chatRoutes(app: FastifyInstance) {
    app.post("/messages", { preHandler: [authMiddleware] }, sendMessageController);
    app.get("/conversations", { preHandler: [authMiddleware] }, getConversationsController);
    app.get("/messages/:otherUserId", { preHandler: [authMiddleware] }, getMessagesController);
    app.put("/messages/:conversationId/read", { preHandler: [authMiddleware] }, markAsReadController);
    app.get("/messages/unread/count", { preHandler: [authMiddleware] }, getUnreadCountController);
}
