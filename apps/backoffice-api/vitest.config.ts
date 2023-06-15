import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // @backoffice/shared resuelve por package.json a dist/, que solo
      // existe después de `pnpm --filter @backoffice/shared build`. El
      // ci.yml corre test sin buildear antes (ver README), así que acá
      // apuntamos directo a la fuente para no acoplar el orden de test al
      // orden de build.
      '@backoffice/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
