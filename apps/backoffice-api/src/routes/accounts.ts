import type { FastifyInstance } from 'fastify';
import { requireOps, requireOpsAdmin } from '../auth';
import { accountsClient } from '../clients';

interface AccountParams {
  id: string;
}

interface StatementQuery {
  from?: string;
  to?: string;
}

/**
 * POST /backoffice/accounts/:id/freeze y GET .../statement — ambos pegan a
 * accounts-api con el token de servicio (las convenciones internas de API). Freeze pide
 * `ops-admin`, el resto alcanza con `ops`.
 */
export async function accountsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: AccountParams }>(
    '/backoffice/accounts/:id/freeze',
    { preHandler: requireOpsAdmin },
    async (request) => accountsClient.freezeAccount(request.params.id),
  );

  app.get<{ Params: AccountParams; Querystring: StatementQuery }>(
    '/backoffice/accounts/:id/statement',
    { preHandler: requireOps },
    async (request) =>
      accountsClient.getStatement(request.params.id, request.query.from, request.query.to),
  );
}
