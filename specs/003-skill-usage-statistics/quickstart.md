# Quickstart: Skill Usage Statistics

**Feature**: 003-skill-usage-statistics | **Date**: 2026-06-07

## Prerequisites

- Skillbase running at `http://localhost:4321` (via `pnpm run dev` in `apps/core/`)
- Claude Code installed (`claude` CLI)
- PostgreSQL running (via `docker compose up -d`)

## 1. Run the Migration

```bash
cd apps/core
pnpm run migrate up
```

This creates the `skill_invocations` table in PostgreSQL.

## 2. Configure Claude Code

Add these environment variables before starting `claude`:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4321/api/telemetry/v1/logs
export OTEL_LOG_TOOL_DETAILS=1
```

For persistent setup, add to `~/.claude/settings.json`:
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

## 3. Use Claude Code

Start `claude` and trigger skill usage:

- **Native skill loading**: Type `/skill-some-name` or let Claude auto-load a skill
- **File read**: Ask Claude to "read the SKILL.md file" or edit/write inside a skills directory

Events arrive at Skillbase within ~5 seconds (default OTel log export interval).

## 4. View Metrics

Visit `http://localhost:4321/metrics` in your browser.

- **With data**: See summary cards, daily table, most-used skills, recent invocations
- **Without data**: See setup instructions with the exact env vars to configure

## 5. Verify Data Flow

Query the database directly to confirm events are being stored:

```bash
docker compose exec db psql -U skillbase -d skillbase -c "SELECT * FROM skill_invocations ORDER BY timestamp DESC LIMIT 5;"
```

## Troubleshooting

| Symptom | Check |
|---------|-------|
| No data on /metrics | Did you set `OTEL_LOG_TOOL_DETAILS=1`? Without it, `skill_name` and `file_path` are not sent. |
| No data on /metrics | Is Skillbase running on port 4321? |
| No data on /metrics | Did you run `pnpm run migrate up`? |
| 400 errors in Claude Code logs | Check `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` URL matches Skillbase's address |
| 503 errors in Claude Code logs | PostgreSQL is not running — `docker compose up -d` |

## Development

```bash
# Run tests
pnpm run test

# Run full verification
pnpm run verify
```
