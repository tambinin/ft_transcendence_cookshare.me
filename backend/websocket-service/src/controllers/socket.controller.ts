import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { emitToUser, emitToRoom, getIO } from '../ws/ws.plugin';
import { sendSuccess } from '@transcendence/common';

export const triggerEventSchema = z.object({
    userId: z.string().min(1),
    event: z.string().min(1),
    data: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).or(z.string()).or(z.number()).or(z.boolean()).or(z.null()),
});

export const triggerRoomEventSchema = z.object({
    room: z.string().min(1),
    event: z.string().min(1),
    data: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).or(z.string()).or(z.number()).or(z.boolean()).or(z.null()),
});

export const triggerBroadcastSchema = z.object({
    event: z.string().min(1),
    data: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).or(z.string()).or(z.number()).or(z.boolean()).or(z.null()),
});

export async function triggerEventHandler(request: FastifyRequest, reply: FastifyReply) {
    const { userId, event, data } = request.body as z.infer<typeof triggerEventSchema>;
    emitToUser(userId, event, data);
    sendSuccess(reply, { dispatched: true }, 'Event triggered successfully');
}

export async function triggerRoomEventHandler(request: FastifyRequest, reply: FastifyReply) {
    const { room, event, data } = request.body as z.infer<typeof triggerRoomEventSchema>;
    emitToRoom(room, event, data);
    sendSuccess(reply, { dispatched: true }, 'Room event triggered successfully');
}

export async function triggerBroadcastHandler(request: FastifyRequest, reply: FastifyReply) {
    const { event, data } = request.body as z.infer<typeof triggerBroadcastSchema>;
    const io = getIO();
    io.emit(event, data);
    sendSuccess(reply, { dispatched: true }, 'Broadcast event triggered successfully');
}
