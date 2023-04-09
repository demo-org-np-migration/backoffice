// Formas mínimas que necesita backoffice-api de las respuestas de
// ledger-core, kyc-service y accounts-api (las convenciones internas de API y #6). No son
// los contratos completos de esos servicios, son el subconjunto de campos
// que esta herramienta de soporte realmente usa.

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  kyc_status: 'pending' | 'approved' | 'rejected' | 'manual_review';
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

export interface Account {
  id: string;
  customer_id: string;
  currency: string;
  balance: string;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
}

export interface StatementEntry {
  entry_id: string;
  amount: string;
  type: 'debit' | 'credit';
  reference: string;
  created_at: string;
}
