import { Transactional } from '../../shared/infrastructure/persistence/Transactional';
import {
  SkillInvocation,
  type RecordSkillInvocationInput,
} from '../domain/skill-invocation/SkillInvocation';
import type {
  SkillInvocationRepository,
  SkillUsage,
  SkillUsageOverview,
  UsageSummary,
} from '../domain/skill-invocation/SkillInvocationRepository';

interface RecordInvocationsResult {
  inserted: number;
  skipped: number;
}

export class StatisticsUseCases {
  constructor(private readonly repository: SkillInvocationRepository) {}

  @Transactional
  async recordInvocations(
    invocations: readonly RecordSkillInvocationInput[]
  ): Promise<RecordInvocationsResult> {
    let inserted = 0;
    let skipped = 0;

    for (const input of invocations) {
      const invocation = SkillInvocation.record(input);
      if (await this.repository.insert(invocation)) {
        inserted++;
      } else {
        skipped++;
      }
    }

    return { inserted, skipped };
  }

  @Transactional
  async getUsageSummary(): Promise<UsageSummary> {
    return this.repository.getUsageSummary();
  }

  @Transactional
  async getSkillUsage(skillName: string): Promise<SkillUsage> {
    return this.repository.getSkillUsage(skillName);
  }

  @Transactional
  async getSkillUsageOverview(): Promise<SkillUsageOverview[]> {
    return this.repository.getSkillUsageOverview();
  }
}
