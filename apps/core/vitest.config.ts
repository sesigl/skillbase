import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'astro:env/server': resolve(__dirname, 'tests/astro-env-server-mock.cjs'),
      '@lib': resolve(__dirname, 'src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
