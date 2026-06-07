import { describe, expect, it } from 'vitest';
import { SkillInvocation } from '../../../../../src/lib/statistics/domain/skill-invocation/SkillInvocation';

describe('SkillInvocation', () => {
  it('records a native skill load without a file path', () => {
    const invocation = SkillInvocation.record({
      skillName: 'frontend-design',
      source: 'native',
      toolName: 'Skill',
      timestamp: new Date('2024-06-05T12:00:00.000Z'),
      sessionId: 'abc-123',
      userId: 'dev@skillbase.local',
      idempotencyKey: 'trace:span:time',
    });

    expect(invocation.skillName).toBe('frontend-design');
    expect(invocation.source).toBe('native');
    expect(invocation.toolName).toBe('Skill');
    expect(invocation.filePath).toBeNull();
    expect(invocation.userId).toBe('dev@skillbase.local');
  });

  it('records a file-tool skill access with its file path', () => {
    const invocation = SkillInvocation.record({
      skillName: 'frontend-design',
      source: 'file_read',
      toolName: 'Read',
      filePath: '/Users/dev/.claude/skills/frontend-design/SKILL.md',
      timestamp: new Date('2024-06-05T12:00:00.000Z'),
      sessionId: null,
      userId: null,
      idempotencyKey: 'trace:span:time',
    });

    expect(invocation.source).toBe('file_read');
    expect(invocation.filePath).toBe('/Users/dev/.claude/skills/frontend-design/SKILL.md');
    expect(invocation.sessionId).toBeNull();
    expect(invocation.userId).toBeNull();
  });

  it('rejects source and tool combinations that do not describe a skill invocation', () => {
    expect(() =>
      SkillInvocation.record({
        skillName: 'frontend-design',
        source: 'native',
        toolName: 'Read',
        timestamp: new Date('2024-06-05T12:00:00.000Z'),
        sessionId: null,
        userId: null,
        idempotencyKey: 'trace:span:time',
      } as never)
    ).toThrow();
  });
});
