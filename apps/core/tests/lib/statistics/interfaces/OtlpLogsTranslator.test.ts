import { describe, expect, it } from 'vitest';
import {
  extractOtlpLogRecords,
  translateOtlpSkillInvocations,
} from '../../../../src/lib/statistics/interfaces/OtlpLogsTranslator';

describe('OtlpLogsTranslator', () => {
  it('extracts nested log records from an OTLP export request', () => {
    const skillLog = nativeSkillLog('frontend-design', 'trace-a', 'span-a', '1');
    const request = {
      resourceLogs: [
        {
          scopeLogs: [
            {
              logRecords: [skillLog],
            },
          ],
        },
      ],
    };

    expect(extractOtlpLogRecords(request)).toEqual([skillLog]);
  });

  it('returns null when the payload is not an OTLP export request', () => {
    expect(extractOtlpLogRecords({ resourceLogs: 'invalid' })).toBeNull();
  });

  it('translates native skill loads and skill file accesses into domain commands', () => {
    const { invocations, skipped } = translateOtlpSkillInvocations([
      nativeSkillLog('frontend-design', 'trace-a', 'span-a', '1717600000000000000'),
      fileToolLog(
        'Read',
        '/Users/dev/.claude/skills/deploy-tool/SKILL.md',
        'trace-b',
        'span-b',
        '1717600000000000001'
      ),
      fileToolLog(
        'Edit',
        '/home/user/.opencode/skills/git-conventions/scripts/run.sh',
        'trace-c',
        'span-c',
        '1717600000000000002'
      ),
    ]);

    expect(skipped).toBe(0);
    expect(invocations).toHaveLength(3);
    expect(invocations[0]).toMatchObject({
      skillName: 'frontend-design',
      source: 'native',
      toolName: 'Skill',
      userId: 'dev@skillbase.local',
      idempotencyKey: 'trace-a:span-a:1717600000000000000',
    });
    expect(invocations[1]).toMatchObject({
      skillName: 'deploy-tool',
      source: 'file_read',
      toolName: 'Read',
      userId: null,
    });
    expect(invocations[2]).toMatchObject({
      skillName: 'git-conventions',
      source: 'file_read',
      toolName: 'Edit',
      userId: null,
    });
  });

  it('skips malformed and non-skill records without failing the batch', () => {
    const { invocations, skipped } = translateOtlpSkillInvocations([
      nativeSkillLog('frontend-design', 'trace-a', 'span-a', '1717600000000000000'),
      nativeSkillLog('', 'trace-b', 'span-b', '1717600000000000001'),
      fileToolLog('Read', '/tmp/not-a-skill.txt', 'trace-c', 'span-c', '1717600000000000002'),
      {
        timeUnixNano: '1717600000000000003',
        body: { stringValue: 'claude_code.tool' },
        attributes: [{ key: 'tool_name', value: { stringValue: 'Bash' } }],
        traceId: 'trace-d',
        spanId: 'span-d',
      },
      { body: { stringValue: 'claude_code.tool' } },
    ]);

    expect(invocations).toHaveLength(1);
    expect(skipped).toBe(4);
  });
});

function nativeSkillLog(skillName: string, traceId: string, spanId: string, timeUnixNano: string) {
  return {
    timeUnixNano,
    severityNumber: 9,
    severityText: 'INFO',
    body: { stringValue: 'claude_code.tool' },
    attributes: [
      { key: 'tool_name', value: { stringValue: 'Skill' } },
      { key: 'skill_name', value: { stringValue: skillName } },
      { key: 'session.id', value: { stringValue: 'abc-123' } },
      { key: 'user.id', value: { stringValue: 'dev@skillbase.local' } },
    ],
    traceId,
    spanId,
  };
}

function fileToolLog(
  toolName: 'Read' | 'Edit' | 'Write',
  filePath: string,
  traceId: string,
  spanId: string,
  timeUnixNano: string
) {
  return {
    timeUnixNano,
    severityNumber: 9,
    severityText: 'INFO',
    body: { stringValue: 'claude_code.tool' },
    attributes: [
      { key: 'tool_name', value: { stringValue: toolName } },
      { key: 'file_path', value: { stringValue: filePath } },
      { key: 'session.id', value: { stringValue: 'abc-123' } },
    ],
    traceId,
    spanId,
  };
}
