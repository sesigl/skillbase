import { resolve } from 'node:path';
import { Transactional } from '../../shared/infrastructure/persistence/Transactional';
import type {
  IndexedRepository,
  RepositoryScanResult,
} from '../domain/repository-registry/IndexedRepository';
import type { RepositoryRegistry } from '../domain/repository-registry/RepositoryRegistry';
import type { Skill } from '../domain/skill/Skill';
import type { SkillRepository } from '../domain/skill/SkillRepository';
import { pathExists } from '../../shared/git-utils';

export class CatalogUseCases {
  constructor(
    private readonly skillRepository: SkillRepository,
    private readonly repositoryRegistry: RepositoryRegistry
  ) {}

  @Transactional
  async browseSkills(): Promise<Skill[]> {
    const repos = await this.repositoryRegistry.listAll();
    const paths = repos.map((r) => r.path);
    return this.skillRepository.findAll(paths);
  }

  @Transactional
  async searchSkills(query: string): Promise<Skill[]> {
    const repos = await this.repositoryRegistry.listAll();
    const paths = repos.map((r) => r.path);
    return this.skillRepository.search(query, paths);
  }

  @Transactional
  async indexRepository(path: string): Promise<RepositoryScanResult> {
    const absPath = resolve(path);

    if (!pathExists(absPath)) {
      return {
        repository: absPath,
        status: 'invalid',
        skills: [],
        validationErrors: [{ file: absPath, message: `Path does not exist: ${absPath}` }],
        warnings: [],
        repositoryType: 'standalone',
      };
    }

    const scanResult = this.skillRepository.scanRepository(absPath);

    if (scanResult.status === 'valid') {
      await this.repositoryRegistry.register(scanResult.repository, scanResult.repositoryType);
    }

    return scanResult;
  }

  @Transactional
  async listRepositories(): Promise<IndexedRepository[]> {
    const repos = await this.repositoryRegistry.listAll();
    return repos.map((r) => ({
      path: r.path,
      indexedAt: r.indexedAt,
      lastStatus: pathExists(r.path) ? 'valid' : 'missing',
      type: r.type,
    }));
  }

  @Transactional
  async removeRepository(path: string): Promise<void> {
    const absPath = resolve(path);
    await this.repositoryRegistry.remove(absPath);
  }

  @Transactional
  async clearAll(): Promise<void> {
    await this.repositoryRegistry.clearAll();
  }

  @Transactional
  async getSkill(repoPath: string, name: string): Promise<Skill | null> {
    const absPath = resolve(repoPath);
    const registered = await this.repositoryRegistry.findByPath(absPath);
    if (!registered) return null;
    return this.skillRepository.findByRepositoryAndName(absPath, name);
  }
}
