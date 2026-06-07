# Implementation Plan: Skill Usage Statistics

**Branch**: `003-skill-usage-statistics` | **Date**: 2026-06-07 | **Spec**: `specs/003-skill-usage-statistics/spec.md`

**Input**: Feature specification from `specs/003-skill-usage-statistics/spec.md`

## Summary

Add skill usage tracking to Skillbase by receiving OpenTelemetry log events from Claude Code via an OTLP HTTP endpoint, extracting skill-relevant events (native Skill tool loads + file reads of skill files), persisting them as `SkillInvocation` records in PostgreSQL, and displaying a metrics dashboard at `/metrics`. No custom hooks required — Claude Code's built-in OTel instrumentation provides the data when configured with 5 env vars.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)

**Primary Dependencies**: Astro 5.18 (SSR), pg (node-postgres), zod 4.4 (validation), db-migrate + db-migrate-pg (migrations). No new dependencies — OTLP ingestion uses `http/json` format parsed via native `JSON.parse()`.

**Storage**: PostgreSQL (existing `apps/core` database, `skill_invocations` table in public schema)

**Testing**: Vitest 4.1 + Testcontainers (PostgreSQL)

**Target Platform**: Node.js 25+, macOS/Linux server

**Project Type**: Web application (Astro SSR) — backend API route + SSR page

**Performance Goals**: OTLP endpoint processes 50-record batch in <100ms; metrics page renders <500ms with 10k invocations

**Constraints**: Zero-JS SSR pages (except copy button); idempotent event ingestion; single-user v1; localhost-only

**Scale/Scope**: Single-user localhost; 1-100 events/minute typical; up to 10k stored invocations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Open-Source First & Self-Hostable | ✅ PASS | No new proprietary dependencies. `@opentelemetry/otlp-transformer` and `@opentelemetry/api-logs` are Apache 2.0. PostgreSQL remains the only data store. Docker Compose unchanged. |
| II. Monorepo Discipline | ✅ PASS | New code in `apps/core/src/lib/statistics/` (new BC), no cross-app dependencies. Existing catalog BC unchanged. |
| III. AI-Native Development | ✅ PASS | Spec created via `/speckit.specify`, plan via `/speckit.plan`. Tests follow existing Vitest + Testcontainers pattern. |
| IV. TypeScript Everywhere | ✅ PASS | All new code in TypeScript strict mode. OTLP endpoint handler, use cases, repositories, tests — all `.ts` or `.astro` with TypeScript. |
| V. Git-Native Skill Source | ✅ PASS | No change. Statistics records invocations by skill name independently of catalog indexing. |
| VI. Usage Transparency | ✅ PASS | This feature IS the Usage Transparency implementation — opt-in via Claude Code OTel config, local-only, single-user v1. |
| VII. Deterministic Quality Gates | ✅ PASS | All new code passes `pnpm run verify` (biome format + lint + astro check + vitest). |
| VIII. DDD with Hexagonal Architecture | ✅ PASS | New `statistics` bounded context with `domain/`, `application/`, `infrastructure/` layers. Separate aggregate (`SkillInvocation`). No cross-BC foreign keys. |

**Gate result: PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-skill-usage-statistics/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── otlp-logs-ingestion.md
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/core/
├── migrations/
│   ├── 20260607000002-create-skill-invocations.js
│   └── sqls/
│       ├── 20260607000002-create-skill-invocations-up.sql
│       └── 20260607000002-create-skill-invocations-down.sql
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro          # MODIFIED: add top nav bar
│   ├── pages/
│   │   ├── index.astro               # UNCHANGED (catalog browser)
│   │   ├── metrics.astro             # NEW: metrics dashboard
│   │   └── api/
│   │       └── telemetry/
│   │           └── v1/
│   │               └── logs.ts       # NEW: OTLP logs ingestion endpoint
│   ├── lib/
│   │   └── statistics/               # NEW bounded context
│   │       ├── domain/
│   │       │   └── skill-invocation/
│   │       │       ├── SkillInvocation.ts          # Aggregate + schema
│   │       │       └── SkillInvocationRepository.ts # Repository interface
│   │       ├── application/
│   │       │   ├── AGENTS.md                        # Layer rules
│   │       │   └── StatisticsUseCases.ts            # Use cases
│   │       ├── interfaces/
│   │       │   └── OtlpLogsTranslator.ts            # OTLP anti-corruption adapter
│   │       └── infrastructure/
│   │           ├── di.ts                             # DI wiring
│   │           └── persistence/
│   │               └── PostgresSkillInvocationRepository.ts
│   └── components/
│       ├── Nav.astro                 # NEW: top navigation bar
│       └── TelemetrySetup.astro      # NEW: setup instructions panel
├── tests/
│   ├── helpers/
│   │   └── testDatabase.ts                         # Shared Testcontainers helper
│   └── lib/
│       └── statistics/
│           ├── application/
│           │   └── StatisticsUseCases.test.ts      # Use case tests
│           ├── domain/
│           │   └── skill-invocation/
│           │       └── SkillInvocation.test.ts     # Aggregate tests
│           └── interfaces/
│               └── OtlpLogsTranslator.test.ts      # OTLP adapter tests
└── package.json                      # UNCHANGED (no new deps needed)
```

**Structure Decision**: Single web application (Astro SSR) following existing DDD convention. New `statistics` bounded context mirrors the `catalog` BC structure. API route for OTLP lives in `src/pages/api/` per Astro convention (external endpoint consumed by non-Astro client). Tests mirror existing `apps/core/tests/` pattern.

## Complexity Tracking

> No violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
