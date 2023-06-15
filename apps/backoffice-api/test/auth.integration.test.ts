import { describe, expect, it } from 'vitest';

/**
 * Integración real: a diferencia de routes/customers.test.ts, acá NO
 * mockeamos createJwtAuth. Solo probamos que sin token la request corta en
 * 401 antes de tocar ningún cliente — no necesitamos un Keycloak real para
 * eso, la verificación de JWKS ni se llega a intentar sin bearer token.
 */
describe('auth (integración real, sin mocks)', () => {
  it('GET /backoffice/customers/:id sin token responde 401', async () => {
    process.env.KEYCLOAK_ISSUER = 'http://keycloak.platform.svc:8080/realms/cauri-staging';
    process.env.KEYCLOAK_CLIENT_ID = 'backoffice-api';
    process.env.KEYCLOAK_CLIENT_SECRET = 'test-secret';
    process.env.LEDGER_CORE_URL = 'http://ledger-core:8080';
    process.env.KYC_SERVICE_URL = 'http://kyc-service:8080';
    process.env.ACCOUNTS_API_URL = 'http://accounts-api:8080';

    // Import dinámico: los módulos leen KEYCLOAK_ISSUER/etc al cargarse, así
    // que hay que setear el env ANTES de importar (un import estático se
    // hoistea por encima de estas asignaciones).
    const { buildApp } = await import('../src/server');
    const app = buildApp();

    const res = await app.inject({ method: 'GET', url: '/backoffice/customers/some-id' });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toEqual({
      error: { code: 'unauthorized', message: expect.any(String) },
    });
  });

  it('POST /backoffice/accounts/:id/freeze sin token responde 401', async () => {
    const { buildApp } = await import('../src/server');
    const app = buildApp();

    const res = await app.inject({ method: 'POST', url: '/backoffice/accounts/some-id/freeze' });

    expect(res.statusCode).toBe(401);
  });

  it('GET /health no necesita token', async () => {
    const { buildApp } = await import('../src/server');
    const app = buildApp();

    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: 'ok' });
  });
});
