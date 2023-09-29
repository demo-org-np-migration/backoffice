import { useState } from 'react';
import { Customer } from './pages/Customer';

export default function App() {
  const [customerId, setCustomerId] = useState('');
  const [lookupId, setLookupId] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Cauri Backoffice</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setLookupId(customerId.trim() || null);
        }}
      >
        <label htmlFor="customer-id">Customer ID</label>{' '}
        <input
          id="customer-id"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          placeholder="aaaaaaaa-0000-4000-8000-000000000001"
        />{' '}
        <button type="submit">Buscar</button>
      </form>

      {lookupId && <Customer customerId={lookupId} />}
    </div>
  );
}
