import { httpClient, type HttpClientOpts } from '@cauri/commons';
import type { Account, StatementEntry } from '../types';

export type AccountsClientOpts = Pick<HttpClientOpts, 'baseUrl' | 'getToken'>;

/** Cliente de accounts-api (las convenciones internas de API): congelar cuenta y ver movimientos. */
export function createAccountsClient(opts: AccountsClientOpts) {
  const client = httpClient(opts);
  return {
    freezeAccount(id: string): Promise<Account> {
      return client.post<Account>(`/v1/accounts/${id}/freeze`);
    },
    getStatement(id: string, from?: string, to?: string): Promise<StatementEntry[]> {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return client.get<StatementEntry[]>(`/v1/accounts/${id}/statement${qs ? `?${qs}` : ''}`);
    },
  };
}
