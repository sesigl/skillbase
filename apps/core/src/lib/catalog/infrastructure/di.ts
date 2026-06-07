import { getDatabaseConnection } from '../../shared/database';
import { CatalogUseCases } from '../application/CatalogUseCases';
import { FilesystemSkillRepository } from './filesystem/FilesystemSkillRepository';
import { PostgresRepositoryRegistry } from './persistence/PostgresRepositoryRegistry';

export function createCatalogUseCases(): CatalogUseCases {
  const db = getDatabaseConnection();
  const registry = new PostgresRepositoryRegistry(db);
  const skillRepo = new FilesystemSkillRepository();
  return new CatalogUseCases(skillRepo, registry);
}
