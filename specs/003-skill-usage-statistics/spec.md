# Feature Specification: Skill Usage Statistics

**Feature Branch**: `003-skill-usage-statistics`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "record usage statistics of skills — ALWAYS if a skill is read, either via native skill loading via Claude Code or by just a plain file read. We can differentiate between these two events as secondary information. The core app gets a metrics page. On click, the user sees how to set up metrics recording for Claude Code — ideally just env vars to add to Claude Code hooks on user level, which then calls an API endpoint. The hook should not be too complicated; filter early if possible. The call should be fast and cheap. Use open standards like OpenTelemetry if possible."

## Clarifications

### Session 2026-06-07

- Q: How does Claude Code emit skill usage events? → A: Claude Code has built-in OpenTelemetry support. When `CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_LOGS_EXPORTER=otlp`, and `OTEL_LOG_TOOL_DETAILS=1` are set, it emits `claude_code.tool` log events via OTLP. The Skill tool emits `tool_name="Skill"` with `skill_name="<name>"`. File tools (Read, Edit, Write) emit `tool_name="Read"` etc. with `file_path="<path>"`. No custom hooks are needed — the built-in OTel instrumentation already captures both skill loading and file reads.

- Q: What protocol does Skillbase use to receive events? → A: OTLP over HTTP (`http/json`). Claude Code sends OpenTelemetry log records as JSON to the configured endpoint. Skillbase parses the JSON payload directly — no protobuf decoding needed. This is an external API endpoint consumed by a non-Astro client (Claude Code), so it belongs in `src/pages/api/` per the API routes rule.

- Q: What events are recorded? → A: All `claude_code.tool` events where either (a) `tool_name="Skill"` (native skill loading) or (b) `tool_name` is a file tool (Read, Edit, Write) and `file_path` points to a `SKILL.md` file or a file inside a `.claude/skills/` or `.opencode/skills/` directory. All other events are discarded — filtering happens server-side, not in the client hook.

- Q: Is the event stored or processed in real-time? → A: Received events are validated, extracted, and persisted to PostgreSQL immediately. The endpoint is a fast fire-and-forget write — no complex processing at ingest time.

- Q: How does the user set up Claude Code? → A: The user sets four environment variables before running `claude`:
  ```bash
  export CLAUDE_CODE_ENABLE_TELEMETRY=1
  export OTEL_LOGS_EXPORTER=otlp
  export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json
  export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4321/api/telemetry/v1/logs
  export OTEL_LOG_TOOL_DETAILS=1
  ```
  These go into `~/.claude/settings.json` under `env` for persistent setup. The metrics page in Skillbase shows these exact instructions with the user's actual endpoint URL.

- Q: Is this single-user or multi-user? → A: Single-user for v1 (per Constitution VI). Multi-user team analytics is a planned extension.

- Q: Can the user send events from multiple machines? → A: No. The OTLP endpoint is localhost by default. Remote access requires the user to expose the endpoint themselves — out of scope for v1.

- Q: Is this a new bounded context or part of `catalog`? → A: New bounded context named `statistics` (`src/lib/statistics/`). The `catalog` BC is responsible for skill discovery from git repos; `statistics` owns invocation recording and querying. The two BCs communicate via direct calls when needed (no cross-BC foreign keys). This follows Constitution VIII (storage isolation) and ADR-0001 (read-model projections for analytics data).

- Q: How does navigation work between the catalog page and the metrics page? → A: Top navigation bar added to `BaseLayout.astro` with two links: **Skills** (→ `/`) and **Metrics** (→ `/metrics`). The nav is dark-themed, matching the existing design system. Both pages share the same `BaseLayout` wrapper.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive and Record Skill Usage Events (Priority: P1)

A user has configured Claude Code to send OpenTelemetry logs to their Skillbase instance. While using Claude Code, the Skill tool is invoked (e.g., Claude loads the `frontend-design` skill) and file tools read skill files (e.g., Read opens a `SKILL.md`). Skillbase receives these events via the OTLP HTTP endpoint, filters for skill-relevant ones, and stores them in PostgreSQL. The user can later view these records on the metrics page.

**Why this priority**: This is the data pipeline. Without event ingestion, there is nothing to display. Every other story depends on stored invocation data.

**Independent Test**: Start Skillbase, configure Claude Code with the OTLP env vars, trigger a Skill tool usage (`/skill frontend-design`), then query the database directly to verify a row exists with `skill_name="frontend-design"` and `source="native"`. Do the same with a Read of a `SKILL.md` file and verify `source="file_read"`.

**Acceptance Scenarios**:

1. **Given** Skillbase is running and Claude Code is configured with OTLP env vars pointing to it, **When** Claude Code loads a skill natively via the Skill tool, **Then** Skillbase receives the `claude_code.tool` event, recognizes `tool_name="Skill"`, extracts `skill_name`, and persists a `SkillInvocation` record with `source="native"`.

2. **Given** Skillbase is running and Claude Code is configured, **When** Claude Code reads a `SKILL.md` file (tool `Read` on `path/to/.claude/skills/deploy/SKILL.md`), **Then** Skillbase receives the event, recognizes the file path matches a skill pattern, extracts the skill name from the path, and persists a `SkillInvocation` record with `source="file_read"` and `tool_name="Read"`.

3. **Given** Skillbase is running, **When** Claude Code sends a non-skill event (e.g., `tool_name="Bash"`, `tool_name="Grep"`), **Then** Skillbase acknowledges the event but does not store it — filtering is server-side.

4. **Given** Skillbase is not running (endpoint unreachable), **When** Claude Code emits telemetry events, **Then** Claude Code continues operating normally without errors — telemetry export failures are non-blocking.

5. **Given** an OTLP log record with missing or malformed fields (no `tool_name`, no `skill_name` when expected), **When** Skillbase receives it, **Then** the event is rejected for that specific record with a meaningful log entry but does not affect other valid records in the same batch.

---

### User Story 2 - View Metrics Dashboard (Priority: P2)

A user visits the Skillbase core app and navigates to the Metrics page (`/metrics`). They see a dashboard showing: total skill invocations, invocation counts per skill, breakdown by source (native vs file read), daily invocation table, and most-recent invocations. The dashboard works with zero invocations (shows empty state with setup prompt) and with many invocations.

**How the user interacts**: The user clicks "Metrics" in the core app navigation (next to the existing nav items). The page loads server-side rendered with all stats pre-computed from the database. The page shows:
- **Summary cards**: Total invocations, skills with invocations, native loads, file reads.
- **Daily invocation table**: Date → invocation count, sorted by date descending.
- **Most-used skills table**: Skill name, invocation count, last used timestamp, sorted by count descending.
- **Recent invocations list**: Last 20 invocations showing skill name, source badge, timestamp.
- **Setup instructions**: If zero invocations exist, a prominent callout at the top shows the exact env vars to set with a copy-paste block. If invocations exist, a small info link reveals setup instructions.

All data is loaded server-side — no client-side fetching. The page is zero-JS apart from the setup code block copy button.

**Why this priority**: The dashboard is the user-facing value — it's why they set up telemetry. But it depends on P1 (ingestion must work first).

**Independent Test**: Insert test `SkillInvocation` records directly into PostgreSQL, then visit `/metrics` and verify the summary counts, skill table, and recent list all reflect the seeded data accurately.

**Acceptance Scenarios**:

1. **Given** multiple skill invocations exist in the database, **When** the user visits `/metrics`, **Then** they see total invocation count, per-skill counts, native-vs-file-read breakdown, and a timeline of usage.

2. **Given** no skill invocations exist, **When** the user visits `/metrics`, **Then** they see an empty state with the OTLP setup instructions prominently displayed (env vars, where to put them, what to expect).

3. **Given** invocations span multiple days, **When** the user views the daily invocation table, **Then** they see invocations grouped by date in chronological order.

4. **Given** the same skill was invoked via both native loading and file read, **When** the user views the per-skill breakdown, **Then** both sources are counted and the breakdown shows distinct numbers for each.

---

### User Story 3 - Setup Instructions and Configuration Reference (Priority: P3)

A user who has just set up Skillbase wants to know exactly how to configure Claude Code to send skill usage data. They open the Metrics page and see clear, copyable setup instructions with the exact endpoint URL derived from the running instance. The instructions cover both temporary (env vars in terminal) and persistent (settings.json) configuration.

**How the user interacts**: The Metrics page always has a "Setup" section — either as the primary content when no data exists (P2 scenario), or as a collapsible info panel at the bottom of the page. The instructions show:

```bash
# In your terminal before running claude:
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4321/api/telemetry/v1/logs
export OTEL_LOG_TOOL_DETAILS=1
```

Plus the persistent equivalent in `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_LOGS_PROTOCOL": "http/json",
    "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT": "http://localhost:4321/api/telemetry/v1/logs",
    "OTEL_LOG_TOOL_DETAILS": "1"
  }
}
```

The endpoint URL in the instructions is derived from the actual running instance (never hardcoded). A copy button copies the env var block to clipboard.

**Why this priority**: Setup instructions are essential for adoption but only need to be implemented once. The instructions themselves don't change after initial implementation.

**Independent Test**: Visit `/metrics`, verify the setup instructions are present and the endpoint URL matches the running instance's host:port.

**Acceptance Scenarios**:

1. **Given** the user visits `/metrics` for the first time (no invocations), **When** they see the setup instructions, **Then** the endpoint URL in the code block matches `http://<actual-host>:<actual-port>/api/telemetry/v1/logs`.

2. **Given** the user clicks the copy button on the env var block, **When** they paste into their terminal, **Then** all five export lines with the correct endpoint URL are pasted.

---

---

### Edge Cases

- **High event volume**: Claude Code can emit many tool events per second during active use. The OTLP endpoint must handle batches efficiently — process each record in a batch independently, skip non-skill events fast, and insert only skill-relevant records. Batch inserts for efficiency.

- **Duplicate events**: Claude Code may re-send events on retry. Skillbase should use idempotency keys (OTLP log record `timeUnixNano` + `observedTimeUnixNano` + `traceId` + `spanId` composite) to avoid counting the same event twice.

- **Very large skill names**: Skill names per spec are 1-64 chars (lowercase alphanumeric + hyphens). If a name exceeds this, truncate and log a warning.

- **Unknown file path patterns**: If a file read event has a `file_path` that looks like a skill file but doesn't match known patterns exactly (e.g., a deep symlink), extract the best-guess skill name from the path or store with `file_path` as-is.

- **OTLP protocol buffer parsing errors**: If the request body is not valid protobuf, return HTTP 400 with a descriptive error. Claude Code handles this gracefully and retries.

- **Database unavailable**: If PostgreSQL is down when an event arrives, return HTTP 503 to signal Claude Code to retry later. Log the failure.

- **OTEL_LOG_TOOL_DETAILS not set**: If the user forgets `OTEL_LOG_TOOL_DETAILS=1`, the `skill_name` and `file_path` attributes are not sent. Skillbase receives events but cannot identify skills — a warning on the metrics page helps the user debug this.

- **Events from before skill was indexed**: A skill may appear in usage events before the repository containing it was indexed in Skillbase. This is fine — the metrics page shows invocations by name regardless of whether the skill is in the catalog. Future integration: link invocations to catalog entries.

## Requirements *(mandatory)*

### Functional Requirements

#### OTLP Ingestion Endpoint

- **FR-001**: System MUST expose an OTLP logs endpoint at `POST /api/telemetry/v1/logs` accepting OTLP `http/json` encoded `ExportLogsServiceRequest` payloads.

- **FR-002**: System MUST parse each `LogRecord` in the request, extract the `body` (event name), and inspect `attributes` for `tool_name`, `skill_name`, and `file_path`.

- **FR-003**: System MUST identify a log record as "skill-relevant" when:
  - `tool_name` is `"Skill"` (native skill loading), OR
  - `tool_name` is one of `"Read"`, `"Edit"`, `"Write"` AND `file_path` matches a skill file pattern (path contains `SKILL.md` or is inside `.claude/skills/` or `.opencode/skills/`).

- **FR-004**: System MUST discard all non-skill-relevant log records without storing them.

- **FR-005**: System MUST extract the `skill_name` attribute from native Skill tool events. If missing, the record is rejected with a warning.

- **FR-006**: System MUST derive the skill name from `file_path` for file read events: extract the parent directory name when the path ends with `SKILL.md`, or the innermost skill directory name when the path is inside a skills directory.

- **FR-007**: System MUST record the invocation source: `"native"` for Skill tool events, `"file_read"` for file tool events targeting skill files.

- **FR-008**: System MUST be idempotent: if the same OTLP log record (identified by `traceId` + `spanId` + `timeUnixNano`) arrives more than once, it MUST NOT create a duplicate `SkillInvocation`.

- **FR-009**: System MUST accept batched log records and process each independently — one invalid record in a batch MUST NOT prevent valid records from being stored.

- **FR-010**: System MUST return HTTP 200 on success (even if some individual records were rejected) or HTTP 400 if the entire request is malformed. HTTP 503 if the database is unavailable.

- **FR-011**: System MUST NOT require authentication on the OTLP endpoint for v1 (single-user, localhost-only by default).

#### SkillInvocation Persistence

- **FR-012**: System MUST persist each skill invocation with at minimum: `skill_name` (string), `source` (`"native"` or `"file_read"`), `tool_name` (the Claude Code tool that triggered it, e.g., `"Skill"`, `"Read"`, `"Edit"`, `"Write"`), `file_path` (nullable, for file read events), `timestamp` (when the event occurred, from the OTLP `timeUnixNano`), `session_id` (from OTLP `session.id` attribute).

- **FR-013**: System MUST store invocations in PostgreSQL.

- **FR-014**: System MUST define `SkillInvocationRepository` interface in `src/lib/statistics/domain/` and a PostgreSQL implementation in `src/lib/statistics/infrastructure/persistence/`.

#### Metrics Page

- **FR-015**: System MUST provide a `/metrics` page in the core app accessible from the main navigation.

- **FR-016**: The metrics page MUST show, in a single-column vertical layout matching the catalog page pattern: (1) four summary cards in a row (total invocations, skills with invocations, native loads, file reads), (2) daily invocation table (last 30 days, grouped by date descending), (3) most-used skills table (top 10, sorted by count descending), (4) most recent 20 invocations list, (5) setup instructions panel (collapsible, auto-expanded when zero invocations). All rendered server-side.

- **FR-017**: When zero invocations exist, the page MUST show setup instructions with the exact OTLP endpoint URL derived from the running instance.

- **FR-018**: The setup instructions MUST include both terminal env-vars and `settings.json` formats.

- **FR-019**: All metrics data MUST be computed server-side (Astro SSR) — no client-side data fetching.

- **FR-020**: The page MUST use the Skillbase design system (colors, fonts, UI component patterns).

#### Navigation

- **FR-021**: The core app navigation MUST include a "Metrics" link next to existing navigation items.

#### Database Migration

- **FR-022**: System MUST add a `skill_invocations` table via `db-migrate` migration in `apps/core/migrations/`, following the existing pattern (timestamped JS shim + SQL in `sqls/`). Table columns: `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid()), `skill_name` (TEXT NOT NULL), `source` (TEXT NOT NULL CHECK IN ('native', 'file_read')), `tool_name` (TEXT NOT NULL), `file_path` (TEXT), `timestamp` (TIMESTAMPTZ NOT NULL), `session_id` (TEXT), `idempotency_key` (TEXT NOT NULL UNIQUE).

### Key Entities

- **SkillInvocation**: A record of a single skill usage event received from Claude Code via OTLP. Attributes: `id` (UUID, auto-generated), `skillName` (string, the skill identifier), `source` (enum: `native` | `file_read`), `toolName` (string, the Claude Code tool: `Skill`, `Read`, `Edit`, `Write`), `filePath` (string | null, the file path for file read events), `timestamp` (DateTime, from the OTLP event's `timeUnixNano`), `sessionId` (string, from OTLP `session.id`), `idempotencyKey` (string, composite of `traceId` + `spanId` + `timeUnixNano`, unique constraint).

- **UsageSummary**: A read model (not persisted — computed from `SkillInvocation` at query time) representing aggregate statistics: `totalInvocations` (number), `nativeInvocations` (number), `fileReadInvocations` (number), `perSkillCounts` (map of skill name → count), `recentInvocations` (list of latest `SkillInvocation` records).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The OTLP endpoint processes a batch of 50 log records (10 skill-relevant, 40 non-skill) in under 100ms.

- **SC-002**: The same skill event sent twice (identical traceId + spanId + timeUnixNano) creates exactly one `SkillInvocation` record.

- **SC-003**: A user who has never seen the setup instructions can configure Claude Code in under 2 minutes by following the on-page instructions alone.

- **SC-004**: The metrics page renders in under 500ms with up to 10,000 stored invocations.

- **SC-005**: When a skill is loaded natively in Claude Code (via `/skill` or automatic context injection), the invocation appears in the Skillbase metrics page within 30 seconds (accounting for OTel export interval and page reload).

- **SC-006**: Claude Code continues functioning normally when the Skillbase OTLP endpoint is unreachable (telemetry export failure is non-blocking per the OTel spec).

## Assumptions

- Claude Code's OTLP implementation is stable and follows the OTLP `http/json` protocol specification as documented at https://code.claude.com/docs/en/monitoring-usage.
- The default OTel log export interval (5 seconds) means events arrive within 5 seconds of occurrence.
- Claude Code's `OTEL_LOG_TOOL_DETAILS=1` setting enables the `skill_name` and `file_path` attributes on tool events — without it, skill identification is impossible.
- The OTLP endpoint receives log records as JSON `ExportLogsServiceRequest` objects — Skillbase parses these using `JSON.parse()` with no additional dependencies needed.
- The user runs both Claude Code and Skillbase on the same machine (localhost). Remote setups are out of scope for v1.
- Skillbase runs on its default port (4321) — the setup instructions use this port. Users on non-default ports adjust the URL accordingly (the page derives the URL dynamically from the request).
- OTLP log records include standard attributes (`session.id`, `prompt.id`, etc.) as documented. Skillbase extracts what it needs and ignores the rest.
- Existing indexed repositories in Skillbase are not a prerequisite — skill invocations are tracked by name regardless of whether the skill is in the catalog.
- OTLP log records arrive as JSON `ExportLogsServiceRequest` payloads parsed via `JSON.parse()`. No additional npm dependencies are required for ingestion.
