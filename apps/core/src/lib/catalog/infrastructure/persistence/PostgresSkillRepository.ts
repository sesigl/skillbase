import type { Skill } from '@lib/shared/skill';
import type { DatabaseConnection } from '../../../shared/infrastructure/persistence/DatabaseConnection';
import type { SkillRepository } from '../../domain/skill/SkillRepository';

export class PostgresSkillRepository implements SkillRepository {
  constructor(private readonly db: DatabaseConnection) {}

  async findAll(): Promise<Skill[]> {
    return this.db.execute(async (client) => {
      const result = await client.query(
        'SELECT id, name, author, description, version, tags, providers, license, homepage FROM skills ORDER BY name'
      );
      return result.rows.map(rowToSkill);
    });
  }

  async search(query: string): Promise<Skill[]> {
    return this.db.execute(async (client) => {
      const result = await client.query(
        'SELECT id, name, author, description, version, tags, providers, license, homepage FROM skills WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY name',
        [`%${query}%`]
      );
      return result.rows.map(rowToSkill);
    });
  }
}

function rowToSkill(row: Record<string, unknown>): Skill {
  return {
    name: row.name as string,
    author: row.author as string,
    description: row.description as string,
    version: row.version as string,
    tags: row.tags as string[],
    providers: row.providers as string[],
    license: row.license as string,
    homepage: (row.homepage as string) || undefined,
  };
}
