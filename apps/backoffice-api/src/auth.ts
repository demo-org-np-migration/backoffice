import { createJwtAuth } from '@cauri/commons';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Valida tokens del client `backoffice-ui` (roles `ops` / `ops-admin`),
 * como pide las convenciones internas de API para backoffice-api. El plugin se registra en
 * server.ts junto con las rutas (ver comentario ahí sobre el scope).
 */
export const auth = createJwtAuth({
  issuer: process.env.KEYCLOAK_ISSUER!,
});

// @cauri/commons@1.2.1 tipa `requireRole` solo para Express (ver
// dist/auth.d.ts), aunque la implementación funciona igual en Fastify por
// duck-typing sobre request/reply (ver su src/auth.ts). Envolvemos acá para
// tener el tipo correcto en nuestras rutas sin `any` desparramado.
function requireRole(role: string) {
  const guard = auth.requireRole(role) as unknown as (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void;
  return async (request: FastifyRequest, reply: FastifyReply) => {
    guard(request, reply);
  };
}

export const requireOps = requireRole('ops');
export const requireOpsAdmin = requireRole('ops-admin');
