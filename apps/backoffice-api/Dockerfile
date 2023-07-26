# Contexto: la RAÍZ del monorepo (necesitamos el workspace completo para
# resolver @backoffice/shared). docker build -f apps/backoffice-api/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /workspace
RUN corepack enable

# No-op acá: existe para que deploy.yml pueda mandar el mismo build-arg a
# los dos Dockerfiles del matrix (backoffice-api, backoffice-ui) sin que
# buildx se queje de un ARG no declarado. Esta imagen no lo usa: el realm
# de Keycloak lo lee backoffice-api de KEYCLOAK_ISSUER en runtime, no al
# buildear.
ARG VITE_KEYCLOAK_REALM

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json .npmrc ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/backoffice-api/package.json apps/backoffice-api/package.json
COPY apps/backoffice-ui/package.json apps/backoffice-ui/package.json
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/backoffice-api apps/backoffice-api

RUN pnpm --filter @backoffice/shared build
RUN pnpm --filter backoffice-api build

# pnpm deploy arma un directorio standalone con node_modules real (no
# symlinks al workspace), que es lo único razonable de copiar a un stage
# limpio — reconstruir a mano los symlinks de pnpm en la imagen final es
# frágil (rompe con cualquier cambio de versión del store).
RUN pnpm --filter backoffice-api deploy --prod /out

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S backoffice && adduser -S backoffice -G backoffice
COPY --from=build /out ./
USER backoffice

EXPOSE 8080
CMD ["node", "dist/server.js"]
