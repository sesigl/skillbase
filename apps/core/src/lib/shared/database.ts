import { DATABASE_URL } from 'astro:env/server';
import pg from 'pg';
import type { DatabaseConnection } from './infrastructure/persistence/DatabaseConnection';
import { PostgresDatabaseConnection } from './infrastructure/persistence/PostgresDatabaseConnection';

const { Pool } = pg;

const getDatabaseUrl = (): string => {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return DATABASE_URL;
};

let pool: pg.Pool | null = null;
let dbConnection: DatabaseConnection | null = null;

export const getPool = (): pg.Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

export const getDatabaseConnection = (): DatabaseConnection => {
  if (!dbConnection) {
    dbConnection = new PostgresDatabaseConnection(getPool());
  }
  return dbConnection;
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
  dbConnection = null;
};
