# Contexto: la RAÍZ del monorepo.
# docker build -f apps/backoffice-ui/Dockerfile --build-arg VITE_KEYCLOAK_REALM=cauri-staging .

FROM node:20-alpine AS build
WORKDIR /workspace
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json .npmrc ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/backoffice-api/package.json apps/backoffice-api/package.json
COPY apps/backoffice-ui/package.json apps/backoffice-ui/package.json
RUN pnpm install --frozen-lockfile

COPY apps/backoffice-ui apps/backoffice-ui

# VITE_KEYCLOAK_URL es el mismo para todos los entornos (un solo Keycloak
# para staging y prod, las convenciones internas de API); el realm sí cambia y lo manda
# deploy.yml por build arg.
ARG VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM}
ENV VITE_KEYCLOAK_URL=http://keycloak.platform.svc:8180

RUN pnpm --filter backoffice-ui build

# Imagen "unprivileged": ya viene armada para escuchar en 8080 y correr como
# uid 101, no root — así no hay que pelear con nginx pidiendo bind en un
# puerto de sistema o escribiendo /var/run como root.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY apps/backoffice-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/backoffice-ui/dist /usr/share/nginx/html

EXPOSE 8080
