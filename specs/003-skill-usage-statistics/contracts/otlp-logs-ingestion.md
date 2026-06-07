# Contract: OTLP Logs Ingestion Endpoint

**Feature**: 003-skill-usage-statistics | **Date**: 2026-06-07

## Endpoint

```
POST /api/telemetry/v1/logs
Content-Type: application/json
```

## Purpose

Receives skill usage events from Claude Code's built-in OpenTelemetry instrumentation. Events are filtered server-side — only skill-relevant tool events are persisted.

## Request

### Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

### Body: OTLP `ExportLogsServiceRequest`

```json
{
  "resourceLogs": [
    {
      "resource": {
        "attributes": [
          { "key": "service.name", "value": { "stringValue": "claude-code" } },
          { "key": "session.id", "value": { "stringValue": "uuid-here" } }
        ]
      },
      "scopeLogs": [
        {
          "scope": {
            "name": "claude_code",
            "version": "1.0.0"
          },
          "logRecords": [
            {
              "timeUnixNano": "1717600000000000000",
              "severityNumber": 9,
              "severityText": "INFO",
              "body": { "stringValue": "claude_code.tool" },
              "attributes": [
                { "key": "tool_name", "value": { "stringValue": "Skill" } },
                { "key": "skill_name", "value": { "stringValue": "frontend-design" } },
                { "key": "session.id", "value": { "stringValue": "abc-123" } }
              ],
              "traceId": "0af7651916cd43dd8448eb211c80319c",
              "spanId": "b7ad6b7169203331"
            }
          ]
        }
      ]
    }
  ]
}
```

### Filtering Rules

A log record is **stored** if:

1. `body.stringValue === "claude_code.tool"` AND `tool_name === "Skill"` (native loading), OR
2. `body.stringValue === "claude_code.tool"` AND `tool_name` is `"Read"` / `"Edit"` / `"Write"` AND `file_path` matches a skill file pattern (contains `SKILL.md` or path inside `.claude/skills/` or `.opencode/skills/`)

All other log records are **discarded** without storage.

### Skill-Relevant Attributes Extracted

| OTLP Attribute | Field | Required For |
|---------------|-------|-------------|
| `tool_name` | toolName | All events |
| `skill_name` | skillName | Native Skill events |
| `file_path` | filePath + skillName (derived) | File read events |
| `session.id` | sessionId | All events |
| `traceId` + `spanId` + `timeUnixNano` | idempotencyKey | All events |

## Response

### Success (200)

```json
{
  "partialSuccess": {}
}
```

Returned even if some individual log records were rejected (malformed attributes, not skill-relevant). Standard OTLP response format.

### Bad Request (400)

```json
{
  "error": "Invalid OTLP payload: missing resourceLogs array"
}
```

Returned when the entire request body cannot be parsed as a valid `ExportLogsServiceRequest`.

### Service Unavailable (503)

Empty body. Returned when PostgreSQL is unreachable — signals Claude Code to retry.

## Idempotency

Events are deduplicated by `idempotencyKey = traceId + spanId + timeUnixNano`. If Claude Code retries the same batch, duplicate records are silently skipped (UNIQUE constraint + `ON CONFLICT DO NOTHING`).

## Claude Code Configuration

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4321/api/telemetry/v1/logs
export OTEL_LOG_TOOL_DETAILS=1
```

Or in `~/.claude/settings.json`:
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
