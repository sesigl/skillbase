import { beforeAll, describe, expect, it } from 'vitest';
import { PostgresSkillRepository } from '../../src/lib/catalog/infrastructure/persistence/PostgresSkillRepository';
import { PostgresDatabaseConnection } from '../../src/lib/shared/infrastructure/persistence/PostgresDatabaseConnection';
import { getTestPool } from '../helpers/testDatabase';

describe('PostgresSkillRepository', () => {
  let repository: PostgresSkillRepository;

  beforeAll(() => {
    const pool = getTestPool();
    const db = new PostgresDatabaseConnection(pool);
    repository = new PostgresSkillRepository(db);
  });

  it('findAll returns all seeded skills', async () => {
    const skills = await repository.findAll();
    expect(skills.length).toBe(5);
    expect(skills[0].name).toBeDefined();
    expect(skills[0].author).toBe('skillbase');
  });

  it('search matches by name (partial)', async () => {
    const skills = await repository.search('git');
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Git Conventions');
  });

  it('search matches by description (partial)', async () => {
    const skills = await repository.search('refactoring');
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Clean Code Reviewer');
  });

  it('search with no match returns empty array', async () => {
    const skills = await repository.search('zzznonexistent');
    expect(skills.length).toBe(0);
  });

  it('search is case-insensitive', async () => {
    const skills = await repository.search('FRONTEND');
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Frontend Design');
  });
});
