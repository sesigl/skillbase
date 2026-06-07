import { describe, expect, it } from 'vitest';
import type { IndexedRepository } from '@lib/catalog/domain/repository-registry/IndexedRepository';
import { resolveSkillDetailErrorState } from '@lib/catalog/presentation/resolveSkillDetailErrorState';

describe('resolveSkillDetailErrorState', () => {
  it('shows skill-not-found when the repository is indexed and available but the skill is missing', () => {
    expect(resolveSkillDetailErrorState(indexedRepository('valid'))).toBe('not-found');
  });

  it('shows repository-unavailable when the indexed repository is missing on disk', () => {
    expect(resolveSkillDetailErrorState(indexedRepository('missing'))).toBe('repo-unavailable');
  });

  it('shows skill-not-found when the repository was never indexed', () => {
    expect(resolveSkillDetailErrorState(undefined)).toBe('not-found');
  });
});

function indexedRepository(lastStatus: IndexedRepository['lastStatus']): IndexedRepository {
  return {
    path: '/repo',
    indexedAt: new Date('2026-06-07T00:00:00.000Z'),
    lastStatus,
    type: 'standalone',
  };
}
