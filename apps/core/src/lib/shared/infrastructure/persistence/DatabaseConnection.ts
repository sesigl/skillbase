import type { PoolClient } from 'pg';

export interface DatabaseConnection {
  execute<T>(operation: (client: PoolClient) => Promise<T>): Promise<T>;
  getClient(): Promise<PoolClient>;
}
