# backoffice

Herramienta interna de soporte de core-banking: buscás un cliente por id, ves su KYC,
congelás una cuenta si hace falta. Nació como un script de Node que yo (Rocío) usaba a mano
contra ledger-core cuando alguien de soporte me escribía por Slack, y creció hasta merecer
un repo propio. Sigue teniendo esa cara: no es bonita, es útil.

Es un monorepo (`apps/backoffice-api` + `apps/backoffice-ui`) porque en algún momento la UI
y la API necesitaban las mismas formas de datos (`Customer`, `KycApplication`, ...) y
copiarlas a mano dos veces era peor que pagar el precio de un monorepo chico. De ahí
`packages/shared`.

## Qué hace

- `apps/backoffice-api` (Fastify): expone `/backoffice/customers/:id` (agrega ledger-core +
  kyc-service), `/backoffice/accounts/:id/freeze` y `/backoffice/accounts/:id/statement`
  (accounts-api). Ver las convenciones internas de API §6 para el detalle completo — no lo repito acá para no
  desincronizarlo.
- `apps/backoffice-ui` (React + Vite, nginx): una sola pantalla, buscás un customer id,
  ves su ficha y las solicitudes de KYC, y podés congelar una cuenta escribiendo su id a
  mano (ver "cosas que sabemos que están mal").
- `packages/shared`: tipos (`Customer`, `KycApplication`, `Account`, `StatementEntry`) y los
  tres clientes HTTP (`createLedgerClient`, `createKycClient`, `createAccountsClient`),
  todos armados sobre el `httpClient` de `@cauri/commons`. Solo lo usa `backoffice-api` hoy.

## Por qué pnpm workspaces

Tres proyectos (`packages/shared`, `apps/backoffice-api`, `apps/backoffice-ui`) que
comparten un `tsconfig.base.json` y, en el caso de la API, un paquete interno. Nada raro:
`pnpm-workspace.yaml` lista `apps/*` y `packages/*`, cada uno tiene su propio
`package.json`. Corré todo desde la raíz:

```bash
pnpm install
pnpm -r lint     # eslint en los tres paquetes (una sola config en la raíz, eslint.config.mjs
                 # la encuentra sola subiendo directorios)
pnpm -r test     # solo backoffice-api tiene tests hoy
pnpm -r build    # shared se buildea antes que sus consumidores (pnpm respeta el grafo)
```

`packages/shared` no se buildea antes de `pnpm -r test`: el `vitest.config.ts` de
`backoffice-api` apunta `@backoffice/shared` directo a su `src/index.ts` en vez de a
`dist/`, así el orden test → build no importa. Sí importa para Docker (ver Dockerfiles) y
para `pnpm -r build`, que sí respeta el orden de dependencias.

## Correr cada app en dev

```bash
# API (necesita KEYCLOAK_ISSUER, KEYCLOAK_CLIENT_SECRET, LEDGER_CORE_URL, KYC_SERVICE_URL,
# ACCOUNTS_API_URL en el entorno — copiá los valores de k8s/staging/backoffice-api-configmap.yaml)
pnpm --filter backoffice-api dev

# UI (Vite en :5173; sin un backoffice-api + Kong reales al lado no vas a poder loguear)
pnpm --filter backoffice-ui dev
```

## Auth

`backoffice-api` valida tokens del client `backoffice-ui` (roles `ops` / `ops-admin`) con
`createJwtAuth` de `@cauri/commons`. El detalle importante de Fastify: `auth.fastify()`
agrega un hook `onRequest` vía `fastify-plugin`, que (desde la 1.2.1 de `@cauri/commons`)
alcanza a todas las rutas del **scope** donde lo registrás — no a toda la app. Por eso en
`server.ts` el plugin de auth y las rutas de `/backoffice/*` van juntos adentro del mismo
`app.register(async (scope) => {...})`, separados de `/health` y `/metrics`, que quedan
afuera y son públicos. Si algún día movés una ruta nueva afuera de ese scope se te va a
colar sin auth — ojo con eso.

`backoffice-api` llama a ledger-core, kyc-service y accounts-api con un token de servicio
propio (client `backoffice-api`, rol `service`), vía `serviceTokenProvider`.

La UI se loguea contra Keycloak con `keycloak-js` (client público `backoffice-ui`).

## Cosas que sabemos que están mal

- **La UI no tiene tests.** Ninguno. Cuando esto se rompe nos enteramos por Slack, no por
  CI. Está en el radar, no en el sprint.
- **El deploy de la UI tarda por el build de Vite en el runner self-hosted.** No es nada
  del otro mundo (`vite build` de un solo bundle), pero el runner de `cauri-k8s` está
  compartido con todo el resto de la org y a veces hace cola.
- **Congelar una cuenta pide el account id a mano.** La ficha de `/backoffice/customers/:id`
  solo trae el customer (ledger-core no asocia cuentas ahí) y backoffice-api no tiene un
  endpoint que liste las cuentas de un cliente. Hasta que alguien lo agregue, el ops
  copia el id de otro lado y lo pega.
- **`@cauri/commons` tipa `requireRole` solo para Express**, aunque funciona igual en
  Fastify (es duck-typing puro por debajo). Lo envolvemos en `src/auth.ts` para no llenar
  las rutas de `as unknown as`. Si el equipo de platform algún día lo tipa bien para
  Fastify, ese wrapper se puede borrar.

## Deploy

Estilo A (Actions + YAML pelado), como ledger-core y notifications:
`.github/workflows/deploy.yml` buildea ambas imágenes con `matrix.app` (contexto siempre en
la raíz del monorepo, cada Dockerfile instala el workspace entero y buildea solo su app),
las pushea a `ghcr.io/demo-org-np-migration/{backoffice-api,backoffice-ui}` y aplica
`k8s/staging/` en cada push a `main`; `k8s/prod/` en tags `v*`, con aprobación manual
(`environment: production`).

`apps/backoffice-api/Dockerfile` usa `pnpm deploy` para armar el runtime: reconstruir a
mano el árbol de symlinks que arma pnpm para los workspace packages en la imagen final es
frágil, `pnpm deploy` ya resuelve eso (necesita `inject-workspace-packages=true` en
`.npmrc`, si no tira `ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE`).

`apps/backoffice-ui/Dockerfile` recibe `VITE_KEYCLOAK_REALM` por build-arg (Vite lo
hornea en el bundle en build time, no se puede cambiar en runtime) — por eso hay una
imagen distinta por entorno aunque el código sea el mismo. `VITE_KEYCLOAK_URL` es fijo
(un solo Keycloak para todo el cluster).
