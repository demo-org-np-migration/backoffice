import { HttpError, logger } from '@cauri/commons';
import Fastify, { type FastifyError } from 'fastify';
import { auth } from './auth';
import { registerMetrics } from './metrics';
import { accountsRoutes } from './routes/accounts';
import { customersRoutes } from './routes/customers';

const log = logger(process.env.SERVICE_NAME ?? 'backoffice-api', process.env.ENV ?? 'staging');

export function buildApp() {
  const app = Fastify();

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: { code: 'not_found', message: `route not found: ${request.method} ${request.url}` },
    });
  });

  app.setErrorHandler((err: FastifyError, _request, reply) => {
    if (err instanceof HttpError) {
      log.warn({ status: err.status, body: err.body }, 'upstream_error');
      reply.status(502).send({
        error: { code: 'upstream_error', message: `upstream responded ${err.status}` },
      });
      return;
    }

    const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
    log.error({ err }, 'unhandled_error');
    reply.status(status).send({
      error: { code: status === 500 ? 'internal_error' : 'bad_request', message: err.message },
    });
  });

  // Públicas (las convenciones internas de API): quedan afuera del scope de abajo, que es el
  // único donde se registra el plugin de auth.
  app.get('/health', async () => ({ status: 'ok' }));
  registerMetrics(app);

  // Todo /backoffice necesita un token válido del client `backoffice-ui`
  // con rol ops u ops-admin (las convenciones internas de API). `auth.fastify()` usa
  // fastify-plugin (desde @cauri/commons 1.2.1), así que su hook
  // "onRequest" alcanza a todas las rutas de ESTE scope; por eso las
  // registramos junto con el plugin de auth adentro del mismo `register` y
  // no como hermanas sueltas del app raíz (ahí el hook no las alcanzaría,
  // era justo el bug que arregló la 1.2.1 — ver README de @cauri/commons).
  app.register(async (scope) => {
    await scope.register(auth.fastify());
    await scope.register(customersRoutes);
    await scope.register(accountsRoutes);
  });

  return app;
}

if (require.main === module) {
  const app = buildApp();
  const port = Number(process.env.PORT ?? 8080);
  app.listen({ host: '0.0.0.0', port }, (err) => {
    if (err) {
      log.error({ err }, 'failed to start backoffice-api');
      process.exit(1);
    }
    log.info({ port }, 'backoffice-api listening');
  });
}
