import { beforeEach, describe, expect, it } from 'vitest';
import { createStatisticsUseCases } from '../../../../src/lib/statistics/infrastructure/di';
import type { RecordSkillInvocationInput } from '../../../../src/lib/statistics/domain/skill-invocation/SkillInvocation';
import { cleanDatabase } from '../../../helpers/testDatabase';

const timestamp = new Date('2024-06-05T12:00:00.000Z');

function nativeInvocation(
  overrides: Partial<RecordSkillInvocationInput> = {}
): RecordSkillInvocationInput {
  return {
    skillName: 'frontend-design',
    source: 'native',
    toolName: 'Skill',
    timestamp,
    sessionId: 'abc-123',
    userId: 'dev@skillbase.local',
    idempotencyKey: 'trace-a:span-a:1717600000000000000',
    ...overrides,
  } as RecordSkillInvocationInput;
}

function fileReadInvocation(
  overrides: Partial<RecordSkillInvocationInput> = {}
): RecordSkillInvocationInput {
  return {
    skillName: 'deploy-tool',
    source: 'file_read',
    toolName: 'Read',
    filePath: '/Users/dev/.claude/skills/deploy-tool/SKILL.md',
    timestamp,
    sessionId: 'abc-123',
    userId: 'dev@skillbase.local',
    idempotencyKey: 'trace-b:span-b:1717600000000000001',
    ...overrides,
  } as RecordSkillInvocationInput;
}

describe('StatisticsUseCases', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('recordInvocations', () => {
    it('records valid skill invocations through the aggregate root', async () => {
      const useCases = createStatisticsUseCases();

      const result = await useCases.recordInvocations([nativeInvocation(), fileReadInvocation()]);

      expect(result).toEqual({ inserted: 2, skipped: 0 });

      const summary = await useCases.getUsageSummary();
      expect(summary.totalInvocations).toBe(2);
      expect(summary.nativeInvocations).toBe(1);
      expect(summary.fileReadInvocations).toBe(1);
    });

    it('skips duplicate invocations by idempotency key', async () => {
      const useCases = createStatisticsUseCases();
      const invocation = nativeInvocation();

      const first = await useCases.recordInvocations([invocation]);
      const second = await useCases.recordInvocations([invocation]);

      expect(first).toEqual({ inserted: 1, skipped: 0 });
      expect(second).toEqual({ inserted: 0, skipped: 1 });

      const summary = await useCases.getUsageSummary();
      expect(summary.totalInvocations).toBe(1);
    });

    it('returns zero inserted and skipped for an empty command list', async () => {
      const useCases = createStatisticsUseCases();

      const result = await useCases.recordInvocations([]);

      expect(result).toEqual({ inserted: 0, skipped: 0 });
    });
  });

  describe('getUsageSummary', () => {
    it('returns zeroes for empty database', async () => {
      const useCases = createStatisticsUseCases();

      const summary = await useCases.getUsageSummary();

      expect(summary.totalInvocations).toBe(0);
      expect(summary.nativeInvocations).toBe(0);
      expect(summary.fileReadInvocations).toBe(0);
      expect(summary.distinctSkills).toBe(0);
      expect(summary.perSkillCounts).toEqual([]);
      expect(summary.dailyCounts).toEqual([]);
      expect(summary.recentInvocations).toEqual([]);
    });

    it('returns totals and per-skill counts for multiple invocations', async () => {
      const useCases = createStatisticsUseCases();

      await useCases.recordInvocations([
        nativeInvocation({ idempotencyKey: 'trace-a:span-a:1' }),
        nativeInvocation({ idempotencyKey: 'trace-b:span-b:2' }),
        nativeInvocation({ skillName: 'git-conventions', idempotencyKey: 'trace-c:span-c:3' }),
        fileReadInvocation({ idempotencyKey: 'trace-d:span-d:4' }),
      ]);

      const summary = await useCases.getUsageSummary();

      expect(summary.totalInvocations).toBe(4);
      expect(summary.nativeInvocations).toBe(3);
      expect(summary.fileReadInvocations).toBe(1);
      expect(summary.distinctSkills).toBe(3);
      expect(summary.perSkillCounts).toHaveLength(3);
      expect(summary.perSkillCounts[0].skillName).toBe('frontend-design');
      expect(summary.perSkillCounts[0].count).toBe(2);
      expect(summary.perSkillCounts[0].lastUsedAt).toBeInstanceOf(Date);
      expect(summary.recentInvocations).toHaveLength(4);
    });

    it('groups daily counts for invocations spanning multiple days', async () => {
      const useCases = createStatisticsUseCases();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await useCases.recordInvocations([
        nativeInvocation({ timestamp: yesterday, idempotencyKey: 'trace-a:span-a:1' }),
        nativeInvocation({
          skillName: 'git-conventions',
          timestamp: new Date(),
          idempotencyKey: 'trace-b:span-b:2',
        }),
      ]);

      const summary = await useCases.getUsageSummary();

      expect(summary.totalInvocations).toBe(2);
      expect(summary.dailyCounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getSkillUsage', () => {
    it('returns per-skill usage without treating sessions as users', async () => {
      const useCases = createStatisticsUseCases();
      const now = new Date();

      await useCases.recordInvocations([
        nativeInvocation({
          timestamp: now,
          userId: 'alice@skillbase.local',
          idempotencyKey: 'trace-a:span-a:1',
        }),
        fileReadInvocation({
          skillName: 'frontend-design',
          timestamp: now,
          userId: 'alice@skillbase.local',
          idempotencyKey: 'trace-b:span-b:2',
        }),
        nativeInvocation({
          timestamp: now,
          userId: 'bob@skillbase.local',
          sessionId: 'def-456',
          idempotencyKey: 'trace-c:span-c:3',
        }),
        nativeInvocation({
          timestamp: now,
          userId: null,
          sessionId: 'ghi-789',
          idempotencyKey: 'trace-d:span-d:4',
        }),
        nativeInvocation({
          skillName: 'git-conventions',
          timestamp: now,
          userId: 'carla@skillbase.local',
          sessionId: 'jkl-012',
          idempotencyKey: 'trace-e:span-e:5',
        }),
      ]);

      const usage = await useCases.getSkillUsage('frontend-design');

      expect(usage.skillName).toBe('frontend-design');
      expect(usage.totalInvocations).toBe(4);
      expect(usage.nativeInvocations).toBe(3);
      expect(usage.fileReadInvocations).toBe(1);
      expect(usage.knownUsers).toBe(2);
      expect(usage.sessions).toBe(3);
      expect(usage.unassignedInvocations).toBe(1);
      expect(usage.dailyCounts.reduce((total, day) => total + day.count, 0)).toBe(4);
      expect(usage.perUserCounts).toEqual([
        {
          userId: 'alice@skillbase.local',
          totalInvocations: 2,
          nativeInvocations: 1,
          fileReadInvocations: 1,
          sessions: 1,
          lastUsedAt: expect.any(Date),
        },
        {
          userId: 'bob@skillbase.local',
          totalInvocations: 1,
          nativeInvocations: 1,
          fileReadInvocations: 0,
          sessions: 1,
          lastUsedAt: expect.any(Date),
        },
      ]);
    });
  });

  describe('getSkillUsageOverview', () => {
    it('orders skills by unique known users in the last 30 days', async () => {
      const useCases = createStatisticsUseCases();
      const now = new Date();
      const oldTimestamp = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

      await useCases.recordInvocations([
        nativeInvocation({
          skillName: 'frontend-design',
          timestamp: now,
          userId: 'alice@skillbase.local',
          idempotencyKey: 'trace-a:span-a:1',
        }),
        nativeInvocation({
          skillName: 'frontend-design',
          timestamp: now,
          userId: 'bob@skillbase.local',
          idempotencyKey: 'trace-b:span-b:2',
        }),
        nativeInvocation({
          skillName: 'frontend-design',
          timestamp: now,
          userId: null,
          idempotencyKey: 'trace-c:span-c:3',
        }),
        nativeInvocation({
          skillName: 'git-conventions',
          timestamp: now,
          userId: 'carla@skillbase.local',
          idempotencyKey: 'trace-d:span-d:4',
        }),
        nativeInvocation({
          skillName: 'git-conventions',
          timestamp: now,
          userId: 'carla@skillbase.local',
          idempotencyKey: 'trace-e:span-e:5',
        }),
        nativeInvocation({
          skillName: 'legacy-skill',
          timestamp: oldTimestamp,
          userId: 'dana@skillbase.local',
          idempotencyKey: 'trace-f:span-f:6',
        }),
      ]);

      const overview = await useCases.getSkillUsageOverview();

      expect(overview).toEqual([
        {
          skillName: 'frontend-design',
          uniqueUsersLast30Days: 2,
          invocationsLast30Days: 3,
          lastUsedAt: expect.any(Date),
        },
        {
          skillName: 'git-conventions',
          uniqueUsersLast30Days: 1,
          invocationsLast30Days: 2,
          lastUsedAt: expect.any(Date),
        },
      ]);
    });
  });
});
