import { getDatabaseConnection } from '../../shared/database';
import { CatalogUseCases } from '../application/CatalogUseCases';
import { PostgresSkillRepository } from './persistence/PostgresSkillRepository';

export function createCatalogUseCases(): CatalogUseCases {
  const db = getDatabaseConnection();
  const repository = new PostgresSkillRepository(db);
  return new CatalogUseCases(repository);
}
