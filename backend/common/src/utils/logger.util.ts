import { FastifyLoggerOptions } from 'fastify';
import { PinoLoggerOptions } from 'fastify/types/logger';

export const getLoggerConfig = (serviceName: string): FastifyLoggerOptions | PinoLoggerOptions | boolean => {
    return {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            targets: [
                {
                    target: 'pino/file',
                    level: 'info',
                    options: {
                        destination: './logs/app.log',
                        mkdir: true
                    },
                },
                {
                    target: 'pino-pretty',
                    level: 'info',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss UTC',
                        ignore: 'pid,hostname',
                        singleLine: false,
                    },
                },
            ],
        },
        serializers: {
            req(request: any) {
                return {
                    method: request.method,
                    url: request.url,
                    host: request.headers.host,
                    remoteAddress: request.ip,
                    remotePort: request.socket.remotePort
                };
            }
        }
    };
};

/**
 * Paths to silence from request/response logging (e.g. health checks).
 */
const SILENT_PATHS = ['/health', '/api/health', '/healthz'];

function isSilentPath(url: string): boolean {
    return SILENT_PATHS.some(p => url === p || url.startsWith(p + '?'));
}

export function silenceHealthLogs(app: any): void {
    app.addHook('onRequest', (request: any, _reply: any, done: () => void) => {
        if (!isSilentPath(request.url)) {
            request.log.info({ req: request }, 'incoming request');
        }
        done();
    });

    app.addHook('onResponse', (request: any, reply: any, done: () => void) => {
        if (!isSilentPath(request.url)) {
            request.log.info(
                { res: reply, responseTime: reply.elapsedTime },
                'request completed',
            );
        }
        done();
    });
}
