import type { Skill } from '@lib/shared/skill';

export interface SkillRepository {
  findAll(): Promise<Skill[]>;
  search(query: string): Promise<Skill[]>;
}
