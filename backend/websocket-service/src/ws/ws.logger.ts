import pino from 'pino';

/**
 * Create a named pino logger that outputs through pino-pretty.
 * Usage:  const logger = createWsLogger('ws:auth');
 */
export function createWsLogger(name: string) {
    return pino({
        name,
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss UTC',
                ignore: 'pid,hostname',
                singleLine: false,
            },
        },
    });
}
