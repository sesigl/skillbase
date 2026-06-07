import type { DatabaseConnection } from '../../../shared/infrastructure/persistence/DatabaseConnection';
import type { RepositoryType } from '../../domain/repository-registry/IndexedRepository';
import type { RepositoryRegistry } from '../../domain/repository-registry/RepositoryRegistry';

export class PostgresRepositoryRegistry implements RepositoryRegistry {
  constructor(private readonly db: DatabaseConnection) {}

  async register(path: string, type: RepositoryType): Promise<void> {
    await this.db.execute(async (client) => {
      await client.query(
        'INSERT INTO indexed_repositories (path, indexed_at, last_status, repo_type) VALUES ($1, NOW(), $2, $3) ON CONFLICT (path) DO UPDATE SET indexed_at = NOW(), last_status = $2, repo_type = $3',
        [path, 'valid', type]
      );
    });
  }

  async remove(path: string): Promise<void> {
    await this.db.execute(async (client) => {
      await client.query('DELETE FROM indexed_repositories WHERE path = $1', [path]);
    });
  }

  async clearAll(): Promise<void> {
    await this.db.execute(async (client) => {
      await client.query('DELETE FROM indexed_repositories');
    });
  }

  async listAll(): Promise<
    { path: string; indexedAt: Date; lastStatus: string; type: RepositoryType }[]
  > {
    return this.db.execute(async (client) => {
      const result = await client.query(
        'SELECT path, indexed_at, last_status, repo_type FROM indexed_repositories ORDER BY path'
      );
      return result.rows.map((row: Record<string, unknown>) => ({
        path: row.path as string,
        indexedAt: row.indexed_at as Date,
        lastStatus: row.last_status as string,
        type: row.repo_type as RepositoryType,
      }));
    });
  }

  async findByPath(
    path: string
  ): Promise<{ path: string; indexedAt: Date; lastStatus: string; type: RepositoryType } | null> {
    return this.db.execute(async (client) => {
      const result = await client.query(
        'SELECT path, indexed_at, last_status, repo_type FROM indexed_repositories WHERE path = $1',
        [path]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0] as Record<string, unknown>;
      return {
        path: row.path as string,
        indexedAt: row.indexed_at as Date,
        lastStatus: row.last_status as string,
        type: row.repo_type as RepositoryType,
      };
    });
  }

  async updateStatus(path: string, status: string): Promise<void> {
    await this.db.execute(async (client) => {
      await client.query(
        'UPDATE indexed_repositories SET last_status = $2, indexed_at = NOW() WHERE path = $1',
        [path, status]
      );
    });
  }
}
