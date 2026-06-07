export interface IndexedRepository {
  path: string;
  indexedAt: Date;
  lastStatus: 'valid' | 'missing' | 'invalid';
}

export interface ValidationError {
  file: string;
  message: string;
}

export interface RepositoryScanResult {
  repository: string;
  status: 'valid' | 'invalid';
  skills: import('../skill/Skill').Skill[];
  validationErrors: ValidationError[];
  warnings: string[];
}
