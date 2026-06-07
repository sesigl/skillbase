# Research: Skill Usage Statistics

**Feature**: 003-skill-usage-statistics | **Date**: 2026-06-07

## 1. OTLP Ingestion: http/json vs http/protobuf

### Decision
Use OTLP `http/json` protocol instead of `http/protobuf`. Claude Code supports both. JSON eliminates the need for protobuf parsing dependencies entirely.

### Rationale
- `@opentelemetry/otlp-transformer` only exposes **export-side** serializers — no public `deserializeRequest` for incoming payloads
- Alternative: manual protobuf decoding via `protobufjs` + OTel proto definitions. This works but adds a heavyweight dependency (~500KB) for a single API route
- Claude Code's `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL` supports `http/json` — the user config becomes:
  ```bash
  export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json
  ```
- JSON payloads are standard `IExportLogsServiceRequest` objects, parseable with plain `JSON.parse()`
- The data structure is identical to protobuf's `toObject()` output — attributes are `{ key: string, value: { stringValue?: string, intValue?: number, ... } }`

### Alternatives Considered
- **protobufjs + OTel protos**: Works, but adds dependency and ~50 lines of proto loading boilerplate. Rejected for simplicity.
- **`@opentelemetry/otlp-transformer`**: Not designed for receiving. Rejected.

### Proto Attribute Access (JSON wire format)

```typescript
interface IOtlpLogRecord {
  timeUnixNano: string;
  severityNumber: number;
  severityText: string;
  body: { stringValue: string };
  attributes: Array<{ key: string; value: { stringValue?: string; intValue?: number; boolValue?: boolean; arrayValue?: unknown } }>;
  traceId: string;  // hex
  spanId: string;   // hex
}

function getAttribute(attrs: IOtlpLogRecord['attributes'], key: string): string | undefined {
  return attrs.find(a => a.key === key)?.value?.stringValue;
}
```

### Setup Instruction Update
The spec's setup instructions change `http/protobuf` → `http/json`:
```bash
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4321/api/telemetry/v1/logs
```

## 2. Idempotent Event Ingestion

### Decision
Use PostgreSQL `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` and read `rowCount` to detect whether a row was inserted.

### Rationale
- The `idempotency_key` column (composite of `traceId` + `spanId` + `timeUnixNano`) has a UNIQUE constraint
- `ON CONFLICT DO NOTHING` is a true skip — no MVCC write amplification, no dead tuples
- `rowCount` reports whether the insert created a row without returning unused data
- Application-level dedup (check-then-insert) has race conditions in `READ COMMITTED`
- `ON CONFLICT DO UPDATE SET id = id` burns dead tuples on every conflict — unnecessary overhead

### Pattern
```sql
INSERT INTO skill_invocations (skill_name, source, tool_name, file_path, timestamp, session_id, idempotency_key)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (idempotency_key) DO NOTHING
```

### Performance at Target Volume
- 1-100 events/minute → negligible load
- UNIQUE index lookup is sub-millisecond
- Batching not needed at this volume (single-user)

## 3. Astro API Route for Binary/JSON Body

### Decision
Use Astro API route at `src/pages/api/telemetry/v1/logs.ts` exporting a `POST` handler. Read the body via `await request.json()`.

### Rationale
- Astro API routes are the canonical way to expose external endpoints in Astro SSR
- The API routes AGENTS.md rule explicitly permits this: "External API endpoints consumed by non-Astro clients"
- `request.json()` handles the OTLP JSON payload natively
- Claude Code sets `Content-Type: application/json` for `http/json` protocol

### Pattern
```typescript
// src/pages/api/telemetry/v1/logs.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  // body is IExportLogsServiceRequest
  // Extract logRecords, filter, persist
  return new Response(JSON.stringify({ partialSuccess: {} }), { status: 200 });
};
```

## 4. New Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| None | — | — | — |

Using `http/json` eliminates the need for any new dependencies. The OTLP endpoint uses only Node.js built-ins and existing Astro APIs.

## 5. Skill Name Extraction from File Path

### Decision
Extract skill names from file read event `file_path` using string matching.

### Rules
1. If `file_path` ends with `SKILL.md`: extract the parent directory name (e.g., `/path/to/.claude/skills/frontend-design/SKILL.md` → `frontend-design`)
2. If `file_path` is inside `.claude/skills/<name>/` or `.opencode/skills/<name>/`: extract `<name>` from the path
3. If neither pattern matches: store `file_path` as-is, log a warning

### Implementation
```typescript
function extractSkillNameFromPath(filePath: string): string | null {
  const match = filePath.match(/\.(?:claude|opencode)\/skills\/([^/]+)/);
  return match?.[1] ?? null;
}
```

## 6. Navigation Implementation

### Decision
Add a `<Nav />` Astro component to `BaseLayout.astro` with two links: "Skills" (`/`) and "Metrics" (`/metrics`). Dark-themed, matching design system.

### Rationale
- No navigation exists today — we're adding the first one
- Top nav bar is the simplest pattern that works for 2 pages
- Uses existing design tokens (colors, fonts from `design-tokens.css`)
- Active state detection via `Astro.url.pathname`

## 7. Test Strategy

### Decision
Follow existing test patterns:
- **Use case tests** (`StatisticsUseCases.test.ts`): Talk to system only through `StatisticsUseCases` methods. Use Testcontainers for real PostgreSQL.
- **Use case tests** (`tests/lib/statistics/application/StatisticsUseCases.test.ts`): Test persistence through the application API against real PostgreSQL via Testcontainers.
- **No unit tests for domain** (`SkillInvocation.ts` has no behavior logic — it's a Zod schema + type)

### Test Database
Mirror `apps/core/tests/` pattern and reuse `tests/helpers/testDatabase.ts` for container lifecycle.
