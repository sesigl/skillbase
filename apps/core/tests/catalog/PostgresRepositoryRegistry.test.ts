import { beforeEach, describe, expect, it } from 'vitest';
import { PostgresRepositoryRegistry } from '../../src/lib/catalog/infrastructure/persistence/PostgresRepositoryRegistry';
import { PostgresDatabaseConnection } from '../../src/lib/shared/infrastructure/persistence/PostgresDatabaseConnection';
import { cleanDatabase, getTestPool } from '../helpers/testDatabase';

const TYPE = 'standalone' as const;

describe('PostgresRepositoryRegistry', () => {
  let registry: PostgresRepositoryRegistry;

  beforeEach(async () => {
    const pool = getTestPool();
    const db = new PostgresDatabaseConnection(pool);
    registry = new PostgresRepositoryRegistry(db);
    await cleanDatabase();
  });

  it('registers a new repository path', async () => {
    await registry.register('/Users/test/skills-repo', TYPE);

    const repos = await registry.listAll();
    expect(repos.length).toBe(1);
    expect(repos[0].path).toBe('/Users/test/skills-repo');
    expect(repos[0].lastStatus).toBe('valid');
  });

  it('re-registering the same path updates indexed_at (idempotent)', async () => {
    await registry.register('/Users/test/skills-repo', TYPE);
    const first = await registry.findByPath('/Users/test/skills-repo');

    await new Promise((r) => setTimeout(r, 10));
    await registry.register('/Users/test/skills-repo', TYPE);
    const second = await registry.findByPath('/Users/test/skills-repo');

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect((second as NonNullable<typeof second>).indexedAt.getTime()).toBeGreaterThanOrEqual(
      (first as NonNullable<typeof first>).indexedAt.getTime()
    );
    expect((second as NonNullable<typeof second>).lastStatus).toBe('valid');
  });

  it('removes a repository by path', async () => {
    await registry.register('/Users/test/repo-a', TYPE);
    await registry.register('/Users/test/repo-b', TYPE);

    await registry.remove('/Users/test/repo-a');

    const repos = await registry.listAll();
    expect(repos.length).toBe(1);
    expect(repos[0].path).toBe('/Users/test/repo-b');
  });

  it('removing a non-existent path is a no-op', async () => {
    await registry.register('/Users/test/repo-a', TYPE);
    await registry.remove('/Users/test/non-existent');

    const repos = await registry.listAll();
    expect(repos.length).toBe(1);
  });

  it('clears all repositories', async () => {
    await registry.register('/Users/test/repo-a', TYPE);
    await registry.register('/Users/test/repo-b', TYPE);
    await registry.register('/Users/test/repo-c', TYPE);

    await registry.clearAll();

    const repos = await registry.listAll();
    expect(repos.length).toBe(0);
  });

  it('clearAll on empty registry is a no-op', async () => {
    await registry.clearAll();
    const repos = await registry.listAll();
    expect(repos.length).toBe(0);
  });

  it('findByPath returns null for non-indexed path', async () => {
    const result = await registry.findByPath('/Users/test/not-indexed');
    expect(result).toBeNull();
  });

  it('findByPath returns the indexed repository', async () => {
    await registry.register('/Users/test/skills-repo', TYPE);

    const result = await registry.findByPath('/Users/test/skills-repo');
    expect(result).not.toBeNull();
    expect(result?.path).toBe('/Users/test/skills-repo');
    expect(result?.lastStatus).toBe('valid');
  });

  it('listAll returns repositories ordered by path', async () => {
    await registry.register('/Users/test/z-repo', TYPE);
    await registry.register('/Users/test/a-repo', TYPE);

    const repos = await registry.listAll();
    expect(repos[0].path).toBe('/Users/test/a-repo');
    expect(repos[1].path).toBe('/Users/test/z-repo');
  });

  it('updateStatus changes lastStatus', async () => {
    await registry.register('/Users/test/skills-repo', TYPE);

    await registry.updateStatus('/Users/test/skills-repo', 'missing');

    const result = await registry.findByPath('/Users/test/skills-repo');
    expect(result?.lastStatus).toBe('missing');
  });
});
