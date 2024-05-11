import { keycloak } from './keycloak';

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  kyc_status: string;
  created_at: string;
}

export interface KycApplication {
  id: string;
  customer_id: string;
  status: string;
  document_url: string;
  provider_reference: string;
  created_at: string;
}

export interface CustomerDetail {
  customer: Customer;
  kyc_applications: KycApplication[];
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  // updateToken(30) refresca si el token expira en menos de 30s. Si el
  // refresh token también murió, mandamos a loguear de nuevo en vez de
  // pegarle igual y comernos un 401.
  await keycloak.updateToken(30).catch(() => keycloak.login());
  return fetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${keycloak.token}`,
    },
  });
}

/** GET /backoffice/customers/{id} por el gateway, mismo origen que la SPA. */
export async function getCustomer(id: string): Promise<CustomerDetail> {
  const res = await authFetch(`/backoffice/customers/${id}`);
  if (!res.ok) {
    throw new Error(`GET /backoffice/customers/${id} -> ${res.status}`);
  }
  return res.json();
}

/** POST /backoffice/accounts/{id}/freeze — requiere rol ops-admin. */
export async function freezeAccount(id: string): Promise<void> {
  const res = await authFetch(`/backoffice/accounts/${id}/freeze`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`POST /backoffice/accounts/${id}/freeze -> ${res.status}`);
  }
}
