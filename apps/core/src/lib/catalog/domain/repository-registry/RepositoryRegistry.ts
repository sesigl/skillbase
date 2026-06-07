export interface RepositoryRegistry {
  register(path: string): Promise<void>;
  remove(path: string): Promise<void>;
  clearAll(): Promise<void>;
  listAll(): Promise<{ path: string; indexedAt: Date; lastStatus: string }[]>;
  findByPath(path: string): Promise<{ path: string; indexedAt: Date; lastStatus: string } | null>;
}
