import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import { closeDatabaseConnection } from '../../src/lib/shared/database';
import { runInNewTransaction } from '../../src/lib/shared/infrastructure/persistence/TransactionContext';

const { Pool } = pg;

let container: StartedPostgreSqlContainer | null = null;
let pool: pg.Pool | null = null;

export async function setupTestDatabase(): Promise<{
  connectionString: string;
  pool: pg.Pool;
}> {
  if (container && pool) {
    return { connectionString: container.getConnectionUri(), pool };
  }

  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('skillbase_test')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .start();

  const connectionString = container.getConnectionUri();
  process.env.DATABASE_URL = connectionString;

  pool = new Pool({ connectionString });

  const sqlsDir = join(process.cwd(), 'migrations', 'sqls');
  const sqlFiles = readdirSync(sqlsDir)
    .filter((f) => f.endsWith('-up.sql'))
    .sort();

  if (sqlFiles.length === 0) {
    throw new Error('No migration files found in migrations/sqls/');
  }

  for (const sqlFile of sqlFiles) {
    const migrationPath = join(sqlsDir, sqlFile);
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSql);
  }

  return { connectionString, pool };
}

export async function teardownTestDatabase(): Promise<void> {
  await closeDatabaseConnection();

  if (pool) {
    await pool.end();
    pool = null;
  }
  if (container) {
    await container.stop();
    container = null;
  }
}

export async function cleanDatabase(): Promise<void> {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call setupTestDatabase() first.');
  }

  const result = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const tables = result.rows.map((r: { tablename: string }) => r.tablename);

  if (tables.length > 0) {
    await pool.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE`);
  }
}

export function getTestPool(): pg.Pool {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call setupTestDatabase() first.');
  }
  return pool;
}

export async function withTestTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call setupTestDatabase() first.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await runInNewTransaction(fn);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      client.release(true);
    }
    throw error;
  } finally {
    client.release();
  }
}
