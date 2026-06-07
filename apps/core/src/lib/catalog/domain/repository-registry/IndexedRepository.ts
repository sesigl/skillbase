import type { Skill } from '../skill/Skill';

export type RepositoryType = 'standalone' | 'plugin' | 'multi-plugin';

export interface IndexedRepository {
  path: string;
  indexedAt: Date;
  lastStatus: 'valid' | 'missing' | 'invalid';
  type: RepositoryType;
}

export interface ValidationError {
  file: string;
  message: string;
}

export interface RepositoryScanResult {
  repository: string;
  status: 'valid' | 'invalid';
  skills: Skill[];
  validationErrors: ValidationError[];
  warnings: string[];
  repositoryType: RepositoryType;
}
