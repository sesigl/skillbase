import type { IndexedRepository } from '../domain/repository-registry/IndexedRepository';

export type SkillDetailErrorState = 'not-found' | 'repo-unavailable';

export function resolveSkillDetailErrorState(
  registeredRepository: IndexedRepository | undefined
): SkillDetailErrorState {
  return registeredRepository?.lastStatus === 'missing' ? 'repo-unavailable' : 'not-found';
}
