import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendSuccess } from "@transcendence/common";
import { searchIngredients } from "../services/search.service";

const searchSchema = z.object({
    q: z.string().min(2).max(50),
    limit: z.coerce.number().min(1).max(50).default(10)
});

export async function searchIngredientsHandler(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as any;

    const parsed = searchSchema.safeParse(query);

    if (!parsed.success) {
        return sendSuccess(reply, []);
    }

    const { q, limit } = parsed.data;
    const results = await searchIngredients(q, limit);
    sendSuccess(reply, results);
}
