import type { Skill } from '@lib/shared/skill';
import { Transactional } from '../../shared/infrastructure/persistence/Transactional';
import type { SkillRepository } from '../domain/skill/SkillRepository';

export class CatalogUseCases {
  constructor(private readonly skillRepository: SkillRepository) {}

  @Transactional
  async browseSkills(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }

  @Transactional
  async searchSkills(query: string): Promise<Skill[]> {
    return this.skillRepository.search(query);
  }
}
