import type { FastifyInstance } from 'fastify';
import { requireOps } from '../auth';
import { kycClient, ledgerClient } from '../clients';

interface CustomerParams {
  id: string;
}

/**
 * GET /backoffice/customers/:id — ficha de soporte: agrega ledger-core (el
 * customer) y kyc-service (sus solicitudes) en paralelo (las convenciones internas de API).
 */
export async function customersRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: CustomerParams }>(
    '/backoffice/customers/:id',
    { preHandler: requireOps },
    async (request) => {
      const { id } = request.params;
      const [customer, kycApplications] = await Promise.all([
        ledgerClient.getCustomer(id),
        kycClient.getApplicationsForCustomer(id),
      ]);

      return { customer, kyc_applications: kycApplications };
    },
  );
}
