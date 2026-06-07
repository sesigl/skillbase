# Tasks: Skill Usage Statistics

**Input**: Design documents from `specs/003-skill-usage-statistics/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/otlp-logs-ingestion.md, quickstart.md

**Tests**: Use case tests are MANDATORY for every use case method. Unit tests per task OPTIONAL — only for complex functions.

**Organization**: Tasks organized by user story. Each Task Group follows RED → GREEN.

## Format: `[ID] [P?] [USX] Description`

- **[P]**: Can run in parallel (different files, no dependencies within same group)
- **[USX]**: Which user story this task belongs to (US1, US2, US3). Setup/Foundational/Polish tasks omit this.
- Include exact file paths in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directory structure and migration.

- [x] T001 Create `apps/core/src/lib/statistics/` directory structure per plan.md (domain/skill-invocation/, application/, infrastructure/persistence/)
- [x] T002 [P] Create migration files: `apps/core/migrations/20260607000002-create-skill-invocations.js`, `apps/core/migrations/sqls/20260607000002-create-skill-invocations-up.sql`, `apps/core/migrations/sqls/20260607000002-create-skill-invocations-down.sql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, domain interfaces, and persistence infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T003 [P] Create `SkillInvocation` aggregate root + Zod schemas + `RecordSkillInvocationInput` command type in `apps/core/src/lib/statistics/domain/skill-invocation/SkillInvocation.ts`
- [x] T004 [P] Create `SkillInvocationRepository` interface with aggregate-based `insert()` and `getUsageSummary()` methods in `apps/core/src/lib/statistics/domain/skill-invocation/SkillInvocationRepository.ts`
- [x] T005 Create `PostgresSkillInvocationRepository` implementing `insert()` with idempotency (`ON CONFLICT DO NOTHING`) in `apps/core/src/lib/statistics/infrastructure/persistence/PostgresSkillInvocationRepository.ts`
- [x] T006 [P] Reuse test database helper in `apps/core/tests/helpers/testDatabase.ts` (Testcontainers PostgreSQL, migrate up, pool cleanup)
- [x] T007 Create DI wiring factory `createStatisticsUseCases()` in `apps/core/src/lib/statistics/infrastructure/di.ts`

**Checkpoint**: Foundation ready — domain types, repository interface/impl, DI, and database table all exist. User stories can now be implemented.

---

## Phase 3: User Story 1 — Receive and Record Skill Usage Events (Priority: P1)

**Goal**: OTLP endpoint receives Claude Code events, filters skill-relevant ones, persists them idempotently.

**Independent Test**: Start Skillbase, configure Claude Code with OTLP env vars, trigger a Skill tool usage and a file read of SKILL.md, query database to verify both rows exist with correct source/skill_name.

### Task Group G1: recordInvocations()

**Use case**: `recordInvocations(invocations: readonly RecordSkillInvocationInput[]): Promise<{ inserted: number; skipped: number }>`

**Test** (RED — must fail first):
- [x] T008 [US1] Write use case test for `recordInvocations()` in `apps/core/tests/lib/statistics/application/StatisticsUseCases.test.ts`
  - Cover: native Skill tool event → stored with `source="native"`, `skill_name` from attribute
  - Cover: file read of SKILL.md → stored with `source="file_read"`, `skill_name` derived from `file_path`
  - Cover: non-skill event (Bash tool) → skipped (not stored)
  - Cover: duplicate event (same traceId+spanId+timeUnixNano) → skipped (idempotency)
  - Cover: batch with mixed valid/invalid events → valid stored, invalid skipped independently

**Implementation** (make it green):
- [x] T009 [P] [US1] Implement `StatisticsUseCases.recordInvocations()` — create `SkillInvocation` aggregates and call repository in `apps/core/src/lib/statistics/application/StatisticsUseCases.ts`
- [x] T010 [P] [US1] Implement OTLP translation helpers (getAttribute, extractSkillNameFromPath, skill relevance filtering) in `apps/core/src/lib/statistics/interfaces/OtlpLogsTranslator.ts`
- [x] T011 [US1] Wire `StatisticsUseCases` + `PostgresSkillInvocationRepository` in `apps/core/src/lib/statistics/infrastructure/di.ts`

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/lib/statistics/application/StatisticsUseCases.test.ts`

---

### Task Group G2: OTLP API Route

**Interface**: `POST /api/telemetry/v1/logs` (external endpoint, non-Astro client)

**Test** (RED — must fail first):
- [x] T012 [US1] Write API route test in `apps/core/tests/lib/statistics/application/StatisticsUseCases.test.ts`
  - Add test for `recordInvocations()` with full OTLP `ExportLogsServiceRequest` shaped payload (matching contract), verifying filtering and persistence through the use case (no HTTP server needed — test at use case level since API route is a thin wrapper)

**Implementation** (make it green):
- [x] T013 [US1] Create Astro API route at `apps/core/src/pages/api/telemetry/v1/logs.ts`
  - Accept POST with `application/json` body
  - Parse `ExportLogsServiceRequest`, extract `logRecords[]`
  - Call `StatisticsUseCases.recordInvocations()`
  - Return 200 `{ partialSuccess: {} }` on success
  - Return 400 on malformed payload, 503 on DB unavailable (per FR-010)

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/lib/statistics/application/StatisticsUseCases.test.ts` (all tests pass)

**Checkpoint**: US1 complete — OTLP endpoint receives, filters, and persists skill invocations with idempotency.

---

## Phase 4: User Story 2 — View Metrics Dashboard (Priority: P2)

**Goal**: `/metrics` page shows summary cards, daily table, most-used skills, recent invocations. All server-rendered, zero-JS (except copy button).

**Independent Test**: Insert test `SkillInvocation` records into PostgreSQL, visit `/metrics`, verify counts, tables, and recent list are accurate.

### Task Group G3: getUsageSummary()

**Use case**: `getUsageSummary(): Promise<UsageSummary>`

**Test** (RED — must fail first):
- [x] T014 [US2] Write use case test for `getUsageSummary()` in `apps/core/tests/lib/statistics/application/StatisticsUseCases.test.ts`
  - Cover: multiple invocations across different skills/sources → correct totals, per-skill counts, daily grouping, recent list
  - Cover: zero invocations → all counts zero, empty arrays
  - Cover: invocations spanning multiple days → dailyCounts grouped correctly

**Implementation** (make it green):
- [x] T015 [P] [US2] Implement `SkillInvocationRepository.getUsageSummary()` SQL queries in `apps/core/src/lib/statistics/infrastructure/persistence/PostgresSkillInvocationRepository.ts` (total counts with FILTER, per-skill GROUP BY, daily GROUP BY, recent SELECT)
- [x] T016 [P] [US2] Define `UsageSummary` type in `apps/core/src/lib/statistics/application/StatisticsUseCases.ts`
- [x] T017 [US2] Implement `StatisticsUseCases.getUsageSummary()` delegating to repository in `apps/core/src/lib/statistics/application/StatisticsUseCases.ts`

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/lib/statistics/application/StatisticsUseCases.test.ts` (all use case tests pass)

---

### Task Group G4: Navigation

**Goal**: Top nav bar in `BaseLayout.astro` with Skills → `/` and Metrics → `/metrics` links.

**Implementation** (no use case test — UI component, tested via Astro page render):
- [x] T018 [US2] Create `Nav.astro` component in `apps/core/src/components/Nav.astro`
  - Dark theme (design tokens), "Skills" link active at `/`, "Metrics" link active at `/metrics`
  - Uses `Astro.url.pathname` for active state detection
  - Uses `font-display` for "skillbase" brand text, `font-mono` for nav links
- [x] T019 [US2] Modify `BaseLayout.astro` in `apps/core/src/layouts/BaseLayout.astro` to include `<Nav />` above `<slot />`
  - Import Nav component, place before slot in body

**Verify**: Manual — visit `/` and `/metrics`, verify nav renders and active states are correct.

---

### Task Group G5: Metrics Page

**Goal**: `/metrics` page with server-rendered dashboard.

**Implementation** (no use case test — Astro SSR page, tested via render test in existing pattern):
- [x] T020 [US2] Create `pages/metrics.astro` in `apps/core/src/pages/metrics.astro`
  - Import `BaseLayout`, call `createStatisticsUseCases().getUsageSummary()` server-side
  - Render summary cards (4 cards in grid: total invocations, skills count, native loads, file reads) using design system tokens
  - Render daily invocation table (last 30 days, date + count) — zero-JS server table
  - Render most-used skills table (top 10, skill name + count + last used) — zero-JS server table
  - Render recent invocations list (last 20, skill name + source badge + timestamp) — zero-JS server list
  - Render setup instructions panel (collapsible `<details>`, auto-expanded `open` when zero invocations) with env var code block and `settings.json` code block
- [x] T021 [P] [US2] Load frontend-design skill, verify colors/fonts/spacing against design system in `apps/core/src/styles/design-tokens.css`
- [ ] T022 [US2] Write basic page render test in `apps/core/tests/lib/statistics/interfaces/metrics-page.test.ts` (assert page renders 200, nav links present)

**Verify**:
- Run: `pnpm --filter @skillbase/core test -- tests/lib/statistics/` (all tests pass)
- Run: `pnpm run verify` from repo root (biome + lint + astro check)

**Checkpoint**: US2 complete — metrics dashboard renders with real data from the use case, responsive nav.

---

## Phase 5: User Story 3 — Setup Instructions (Priority: P3)

**Goal**: Setup instructions show exact, copyable env vars with the live endpoint URL derived from the running instance.

**Independent Test**: Visit `/metrics`, verify setup instructions are present with correct host:port in the endpoint URL.

### Task Group G6: Setup Panel Refinements

**Goal**: Copy button and live URL derivation for the setup panel on the metrics page.

**Implementation** (enhancements to `pages/metrics.astro` from G5):
- [x] T023 [US3] Add live URL derivation in `apps/core/src/pages/metrics.astro` — compute endpoint URL from `Astro.url.host` (falls back to `localhost:4321`)
- [x] T024 [US3] Add copy-to-clipboard button for env var block in `apps/core/src/components/TelemetrySetup.astro` — small `<script>` island with navigator.clipboard
- [x] T025 [US3] Verify both terminal env-vars format and `settings.json` format are displayed in `apps/core/src/pages/metrics.astro`

**Verify**:
- Visit `/metrics` with zero invocations → setup panel shows URL matching `http://<host>/api/telemetry/v1/logs`
- Click copy button → env var block copied to clipboard
- Visit `/metrics` with invocations → setup panel collapsed at bottom, expandable

**Checkpoint**: US3 complete — all three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of all artifacts.

- [x] T026 Run `pnpm run verify` from repo root (biome format + lint + astro check + vitest), fix all errors/warnings
- [x] T027 Validate quickstart.md — run through setup steps manually to confirm end-to-end flow
- [x] T028 Review all task groups: verify each RED test was confirmed failing before IMPL, each GREEN test passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational — independently testable (can seed DB directly)
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 (metrics page must exist) — adds copy button + live URL
- **Polish (Phase 6)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational. Can ship as MVP.
- **US2 (P2)**: Independent after Foundational. Uses its own test data (not US1's). Can be developed in parallel with US1.
- **US3 (P3)**: Depends on US2 (metrics page exists). Thinnest story.

### Within Each Task Group

- **RED**: Test written first, confirmed failing
- **IMPL**: Implementation in dependency order (entity → repository interface → repository impl → use case → DI)
- **[P] tasks** within same group can run in parallel
- **GREEN**: Verify test passes before next group

### Parallel Opportunities

| Group | Parallel Tasks |
|-------|---------------|
| Setup | T001 ∥ T002 |
| Foundational | T003 ∥ T004 ∥ T006; T005 depends on T004 |
| G1 | T009 ∥ T010; T011 depends on T009 |
| G3 | T015 ∥ T016; T017 depends on T015+T016 |
| G5 | T020 ∥ T021 |

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T007)
3. Phase 3: US1 — G1 + G2 (T008–T013)
4. **STOP and VALIDATE**: All US1 tests pass. Start Skillbase, configure Claude Code, verify events stored.
5. Run `pnpm run verify`

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → OTLP ingestion works → **MVP** (data pipeline functional)
3. Add US2 → Metrics dashboard renders → **Demo-ready** (user-facing value visible)
4. Add US3 → Copy button + live URL → **Production-ready** (full setup UX)
5. Polish → `pnpm run verify` passes → **Done**

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same group
- One Task Group at a time within each Phase. Verify GREEN before next group.
- Use case tests use ONLY `StatisticsUseCases` methods — never direct repository or DB access
- Unit tests per task are OPTIONAL — SkillInvocation is a Zod schema (no behavior), OTLP parsing is tested through use case
- Commit after each Task Group completes (RED → IMPL → GREEN)
- Stop at any checkpoint to verify independently
- Nav renders at `/` and `/metrics` — both pages share BaseLayout with Nav
- Design system cross-reference required for Nav.astro and metrics.astro (load `frontend-design` skill before writing UI files)
