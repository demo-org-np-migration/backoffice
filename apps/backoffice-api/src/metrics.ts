import { metrics } from '@cauri/commons';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Histogram } from 'prom-client';

// metrics() de @cauri/commons registra las métricas default de proceso más
// el histograma http_request_duration_seconds apenas se llama, pero su
// `handler()` es un middleware de Express — Fastify no lo puede montar con
// `app.use`. Usamos el `registry` a mano (las convenciones internas de API) y reconstruimos
// el timing con hooks de Fastify.
const { registry } = metrics();

const httpRequestDuration = registry.getSingleMetric('http_request_duration_seconds') as Histogram<
  'method' | 'route' | 'status_code'
>;

interface RequestWithTimer extends FastifyRequest {
  metricsEndTimer?: (labels: Record<string, string>) => void;
}

export function registerMetrics(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: RequestWithTimer) => {
    request.metricsEndTimer = httpRequestDuration.startTimer({ method: request.method });
  });

  app.addHook('onResponse', async (request: RequestWithTimer, reply) => {
    request.metricsEndTimer?.({
      route: request.routeOptions?.url ?? request.url,
      status_code: String(reply.statusCode),
    });
  });

  app.get('/metrics', async (_request, reply) => {
    reply.header('content-type', registry.contentType);
    return registry.metrics();
  });
}
