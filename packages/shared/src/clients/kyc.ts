import { httpClient, type HttpClientOpts } from '@cauri/commons';
import type { KycApplication } from '../types';

export type KycClientOpts = Pick<HttpClientOpts, 'baseUrl' | 'getToken'>;

/** Cliente de kyc-service (las convenciones internas de API). */
export function createKycClient(opts: KycClientOpts) {
  const client = httpClient(opts);
  return {
    getApplicationsForCustomer(customerId: string): Promise<KycApplication[]> {
      return client.get<KycApplication[]>(`/v1/kyc/customers/${customerId}/applications`);
    },
  };
}
