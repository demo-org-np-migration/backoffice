import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Clientes de @backoffice/shared, mockeados vía nuestro wrapper `../clients`
// (el único punto donde routes/customers.ts los toca).
vi.mock('../../src/clients', () => ({
  ledgerClient: { getCustomer: vi.fn() },
  kycClient: { getApplicationsForCustomer: vi.fn() },
  accountsClient: { freezeAccount: vi.fn(), getStatement: vi.fn() },
}));

// Fake liviano de auth: en vez de validar un JWT real contra JWKS (eso lo
// cubre auth.integration.test.ts), lee el rol de un header de test. Alcanza
// para probar el 403 sin depender de un Keycloak real acá.
vi.mock('../../src/auth', () => ({
  requireOps: async (
    request: { headers: Record<string, string | string[] | undefined> },
    reply: { code: (status: number) => { send: (body: unknown) => void } },
  ) => {
    if (request.headers['x-test-role'] !== 'ops') {
      reply.code(403).send({ error: { code: 'forbidden', message: 'missing role ops' } });
    }
  },
  requireOpsAdmin: async () => {},
}));

import { kycClient, ledgerClient } from '../../src/clients';
import { customersRoutes } from '../../src/routes/customers';

function buildApp() {
  const app = Fastify();
  app.register(customersRoutes);
  return app;
}

describe('GET /backoffice/customers/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('200: agrega ledger-core y kyc-service', async () => {
    vi.mocked(ledgerClient.getCustomer).mockResolvedValue({
      id: 'cust-1',
      email: 'ana@cauri.io',
      full_name: 'Ana Cliente',
      kyc_status: 'approved',
      created_at: '2026-01-01T00:00:00Z',
    });
    vi.mocked(kycClient.getApplicationsForCustomer).mockResolvedValue([
      {
        id: 'app-1',
        customer_id: 'cust-1',
        status: 'approved',
        document_url: 's3://cauri-staging-kyc-documents/cust-1/doc.jpg',
        provider_reference: 'veridoc-ref-1',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/backoffice/customers/cust-1',
      headers: { 'x-test-role': 'ops' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.customer.id).toBe('cust-1');
    expect(body.kyc_applications).toHaveLength(1);
    expect(ledgerClient.getCustomer).toHaveBeenCalledWith('cust-1');
    expect(kycClient.getApplicationsForCustomer).toHaveBeenCalledWith('cust-1');
  });

  it('403: sin rol ops', async () => {
    const app = buildApp();

    const res = await app.inject({ method: 'GET', url: '/backoffice/customers/cust-1' });

    expect(res.statusCode).toBe(403);
    expect(ledgerClient.getCustomer).not.toHaveBeenCalled();
  });
});
