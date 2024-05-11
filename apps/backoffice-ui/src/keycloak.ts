import Keycloak from 'keycloak-js';

/**
 * Client público `backoffice-ui` (roles `ops` / `ops-admin`, las convenciones internas de API
 * #4). La URL de Keycloak es fija (el mismo cluster para staging y prod,
 * solo cambia el realm); el realm sí varía y se inyecta por build arg
 * (ver Dockerfile y deploy.yml).
 */
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: 'backoffice-ui',
});
