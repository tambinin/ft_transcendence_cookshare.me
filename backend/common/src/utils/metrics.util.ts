import { FastifyInstance } from 'fastify';
import metrics from 'fastify-metrics';

export const registerMetrics = async (app: FastifyInstance, serviceName: string) => {
    await app.register(metrics, {
        endpoint: '/metrics',
        defaultMetrics: {
            enabled: true,
            labels: { service: serviceName }
        },
        routeMetrics: {
            enabled: true,
            registeredRoutesOnly: true
        }
    });
};
