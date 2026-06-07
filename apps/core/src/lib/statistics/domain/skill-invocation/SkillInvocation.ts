import { z } from 'zod';

const FILE_TOOL_NAMES = ['Read', 'Edit', 'Write'] as const;
const SOURCE_VALUES = ['native', 'file_read'] as const;

const BaseInvocationSchema = z.object({
  skillName: z.string().min(1).max(64),
  timestamp: z.date(),
  sessionId: z.string().nullable(),
  userId: z.string().min(1).nullable(),
  idempotencyKey: z.string().min(1),
});

export const RecordSkillInvocationInputSchema = z.discriminatedUnion('source', [
  BaseInvocationSchema.extend({
    source: z.literal('native'),
    toolName: z.literal('Skill'),
  }),
  BaseInvocationSchema.extend({
    source: z.literal('file_read'),
    toolName: z.enum(FILE_TOOL_NAMES),
    filePath: z.string().min(1),
  }),
]);

export type RecordSkillInvocationInput = z.infer<typeof RecordSkillInvocationInputSchema>;
export type SkillInvocationSource = (typeof SOURCE_VALUES)[number];

export const SkillInvocationRecordSchema = z.discriminatedUnion('source', [
  BaseInvocationSchema.extend({
    id: z.uuid(),
    source: z.literal('native'),
    toolName: z.literal('Skill'),
    filePath: z.null(),
  }),
  BaseInvocationSchema.extend({
    id: z.uuid(),
    source: z.literal('file_read'),
    toolName: z.enum(FILE_TOOL_NAMES),
    filePath: z.string().min(1),
  }),
]);

export type SkillInvocationRecord = z.infer<typeof SkillInvocationRecordSchema>;

export interface SkillInvocationInsertRecord {
  skillName: string;
  source: SkillInvocationSource;
  toolName: string;
  filePath: string | null;
  timestamp: Date;
  sessionId: string | null;
  userId: string | null;
  idempotencyKey: string;
}

export class SkillInvocation {
  private constructor(
    private readonly record: SkillInvocationRecord | SkillInvocationInsertRecord
  ) {}

  static record(input: RecordSkillInvocationInput): SkillInvocation {
    const parsed = RecordSkillInvocationInputSchema.parse(input);
    return new SkillInvocation({
      ...parsed,
      filePath: parsed.source === 'file_read' ? parsed.filePath : null,
    });
  }

  static rehydrate(record: SkillInvocationRecord): SkillInvocation {
    return new SkillInvocation(SkillInvocationRecordSchema.parse(record));
  }

  toInsertRecord(): SkillInvocationInsertRecord {
    return {
      skillName: this.record.skillName,
      source: this.record.source,
      toolName: this.record.toolName,
      filePath: this.record.filePath,
      timestamp: this.record.timestamp,
      sessionId: this.record.sessionId,
      userId: this.record.userId,
      idempotencyKey: this.record.idempotencyKey,
    };
  }

  get id(): string {
    return 'id' in this.record ? this.record.id : this.record.idempotencyKey;
  }

  get skillName(): string {
    return this.record.skillName;
  }

  get source(): SkillInvocationSource {
    return this.record.source;
  }

  get toolName(): string {
    return this.record.toolName;
  }

  get filePath(): string | null {
    return this.record.filePath;
  }

  get timestamp(): Date {
    return this.record.timestamp;
  }

  get sessionId(): string | null {
    return this.record.sessionId;
  }

  get userId(): string | null {
    return this.record.userId;
  }

  get idempotencyKey(): string {
    return this.record.idempotencyKey;
  }
}
