import node from '@astrojs/node';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
    validateSecrets: true,
  },
  server: {
    port: 4321,
  },
  vite: {
    resolve: {
      alias: {
        '@lib': new URL('./src/lib', import.meta.url).pathname,
      },
    },
    esbuild: {
      target: 'es2022',
    },
  },
});
