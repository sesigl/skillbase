import { afterAll, beforeAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './helpers/testDatabase';

beforeAll(async () => {
  await setupTestDatabase();
}, 120_000);

afterAll(async () => {
  await teardownTestDatabase();
});
