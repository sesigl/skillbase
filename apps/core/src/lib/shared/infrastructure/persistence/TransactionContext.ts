import { AsyncLocalStorage } from 'node:async_hooks';
import type { PoolClient } from 'pg';
import { getDatabaseConnection } from '../../database';

const transactionStorage = new AsyncLocalStorage<PoolClient>();

export async function runInNewTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const connection = getDatabaseConnection();
  const client = await connection.getClient();
  let needsRelease = true;

  try {
    await client.query('BEGIN');
    const result = await transactionStorage.run(client, fn);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      client.release(true);
      needsRelease = false;
    }
    throw error;
  } finally {
    if (needsRelease) {
      client.release();
    }
  }
}
