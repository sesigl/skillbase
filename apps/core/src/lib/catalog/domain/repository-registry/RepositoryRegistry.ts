import type { RepositoryType } from './IndexedRepository';

export interface RepositoryRegistry {
  register(path: string, type: RepositoryType): Promise<void>;
  remove(path: string): Promise<void>;
  clearAll(): Promise<void>;
  listAll(): Promise<{ path: string; indexedAt: Date; lastStatus: string; type: RepositoryType }[]>;
  findByPath(
    path: string
  ): Promise<{ path: string; indexedAt: Date; lastStatus: string; type: RepositoryType } | null>;
}
