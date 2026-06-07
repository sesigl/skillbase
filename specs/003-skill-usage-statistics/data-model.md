# Data Model: Skill Usage Statistics

**Feature**: 003-skill-usage-statistics | **Date**: 2026-06-07

## Entity: SkillInvocation

The sole persistent entity in the `statistics` bounded context. Represents one recorded skill usage event received from Claude Code via OTLP.

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS skill_invocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name      TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('native', 'file_read')),
  tool_name       TEXT NOT NULL,
  file_path       TEXT,
  timestamp       TIMESTAMPTZ NOT NULL,
  session_id      TEXT,
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_skill_invocations_timestamp ON skill_invocations (timestamp DESC);
CREATE INDEX idx_skill_invocations_skill_name ON skill_invocations (skill_name);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Internal row identifier |
| `skill_name` | TEXT | NOT NULL | Skill identifier (directory name, e.g. `frontend-design`) |
| `source` | TEXT | NOT NULL, CHECK IN | `native` (Skill tool) or `file_read` (Read/Edit/Write tool) |
| `tool_name` | TEXT | NOT NULL | Claude Code tool: `Skill`, `Read`, `Edit`, `Write` |
| `file_path` | TEXT | NULLABLE | File path for file read events; NULL for native loads |
| `timestamp` | TIMESTAMPTZ | NOT NULL | When the event occurred (from OTLP `timeUnixNano`) |
| `session_id` | TEXT | NULLABLE | Claude Code session identifier (from OTLP `session.id`) |
| `idempotency_key` | TEXT | NOT NULL, UNIQUE | Composite of `traceId` + `spanId` + `timeUnixNano`. Prevents duplicate events on OTLP retry. |

### Indexes

- `idx_skill_invocations_timestamp`: For time-based queries (recent invocations, daily grouping)
- `idx_skill_invocations_skill_name`: For per-skill aggregation queries
- The UNIQUE constraint on `idempotency_key` serves as both dedup enforcement and lookup index

## Read Model: UsageSummary

Not persisted — computed from `SkillInvocation` at page render time. Lives in the application layer as a plain DTO.

```typescript
interface UsageSummary {
  totalInvocations: number;
  nativeInvocations: number;
  fileReadInvocations: number;
  distinctSkills: number;
  perSkillCounts: Array<{ skillName: string; count: number; lastUsedAt: Date }>;
  dailyCounts: Array<{ date: string; count: number }>;
  recentInvocations: SkillInvocation[];
}
```

### Query Patterns

**Total counts**:
```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE source = 'native') AS native,
  COUNT(*) FILTER (WHERE source = 'file_read') AS file_read,
  COUNT(DISTINCT skill_name) AS distinct_skills
FROM skill_invocations;
```

**Per-skill counts (top 10)**:
```sql
SELECT skill_name, COUNT(*) AS count, MAX(timestamp) AS last_used_at
FROM skill_invocations
GROUP BY skill_name
ORDER BY count DESC
LIMIT 10;
```

**Daily counts (last 30 days)**:
```sql
SELECT DATE(timestamp) AS date, COUNT(*) AS count
FROM skill_invocations
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

**Recent invocations (last 20)**:
```sql
SELECT *
FROM skill_invocations
ORDER BY timestamp DESC
LIMIT 20;
```

## Domain Model

### SkillInvocation Aggregate Root (TypeScript)

```typescript
// domain/skill-invocation/SkillInvocation.ts
import { z } from 'zod';

const FILE_TOOL_NAMES = ['Read', 'Edit', 'Write'] as const;

const BaseInvocationSchema = z.object({
  skillName: z.string().min(1).max(64),
  timestamp: z.date(),
  sessionId: z.string().nullable(),
  idempotencyKey: z.string().min(1),
});

export const RecordSkillInvocationInputSchema = z.discriminatedUnion('source', [
  BaseInvocationSchema.extend({ source: z.literal('native'), toolName: z.literal('Skill') }),
  BaseInvocationSchema.extend({
    source: z.literal('file_read'),
    toolName: z.enum(FILE_TOOL_NAMES),
    filePath: z.string().min(1),
  }),
]);

export type RecordSkillInvocationInput = z.infer<typeof RecordSkillInvocationInputSchema>;

export class SkillInvocation {
  static record(input: RecordSkillInvocationInput): SkillInvocation;
  static rehydrate(record: SkillInvocationRecord): SkillInvocation;
  toInsertRecord(): SkillInvocationInsertRecord;
}
```

`SkillInvocation` is the aggregate root. It owns source/tool/file-path invariants: native invocations must come from the `Skill` tool and have no file path; file-read invocations must come from `Read`, `Edit`, or `Write` and carry a file path.

### SkillInvocationRepository (Interface)

```typescript
// domain/skill-invocation/SkillInvocationRepository.ts
import type { SkillInvocation } from './SkillInvocation';

export interface SkillInvocationRepository {
  insert(invocation: SkillInvocation): Promise<boolean>;
  // Returns true on insert, false if duplicate (idempotency key conflict)

  getUsageSummary(): Promise<UsageSummary>;
}
```

## Relationships

- **No cross-BC relationships**: `SkillInvocation` does not reference catalog entities. Invocations are tracked by skill name string only.
- **Future linkage**: If a future feature links invocations to catalog skills, a `skillName` match (string comparison) is used — no foreign keys.
