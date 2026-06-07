import type { Pool, PoolClient } from 'pg';
import type { DatabaseConnection } from './DatabaseConnection';

export class PostgresDatabaseConnection implements DatabaseConnection {
  constructor(private readonly pool: Pool) {}

  async execute<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      return await operation(client);
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
}
