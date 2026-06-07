import type { RepositoryScanResult } from '../repository-registry/IndexedRepository';
import type { Skill } from './Skill';

export interface SkillRepository {
  findAll(repoPaths?: string[]): Promise<Skill[]>;
  search(query: string, repoPaths?: string[]): Promise<Skill[]>;
  scanRepository(repoPath: string): RepositoryScanResult;
  findByRepositoryAndName(repoPath: string, name: string): Promise<Skill | null>;
}
