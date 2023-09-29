import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { keycloak } from './keycloak';

const container = document.getElementById('root');
if (!container) {
  throw new Error('missing #root element');
}

keycloak
  .init({ onLoad: 'login-required', pkceMethod: 'S256' })
  .then((authenticated) => {
    if (!authenticated) {
      window.location.reload();
      return;
    }

    // keycloak-js no refresca solo: sin este poll la sesión se cae a mitad
    // de turno y el próximo fetch tira 401 de la nada (nos pasó, ver
    // README).
    setInterval(() => {
      keycloak.updateToken(30).catch(() => keycloak.login());
    }, 20_000);

    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    console.error('no se pudo inicializar keycloak', err);
  });
