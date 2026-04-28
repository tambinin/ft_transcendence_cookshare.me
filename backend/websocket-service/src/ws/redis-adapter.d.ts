declare module '@socket.io/redis-adapter' {
	import { Server } from 'socket.io';
	import Redis from 'ioredis';
	export function createAdapter(pubClient: Redis, subClient: Redis): (nsp: any) => any;
}
