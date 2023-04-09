import { httpClient, type HttpClientOpts } from '@cauri/commons';
import type { Customer } from '../types';

export type LedgerClientOpts = Pick<HttpClientOpts, 'baseUrl' | 'getToken'>;

/**
 * Cliente de ledger-core (las convenciones internas de API). Por ahora backoffice-api solo
 * necesita leer el customer para la ficha de soporte — si en el futuro
 * hace falta más (cuentas, balance), agregar acá, no en el app.
 */
export function createLedgerClient(opts: LedgerClientOpts) {
  const client = httpClient(opts);
  return {
    getCustomer(id: string): Promise<Customer> {
      return client.get<Customer>(`/v1/customers/${id}`);
    },
  };
}
