import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { validateEnv, fetchWithTimeout } from '@transcendence/common';
import { createWsLogger } from '../ws/ws.logger';

const logger = createWsLogger('websocket-service');

const env = validateEnv();

const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || `https://recipe:${env.RECIPE_SERVICE_PORT}`;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || `https://user:${env.USER_SERVICE_PORT}`;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || `https://auth:${env.AUTH_SERVICE_PORT}`;
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || `https://chat:${env.CHAT_SERVICE_PORT}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || `https://notification:${env.NOTIFICATION_SERVICE_PORT}`;

interface ExtendedSocket extends Socket {
    userId?: string;
}

export class SocketService {
    private static io: Server;
    private static userSockets: Map<string, string[]> = new Map();

    public static initialize(app: FastifyInstance) {
        const DOMAIN = process.env.DOMAIN;
        const corsOrigins = (process.env.CORS_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
        const defaultOrigins = [
            "http://localhost:5173", "https://localhost",
            "https://cookshare.me", "https://www.cookshare.me"
        ];
        if (DOMAIN && DOMAIN !== "localhost" && DOMAIN !== "cookshare.me") {
            defaultOrigins.push(`http://${DOMAIN}:5173`, `https://${DOMAIN}:5173`, `https://${DOMAIN}`);
        }
        const allowedOrigins = [...new Set([...corsOrigins, ...defaultOrigins])];

        function isLocalNetworkOrigin(origin: string): boolean {
            try {
                const url = new URL(origin);
                const host = url.hostname;
                return (
                    host === "localhost" ||
                    host === "127.0.0.1" ||
                    host.startsWith("10.") ||
                    host.startsWith("192.168.") ||
                    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
                );
            } catch { return false; }
        }

        this.io = new Server(app.server, {
            cors: {
                origin: (origin, cb) => {
                    if (!origin) return cb(null, true);
                    if (allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
                        cb(null, true);
                    } else {
                        cb(new Error("Not allowed by CORS"), false);
                    }
                },
                methods: ["GET", "POST"],
                credentials: true
            },
            path: '/socket.io/'
        });

        this.io.use((socket: ExtendedSocket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            try {
                const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
                socket.userId = decoded.id;
                next();
            } catch (err) {
                return next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', async (socket: ExtendedSocket) => {
            if (!socket.userId) return;

            const userId = socket.userId;
            const socketId = socket.id;

            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
                await this.updateUserStatus(userId, true);
            }
            this.userSockets.get(userId)?.push(socketId);

            const roomName = `shopping_list_${userId}`;
            await socket.join(roomName);

            app.log.info(`User connected: ${userId} (Socket: ${socketId})`);

            socket.on('typing_start', ({ receiverId }: { receiverId: string }) => {
                const receiverSockets = this.userSockets.get(receiverId);
                if (receiverSockets) {
                    receiverSockets.forEach(sId => {
                        this.io.to(sId).emit('typing_start', { senderId: userId });
                    });
                }
            });

            socket.on('typing_stop', ({ receiverId }: { receiverId: string }) => {
                const receiverSockets = this.userSockets.get(receiverId);
                if (receiverSockets) {
                    receiverSockets.forEach(sId => {
                        this.io.to(sId).emit('typing_stop', { senderId: userId });
                    });
                }
            });

            socket.on('join_recipe', ({ recipeId }: { recipeId: string }) => {
                socket.join(`recipe_${recipeId}`);
            });

            socket.on('shopping_list:add_item', async (data: { name: string, quantity?: string }) => {
                if (!socket.userId) return;
                try {
                    const response = await fetchWithTimeout(`${RECIPE_SERVICE_URL}/api/v1/internal/shopping-list/items`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-internal-api-key': env.INTERNAL_API_KEY
                        },
                        body: JSON.stringify({ userId: socket.userId, ...data })
                    });
                    if (response.ok) {
                        const result = await response.json() as any;
                        this.emitToRoom(`shopping_list_${socket.userId}`, 'shopping_list_update', {
                            action: 'ITEM_ADDED',
                            item: result.data
                        });
                    } else {
                        socket.emit('error', { message: 'Failed to add item' });
                    }
                } catch (err) {
                    app.log.error(err);
                    socket.emit('error', { message: 'Internal server error' });
                }
            });

            socket.on('shopping_list:update_item', async (data: { id: string, name?: string, quantity?: string, isChecked?: boolean }) => {
                if (!socket.userId) return;
                try {
                    const response = await fetchWithTimeout(`${RECIPE_SERVICE_URL}/api/v1/internal/shopping-list/items/${data.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-internal-api-key': env.INTERNAL_API_KEY
                        },
                        body: JSON.stringify({ userId: socket.userId, ...data })
                    });
                    if (response.ok) {
                        const result = await response.json() as any;
                        this.emitToRoom(`shopping_list_${socket.userId}`, 'shopping_list_update', {
                            action: 'ITEM_UPDATED',
                            item: result.data
                        });
                    } else {
                        socket.emit('error', { message: 'Failed to update item' });
                    }
                } catch (err) {
                    app.log.error(err);
                    socket.emit('error', { message: 'Internal server error' });
                }
            });

            socket.on('shopping_list:delete_item', async (data: { id: string }) => {
                if (!socket.userId) return;
                try {
                    const response = await fetchWithTimeout(`${RECIPE_SERVICE_URL}/api/v1/internal/shopping-list/items/${data.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-internal-api-key': env.INTERNAL_API_KEY
                        },
                        body: JSON.stringify({ userId: socket.userId })
                    });
                    if (response.ok) {
                        this.emitToRoom(`shopping_list_${socket.userId}`, 'shopping_list_update', {
                            action: 'ITEM_DELETED',
                            itemId: data.id
                        });
                    } else {
                        socket.emit('error', { message: 'Failed to delete item' });
                    }
                } catch (err) {
                    app.log.error(err);
                    socket.emit('error', { message: 'Internal server error' });
                }
            });

            socket.on('leave_recipe', ({ recipeId }: { recipeId: string }) => {
                socket.leave(`recipe_${recipeId}`);
            });

            socket.on('comment_typing_start', ({ recipeId }: { recipeId: string }) => {
                socket.to(`recipe_${recipeId}`).emit('comment_typing_start', {
                    senderId: userId,
                    recipeId: recipeId
                });
            });

            socket.on('comment_typing_stop', ({ recipeId }: { recipeId: string }) => {
                socket.to(`recipe_${recipeId}`).emit('comment_typing_stop', {
                    senderId: userId,
                    recipeId: recipeId
                });
            });

            socket.on('disconnect', async () => {
                app.log.info(`User disconnected: ${userId} (Socket: ${socketId})`);
                const sockets = this.userSockets.get(userId) || [];
                const index = sockets.indexOf(socketId);
                if (index !== -1) {
                    sockets.splice(index, 1);
                }

                if (sockets.length === 0) {
                    this.userSockets.delete(userId);
                    await this.updateUserStatus(userId, false);
                }
            });
        });

        setInterval(() => this.checkAndBroadcastHealth(), 15000);

        app.log.info('Socket.io initialized');
    }

    private static async checkAndBroadcastHealth() {
        const services = [
            { name: "auth-service", url: AUTH_SERVICE_URL },
            { name: "recipe-service", url: RECIPE_SERVICE_URL },
            { name: "user-service", url: USER_SERVICE_URL },
            { name: "chat-service", url: CHAT_SERVICE_URL },
            { name: "notification-service", url: NOTIFICATION_SERVICE_URL },
            { name: "websocket-service", url: `https://localhost:${env.WEBSOCKET_SERVICE_PORT}` },
        ];

        const healthResults = await Promise.all(services.map(async (service) => {
            const url = `${service.url}/health`;
            try {
                const response = await fetchWithTimeout(url);
                return { name: service.name, status: response.ok ? "UP" : "DOWN" };
            } catch {
                return { name: service.name, status: "DOWN" };
            }
        }));

        this.io.to('system:health').emit('health_update', {
            status: healthResults.every(r => r.status === "UP") ? "HEALTHY" : "DEGRADED",
            services: healthResults,
            timestamp: new Date().toISOString()
        });
    }

    private static async updateUserStatus(userId: string, isOnline: boolean) {
        try {
            const userServiceUrl = `${USER_SERVICE_URL}/api/v1/internal/users/${userId}/status`;

            const response = await fetchWithTimeout(userServiceUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-api-key': env.INTERNAL_API_KEY
                },
                body: JSON.stringify({ isOnline })
            });

            if (!response.ok) {
                const text = await response.text();
                logger.error(`[SocketService] Failed to update status: ${response.status} ${text}`);
            }

            this.io.emit('user_status_change', { userId, isOnline });
        } catch (err) {
            logger.error({ err, userId }, `Failed to update user status for ${userId}`);
        }
    }

    public static emitToUser(userId: string, event: string, data: any) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.forEach(socketId => {
                this.io.to(socketId).emit(event, data);
            });
        }
    }

    public static emitToRoom(room: string, event: string, data: any) {
        this.io.to(room).emit(event, data);
    }
}
