import { beforeAll, describe, expect, it } from 'vitest';
import { createCatalogUseCases } from '../../../../src/lib/catalog/infrastructure/di';

describe('CatalogUseCases', () => {
  let useCases: ReturnType<typeof createCatalogUseCases>;

  beforeAll(() => {
    useCases = createCatalogUseCases();
  });

  it('browseSkills returns all seeded skills', async () => {
    const skills = await useCases.browseSkills();

    expect(skills.length).toBe(5);
    expect(skills[0].name).toBeDefined();
    expect(skills[0].author).toBe('skillbase');
  });

  it('searchSkills matches by name', async () => {
    const skills = await useCases.searchSkills('git');

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Git Conventions');
  });

  it('searchSkills matches by description', async () => {
    const skills = await useCases.searchSkills('refactoring');

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Clean Code Reviewer');
  });

  it('searchSkills returns empty array when no match', async () => {
    const skills = await useCases.searchSkills('zzznonexistent');

    expect(skills.length).toBe(0);
  });

  it('searchSkills is case-insensitive', async () => {
    const skills = await useCases.searchSkills('FRONTEND');

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Frontend Design');
  });
});
