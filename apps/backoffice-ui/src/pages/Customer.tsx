import { useEffect, useState } from 'react';
import { freezeAccount, getCustomer, type CustomerDetail } from '../api';

interface Props {
  customerId: string;
}

export function Customer({ customerId }: Props) {
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');
  const [freezing, setFreezing] = useState(false);
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    getCustomer(customerId)
      .then(setData)
      .catch((err: unknown) => setError(String(err)));
  }, [customerId]);

  async function handleFreeze() {
    if (!accountId.trim()) return;
    setFreezing(true);
    setFreezeMessage(null);
    try {
      await freezeAccount(accountId.trim());
      setFreezeMessage(`Cuenta ${accountId.trim()} congelada.`);
    } catch (err) {
      setFreezeMessage(`Error: ${String(err)}`);
    } finally {
      setFreezing(false);
    }
  }

  if (error) {
    return <p role="alert">No se pudo cargar el cliente: {error}</p>;
  }
  if (!data) {
    return <p>Cargando...</p>;
  }

  return (
    <section>
      <h2>{data.customer.full_name}</h2>
      <dl>
        <dt>Email</dt>
        <dd>{data.customer.email}</dd>
        <dt>KYC</dt>
        <dd>{data.customer.kyc_status}</dd>
        <dt>Alta</dt>
        <dd>{data.customer.created_at}</dd>
      </dl>

      <h3>Solicitudes de KYC</h3>
      {data.kyc_applications.length === 0 ? (
        <p>Sin solicitudes.</p>
      ) : (
        <ul>
          {data.kyc_applications.map((application) => (
            <li key={application.id}>
              {application.status} — {application.provider_reference} ({application.created_at})
            </li>
          ))}
        </ul>
      )}

      <h3>Congelar cuenta</h3>
      {/* La ficha del cliente no trae sus cuentas: ledger-core no las
          asocia en GET /v1/customers/{id}, y backoffice-api no tiene un
          endpoint que las liste. El ops escribe el account id a mano —
          es fea pero es la herramienta que tenemos (ver README). */}
      <input
        aria-label="Account ID a congelar"
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
        placeholder="account id"
      />
      <button type="button" onClick={handleFreeze} disabled={freezing || !accountId.trim()}>
        {freezing ? 'Congelando...' : 'Congelar cuenta'}
      </button>
      {freezeMessage && <p>{freezeMessage}</p>}
    </section>
  );
}
