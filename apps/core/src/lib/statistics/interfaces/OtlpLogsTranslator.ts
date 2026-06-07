import {
  RecordSkillInvocationInputSchema,
  type RecordSkillInvocationInput,
} from '../domain/skill-invocation/SkillInvocation';

const FILE_TOOL_NAMES = ['Read', 'Edit', 'Write'] as const;

type FileToolName = (typeof FILE_TOOL_NAMES)[number];

interface OTLPLogRecord {
  timeUnixNano: string;
  body: { stringValue: string };
  attributes: Array<{ key: string; value: { stringValue?: string } }>;
  traceId: string;
  spanId: string;
}

export interface OtlpSkillInvocationTranslation {
  invocations: RecordSkillInvocationInput[];
  skipped: number;
}

export function extractOtlpLogRecords(body: unknown): unknown[] | null {
  if (!(isRecord(body) && Array.isArray(body.resourceLogs))) return null;

  const logRecords: unknown[] = [];
  for (const resourceLog of body.resourceLogs) {
    if (!(isRecord(resourceLog) && Array.isArray(resourceLog.scopeLogs))) continue;
    for (const scopeLog of resourceLog.scopeLogs) {
      if (!(isRecord(scopeLog) && Array.isArray(scopeLog.logRecords))) continue;
      logRecords.push(...scopeLog.logRecords);
    }
  }

  return logRecords;
}

export function translateOtlpSkillInvocations(
  logRecords: readonly unknown[]
): OtlpSkillInvocationTranslation {
  const invocations: RecordSkillInvocationInput[] = [];
  let skipped = 0;

  for (const logRecord of logRecords) {
    const invocation = translateLogRecord(logRecord);
    if (invocation) {
      invocations.push(invocation);
    } else {
      skipped++;
    }
  }

  return { invocations, skipped };
}

function translateLogRecord(logRecord: unknown): RecordSkillInvocationInput | null {
  if (!isOTLPLogRecord(logRecord)) return null;
  if (logRecord.body.stringValue !== 'claude_code.tool') return null;

  const toolName = getAttribute(logRecord.attributes, 'tool_name');
  if (!toolName) return null;

  const timestamp = parseTimestamp(logRecord.timeUnixNano);
  if (!timestamp) return null;

  if (toolName === 'Skill') {
    const skillName = getAttribute(logRecord.attributes, 'skill_name');
    if (!skillName) return null;
    return parseInvocation({
      skillName,
      source: 'native',
      toolName,
      timestamp,
      sessionId: getAttribute(logRecord.attributes, 'session.id') ?? null,
      userId: getAttribute(logRecord.attributes, 'user.id') ?? null,
      idempotencyKey: buildIdempotencyKey(logRecord),
    });
  }

  if (!isFileToolName(toolName)) return null;

  const filePath = getAttribute(logRecord.attributes, 'file_path');
  if (!filePath) return null;

  const skillName = extractSkillNameFromPath(filePath);
  if (!skillName) return null;

  return parseInvocation({
    skillName,
    source: 'file_read',
    toolName,
    filePath,
    timestamp,
    sessionId: getAttribute(logRecord.attributes, 'session.id') ?? null,
    userId: getAttribute(logRecord.attributes, 'user.id') ?? null,
    idempotencyKey: buildIdempotencyKey(logRecord),
  });
}

function parseInvocation(input: RecordSkillInvocationInput): RecordSkillInvocationInput | null {
  const result = RecordSkillInvocationInputSchema.safeParse(input);
  return result.success ? result.data : null;
}

function getAttribute(attrs: OTLPLogRecord['attributes'], key: string): string | undefined {
  return attrs.find((attribute) => attribute.key === key)?.value.stringValue;
}

function extractSkillNameFromPath(filePath: string): string | null {
  const match = filePath.match(/\.(?:claude|opencode)\/skills\/([^/]+)/);
  return match?.[1] ?? null;
}

function buildIdempotencyKey(logRecord: OTLPLogRecord): string {
  return `${logRecord.traceId}:${logRecord.spanId}:${logRecord.timeUnixNano}`;
}

function isFileToolName(toolName: string): toolName is FileToolName {
  return FILE_TOOL_NAMES.includes(toolName as FileToolName);
}

function parseTimestamp(timeUnixNano: string): Date | null {
  try {
    const timestamp = new Date(Number(BigInt(timeUnixNano) / 1_000_000n));
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringValueAttribute(value: unknown): value is OTLPLogRecord['attributes'][number] {
  if (!isRecord(value) || typeof value.key !== 'string' || !isRecord(value.value)) return false;
  return value.value.stringValue === undefined || typeof value.value.stringValue === 'string';
}

function isOTLPLogRecord(value: unknown): value is OTLPLogRecord {
  if (!isRecord(value)) return false;
  if (!isRecord(value.body) || typeof value.body.stringValue !== 'string') return false;
  return (
    typeof value.timeUnixNano === 'string' &&
    typeof value.traceId === 'string' &&
    value.traceId.length > 0 &&
    typeof value.spanId === 'string' &&
    value.spanId.length > 0 &&
    Array.isArray(value.attributes) &&
    value.attributes.every(isStringValueAttribute)
  );
}
