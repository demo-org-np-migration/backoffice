import { serviceTokenProvider } from '@cauri/commons';
import { createAccountsClient, createKycClient, createLedgerClient } from '@backoffice/shared';

/**
 * Token de servicio del client `backoffice-api` (rol `service`) para llamar
 * a ledger-core, kyc-service y accounts-api (las convenciones internas de API).
 */
const serviceToken = serviceTokenProvider({
  issuer: process.env.KEYCLOAK_ISSUER!,
  clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'backoffice-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
});

const getToken = () => serviceToken.getToken();

export const ledgerClient = createLedgerClient({
  baseUrl: process.env.LEDGER_CORE_URL!,
  getToken,
});

export const kycClient = createKycClient({
  baseUrl: process.env.KYC_SERVICE_URL!,
  getToken,
});

export const accountsClient = createAccountsClient({
  baseUrl: process.env.ACCOUNTS_API_URL!,
  getToken,
});
