# Tasks: Skillbase Project Scaffold

**Input**: Design documents from `/specs/001-project-scaffold/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests for shared package (Zod schema validation), integration tests for core app repositories (Testcontainers PostgreSQL), basic render tests for both apps.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo structure, root configuration, and install all dependencies

- [X] T001 Create monorepo directory skeleton: `apps/core/src/lib/catalog/domain/`, `apps/core/src/lib/catalog/application/`, `apps/core/src/lib/catalog/infrastructure/`, `apps/core/src/lib/shared/infrastructure/persistence/`, `apps/core/src/pages/`, `apps/core/src/components/`, `apps/core/migrations/sqls/`, `apps/core/tests/helpers/`, `apps/landing-page/src/components/`, `apps/landing-page/src/layouts/`, `apps/landing-page/src/pages/`, `packages/shared/src/`, `scripts/`, `.ci/`, `.github/`
- [X] T002 [P] Create `packages/shared/package.json` with name `@skillbase/shared`, exports config, and dependencies (zod, typescript, vitest) per `contracts/shared-package.md`
- [X] T003 [P] Create `apps/core/package.json` with name `@skillbase/core`, dependencies (astro, @astrojs/node, tailwindcss, pg, db-migrate, db-migrate-pg, dotenv, @skillbase/shared via workspace:*, solid-js, @fontsource/jetbrains-mono, @fontsource-variable/space-grotesk, @fontsource-variable/geist, lucide), and devDependencies (vitest, @testcontainers/postgresql, testcontainers, ts-node) per `plan.md`
- [X] T004 [P] Create `apps/landing-page/package.json` with name `@skillbase/landing-page`, dependencies (astro, tailwindcss, @fontsource/jetbrains-mono, @fontsource-variable/space-grotesk, @fontsource-variable/geist, lucide, @skillbase/shared via workspace:*), and devDependencies (vitest) per `plan.md`
- [X] T005[P] Create `packages/shared/tsconfig.json` with strict mode, target ESNext, module ESNext, moduleResolution bundler
- [X] T006[P] Create `apps/core/tsconfig.json` with strict mode, extends root, Astro types reference, path aliases for `@lib/*`
- [X] T007[P] Create `apps/landing-page/tsconfig.json` with strict mode, extends root, Astro types reference
- [X] T008 Create root `biome.json` with formatting (indentStyle: space, indentWidth: 2, lineWidth: 100, singleQuote: true, trailingCommas: es5, semicolons: always), linting (noUnusedImports, noUnusedVariables, noExplicitAny, useImportType all error), and test file override (noUnusedFunctionParameters: off) per `research.md` R2
- [X] T009 Add `packages: ["apps/*", "packages/*"]` to existing `pnpm-workspace.yaml`
- [X] T010 Add workspace check scripts to root `package.json`: `"verify": "node --import tsx scripts/verify.ts"`, `"format": "biome format --write ."`, `"lint": "biome lint ."`, `"check": "biome check ."`
- [X] T011[P] Create `packages/shared/vitest.config.ts` with basic configuration
- [X] T012[P] Create `apps/core/vitest.config.ts` with Astro alias for `astro:env/server` → `tests/astro-env-server-mock.cjs`, testEnvironment: node
- [X] T013[P] Create `apps/landing-page/vitest.config.ts` with basic configuration
- [X] T014[P] Create `apps/core/astro.config.mjs` with @astrojs/node SSR adapter, tailwind integration, server port 4321
- [X] T015[P] Create `apps/landing-page/astro.config.mjs` with tailwind integration, server port 4322
- [X] T016[P] Create `.github/FUNDING.yml` with `github: [sesigl]` per `research.md` R8
- [X] T017[P] Create `LICENSE` (MIT) at repo root
- [X] T018Run `pnpm install` from repo root to install all monorepo dependencies

**Checkpoint**: All directories exist, package.json files defined, configs in place, dependencies installed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared package types/schemas and core app database infrastructure that MUST be complete before user story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T019[P] Implement `Skill` type and `SkillSchema` (Zod) in `packages/shared/src/skill.ts` — exact shape per `contracts/shared-package.md` (name, author, description, version regex, tags min 1, providers min 1, license, optional homepage URL)
- [X] T020[P] Implement `SkillFormat` type in `packages/shared/src/skill-format.ts` — interface with name, manifest, files per `contracts/shared-package.md`
- [X] T021[P] Create `packages/shared/src/skill.test.ts` — 5 test cases from `contracts/shared-package.md` (valid skill, empty name, invalid version, empty tags, optional homepage)
- [X] T022[P] Create `packages/shared/src/skill-format.test.ts` — test SkillFormat interface structure
- [X] T023[P] Create `packages/shared/src/index.ts` barrier export re-exporting from `skill.ts` and `skill-format.ts`
- [X] T024[P] Create `apps/core/migrations/database.json` with `{ "dev": { "driver": "pg", "ENV": "DATABASE_URL", "ssl": true } }`
- [X] T025[P] Create `apps/core/migrations/.db-migraterc` with `{ "sql-file": true, "migrations-dir": "migrations" }`
- [X] T026Create `apps/core/src/lib/shared/database.ts` — pg Pool singleton using `DATABASE_URL` from `astro:env/server`, SSL `verify-full`, `channel_binding=require` per `research.md` R3
- [X] T027[P] Create `apps/core/src/lib/shared/infrastructure/persistence/DatabaseConnection.ts` — wraps Pool with `getConnection()`, `beginTransaction(callback)`, `releaseConnection()` lifecycle methods
- [X] T028[P] Create `apps/core/src/lib/shared/infrastructure/persistence/TransactionContext.ts` — AsyncLocalStorage-based transaction context with `getCurrentTransaction()` and `runInNewTransaction<R>(fn)`
- [X] T029Create `apps/core/src/lib/shared/infrastructure/persistence/Transactional.ts` — `@Transactional` decorator that wraps class method execution in `runInNewTransaction` (depends on T028)
- [X] T030[P] Create `apps/core/tests/astro-env-server-mock.cjs` — mock module exporting `getEnv` with a test `DATABASE_URL` that gets overridden per vitest config
- [X] T031[P] Create `apps/core/tests/helpers/testDatabase.ts` — Testcontainers PostgreSQL lifecycle (start container in globalSetup, set `DATABASE_URL`, provide `withTestTransaction` helper that mirrors `runInNewTransaction`) per `research.md` R7
- [X] T032Add devDependency `tsx` to root `package.json` for running verify scripts and run `pnpm install`

**Checkpoint**: `@skillbase/shared` compiles and tests pass. Database infrastructure in place. Ready for user stories.

---

## Phase 3: User Story 2 — Explore Skills in the Core Application (Priority: P1) 🎯 MVP

**Goal**: Publicly accessible UI that lists skills from PostgreSQL and supports server-side text search via URL query parameter

**Independent Test**: Start core app dev server, run migrations, seed data, navigate to index page, see 5 seed skills listed. Type "git" and submit — page reloads showing only matching skills.

### Tests for User Story 2

- [X] T033[P] [US2] Write integration test for `PostgresSkillRepository.findAll()` in `apps/core/tests/catalog/PostgresSkillRepository.test.ts` — uses Testcontainers, applies migrations, then tests that `findAll()` returns all seeded skills
- [X] T034[P] [US2] Write integration test for `PostgresSkillRepository.search()` in `apps/core/tests/catalog/PostgresSkillRepository.test.ts` — tests partial name match, description match, no match returns empty array
- [X] T035[P] [US2] Write unit test for `CatalogUseCases.browseSkills()` in `apps/core/tests/catalog/CatalogUseCases.test.ts` — mocks SkillRepository, verifies delegation
- [X] T036[P] [US2] Write unit test for `CatalogUseCases.searchSkills()` in `apps/core/tests/catalog/CatalogUseCases.test.ts` — mocks SkillRepository, verifies query passthrough

### Implementation for User Story 2

- [X] T037[US2] Implement `SkillRepository` interface in `apps/core/src/lib/catalog/domain/SkillRepository.ts` — `findAll(): Promise<Skill[]>` and `search(query: string): Promise<Skill[]>` per `contracts/shared-package.md`
- [X] T038[US2] Implement `PostgresSkillRepository` in `apps/core/src/lib/catalog/infrastructure/PostgresSkillRepository.ts` — implements `SkillRepository` using `DatabaseConnection` to query `skills` table; `findAll()` = `SELECT * FROM skills ORDER BY name`, `search()` = `SELECT * FROM skills WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY name` (depends on T037, T027)
- [X] T039[US2] Implement `CatalogUseCases` in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — class with `@Transactional()` on `browseSkills()` and `searchSkills(query)` per `contracts/shared-package.md` (depends on T037, T029)
- [X] T040[US2] Implement DI container in `apps/core/src/lib/catalog/infrastructure/di.ts` — factory `createCatalogUseCases(): CatalogUseCases` that constructs `PostgresSkillRepository` with `DatabaseConnection` and returns `CatalogUseCases` (depends on T038, T039)
- [X] T041[P] [US2] Create migration `apps/core/migrations/sqls/20260604000000-create-skills-up.sql` — DDL for `skills` table per `data-model.md` (id UUID PK, name, author, description, version, tags TEXT[], providers TEXT[], license, homepage, created_at, updated_at, UNIQUE(name, author), GIN indexes)
- [X] T042[P] [US2] Create migration `apps/core/migrations/sqls/20260604000000-create-skills-down.sql` — `DROP TABLE IF EXISTS skills CASCADE`
- [X] T043[P] [US2] Create migration `apps/core/migrations/sqls/20260604000001-seed-skills-up.sql` — INSERT 5 seed skills per `data-model.md` (Git Conventions, Frontend Design, PDF Toolkit, Clean Code Reviewer, Security Review)
- [X] T044[P] [US2] Create migration `apps/core/migrations/sqls/20260604000001-seed-skills-down.sql` — `DELETE FROM skills` or `TRUNCATE skills`
- [X] T045[P] [US2] Create JS migration wrapper `apps/core/migrations/20260604000000-create-skills.js` — reads and executes up.sql / down.sql via db-migrate's `db.runSql`
- [X] T046[P] [US2] Create JS migration wrapper `apps/core/migrations/20260604000001-seed-skills.js` — reads and executes up.sql / down.sql via db-migrate's `db.runSql`
- [X] T047[US2] Create `apps/core/src/pages/index.astro` — Astro SSR page that: imports `createCatalogUseCases`, reads `search` query param from `Astro.url`, calls `searchSkills` or `browseSkills`, passes results to UI component. Empty state when no results.
- [X] T048[US2] Create `apps/core/src/components/SearchBar.astro` — form with text input (GET /?search=...), submit button, monospace placeholder
- [X] T049[P] [US2] Create `apps/core/src/components/SkillCard.astro` — displays skill name, `name@author` in monospace, description, tags as pills, version badge, provider badges
- [X] T050[P] [US2] Create `apps/core/src/components/SkillList.astro` — iterates skills array rendering SkillCard for each
- [X] T051[US2] Create `apps/core/src/components/EmptyState.astro` — "No skills found" message with suggestion to broaden search
- [X] T052[US2] Update `apps/core/src/pages/index.astro` to compose SearchBar + SkillList + EmptyState with conditional rendering
- [X] T053[US2] Create `apps/core/.dependency-cruiser.cjs` — enforce `contracts/shared-package.md` architecture rules: pages cannot import infrastructure, only TransactionContext/Transactional can import database.ts, domain cannot import infrastructure
- [X] T054[US2] Add per-package scripts to `apps/core/package.json`: `"dev": "astro dev"`, `"build": "astro check && astro build"`, `"preview": "astro preview"`, `"test": "vitest run"`, `"test:watch": "vitest"`, `"migrate": "dotenv -- db-migrate up"`, `"migrate:down": "dotenv -- db-migrate down"`, `"migrate:create": "dotenv -- db-migrate create migration-name -- --sql-file"`, `"verify": "biome check && tsc --noEmit && astro check && dependency-cruiser --config .dependency-cruiser.cjs src && vitest run"`
- [X] T055[US2] Add tailwind.config.mjs to `apps/core/` importing design system tokens from `.opencode/skills/design-system/colors_and_type.css`, configuring Space Grotesk/Geist/JetBrains Mono font families per `frontend-design` skill

**Checkpoint**: Core app renders skill list from PostgreSQL, search filters work server-side, empty state handles no results. Integration tests pass with Testcontainers.

---

## Phase 4: User Story 1 — Browse the Landing Page (Priority: P1)

**Goal**: Dark developer aesthetic landing page (en.dev-style) with hero section, feature highlights, GitHub Sponsors section, and footer

**Independent Test**: Start landing page dev server, navigate to index page, verify all sections render correctly with design system compliance, viewport 320px–1920px.

### Implementation for User Story 1

- [X] T056[P] [US1] Import design system CSS in `apps/landing-page/src/styles/` — copy `.opencode/skills/design-system/colors_and_type.css` and create `apps/landing-page/src/styles/global.css` with Tailwind directives and design token usage
- [X] T057[US1] Create `apps/landing-page/src/layouts/BaseLayout.astro` — dark theme base layout with: Space Grotesk/Geist/JetBrains Mono font loading, global CSS import, semantic HTML structure, dark background (`--paper`), light text (`--ink`), `<meta>` viewport for responsive
- [X] T058[P] [US1] Create `apps/landing-page/src/components/Logo.astro` — lowercase "skillbase" wordmark in Space Grotesk, optionally with electric lime accent element per `frontend-design` skill
- [X] T059[P] [US1] Create `apps/landing-page/src/components/Hero.astro` — hero section with: headline communicating "central hub for AI coding skills", subheadline, "View on GitHub" primary CTA (electric lime, links to repo), supporting code/terminal visual element, dot/line grid background per `frontend-design` skill
- [X] T060[P] [US1] Create `apps/landing-page/src/components/Features.astro` — feature highlights section: 3–4 feature blocks with Lucide icons, headings, descriptions, modular blocky layout with 1px hairline borders per `frontend-design` skill
- [X] T061[P] [US1] Create `apps/landing-page/src/components/SponsorsSection.astro` — GitHub Sponsors section: heading, explanation, link to GitHub Sponsors profile, tier display placeholder per `frontend-design` skill
- [X] T062[P] [US1] Create `apps/landing-page/src/components/Footer.astro` — footer with: GitHub link, license (MIT), GitHub Sponsors link, built-with text, all in JetBrains Mono/Geist per `frontend-design` skill
- [X] T063[US1] Create `apps/landing-page/src/pages/index.astro` — compose all sections: Logo/Nav, Hero, Features, SponsorsSection, Footer, wrapped in BaseLayout
- [X] T064[US1] Create `apps/landing-page/src/components/Nav.astro` — minimal navigation bar with Logo and "View on GitHub" link per `frontend-design` skill
- [X] T065[US1] Add tailwind.config.mjs to `apps/landing-page/` importing design system tokens, configuring font families per `frontend-design` skill
- [X] T066[US1] Add per-package scripts to `apps/landing-page/package.json`: `"dev": "astro dev"`, `"build": "astro check && astro build"`, `"preview": "astro preview"`, `"test": "vitest run"`, `"verify": "biome check && tsc --noEmit && astro check && vitest run"`
- [X] T067[P] [US1] Create `apps/landing-page/src/pages/index.test.ts` — basic render test verifying index page renders without errors
- [X] T068[P] [US1] Import `.opencode/skills/design-system/ui_kits/landing-page/` reference components as design guidance for all landing page components

**Checkpoint**: Landing page renders all sections on desktop and mobile, design system compliant, dark developer aesthetic.

---

## Phase 5: User Story 4 — Run Deterministic Checks (Priority: P2)

**Purpose**: Single `pnpm run verify` command covering all quality gates across the monorepo

**Independent Test**: Run `pnpm run verify` — all checks pass. Introduce a type error — verify fails with non-zero exit. Introduce a formatting error — verify fails.

### Implementation for User Story 4

- [X] T069[US4] Create `scripts/verify.ts` — orchestrator that spawns per-package verify scripts with `availableParallelism()` concurrency, collects exit codes, prints summary, exits non-zero if any failed per `research.md` R9
- [X] T070[US4] Update `apps/core/package.json` `verify` script to include all checks: `"biome check && tsc --noEmit && astro check && dependency-cruiser --config .dependency-cruiser.cjs src && vitest run"`
- [X] T071[US4] Update `apps/landing-page/package.json` `verify` script to include all checks: `"biome check && tsc --noEmit && astro check && vitest run"`
- [X] T072[US4] Update `packages/shared/package.json` with `verify` script: `"biome check && tsc --noEmit && vitest run"`
- [X] T073[US4] Create `.ci/verify.yml` — CI pipeline: checkout, setup pnpm/node, `pnpm install`, `pnpm run verify`
- [X] T074[US4] Add `scripts/biome-format.sh` — shell wrapper for `biome format --write .` referenced by `opencode.json`

**Checkpoint**: `pnpm run verify` passes with zero errors. CI pipeline file ready. Individual package verify scripts work.

---

## Phase 6: User Story 3 — Understand the Monorepo Structure (Priority: P2)

**Purpose**: Self-documenting repository with comprehensive README, CONTRIBUTING, and up-to-date documentation

**Independent Test**: Clone repo, list top-level tree, verify all promised directories/files exist. Follow README Quick Start — project runs locally.

### Implementation for User Story 3

- [X] T075[US3] Create/update `README.md` at repo root — project description, badges, "Quick Start" section matching `quickstart.md`, project layout table, link to CONTRIBUTING.md
- [X] T076[US3] Create `CONTRIBUTING.md` at repo root — how to contribute, PR process, code standards (link to AGENTS.md), Conventional Commits, `pnpm run verify` requirement per `spec.md` FR-010
- [X] T077[US3] Verify `CONTEXT.md` glossary is up to date — ensure all 6 canonical terms are present and accurate
- [X] T078[US3] Verify `AGENTS.md` references all existing directories, skills, and conventions — check no stale paths or missing sections

**Checkpoint**: Repository is self-documenting. README Quick Start works end-to-end. All documentation cross-references are valid.

---

## Phase 7: User Story 5 — AI-Native Development Experience (Priority: P3)

**Purpose**: Project-local skills and AI development infrastructure are complete and loadable

**Independent Test**: Verify `.opencode/skills/frontend-design/SKILL.md` loads correctly. Verify `.specify/templates/` has all required templates.

### Implementation for User Story 5

- [X] T079[P] [US5] Verify `.opencode/skills/frontend-design/SKILL.md` exists with design system rules, brand non-negotiables, and component guidance (created during spec phase)
- [X] T080[P] [US5] Verify `.opencode/skills/git-conventions/SKILL.md` exists with Conventional Commits enforcement instructions
- [X] T081[P] [US5] Verify `.opencode/skills/repository-setup/SKILL.md` exists with local dev setup instructions
- [X] T082[US5] Verify `.specify/templates/` contains all required templates (spec-template.md, plan-template.md, tasks-template.md) and they match Spec Kit canonical format

**Checkpoint**: All project-local skills loadable. Spec Kit templates complete. AI agent can navigate and follow all conventions.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and verification of all success criteria

- [X] T083Run `pnpm run verify` from repo root and fix all errors/warnings until zero exit code
- [X] T084Validate `quickstart.md` instructions end-to-end: clone, install, migrate, seed, start both apps, verify outputs
- [X] T085[P] Verify `.gitignore` covers all generated files: `dist/`, `.astro/`, `coverage/`, `.env*`, migration artifacts
- [X] T086[P] Responsive design audit: verify landing page renders correctly at 320px, 768px, 1024px, 1920px viewports (SC-005)
- [X] T087[P] Verify core app search performance: skill list renders and search filters in under 1s (SC-006)
- [X] T088 Fix any remaining Biome lint/format warnings across all packages
- [X] T089 Final `pnpm run verify` — confirm zero exit code with all checks passing (SC-002)
- [X] T090 Verify all 22 functional requirements from spec.md are satisfied

**Checkpoint**: All success criteria met. Project scaffold complete. Ready for spec sign-off.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 2 (Phase 3 - Core App)**: Depends on Foundational (Phase 2) completion
- **User Story 1 (Phase 4 - Landing Page)**: Depends on Foundational (Phase 2) completion — independent of US2
- **User Story 4 (Phase 5 - Verify)**: Depends on both US1 and US2 (both apps must exist)
- **User Story 3 (Phase 6 - Docs)**: Depends on Phase 5 (verify must pass before documenting verification)
- **User Story 5 (Phase 7 - AI-Native)**: Depends on earlier phases for context verification
- **Polish (Phase 8)**: Depends on all prior phases

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational — independent of US1
- **User Story 1 (P1)**: Can start after Foundational — independent of US2
- **User Story 4 (P2)**: Depends on US1 and US2 (needs both apps' code)
- **User Story 3 (P2)**: Depends on US4 (docs must reference working verify)
- **User Story 5 (P3)**: Self-contained validation — can run any time after Phase 1

### Within Each User Story

- Tests (where present) MUST be written and FAIL before implementation
- Domain interfaces before infrastructure implementations
- Infrastructure before application (use cases)
- Application before pages/endpoints
- Components before page composition
- Page composition before integration testing

### Parallel Opportunities

- T002–T007 (all package.json and tsconfig files) can run in parallel
- T011–T015 (all vitest/astro configs) can run in parallel  
- T019–T025 (shared types, tests, migration configs) can run in parallel within Phase 2
- T027, T028 can run in parallel (independent infrastructure files)
- T041–T046 (all migration files) can run in parallel
- Phase 3 (US2) and Phase 4 (US1) can run in parallel after Foundational
- T079–T081 (skill file verifications) can run in parallel within Phase 7

---

## Parallel Example: Phase 2 Foundational

```bash
# Parallel batch 1 — shared package + migration configs:
Task: "Implement Skill type and SkillSchema in packages/shared/src/skill.ts"
Task: "Implement SkillFormat type in packages/shared/src/skill-format.ts"
Task: "Create skill.test.ts in packages/shared/src/skill.test.ts"
Task: "Create skill-format.test.ts in packages/shared/src/skill-format.test.ts"
Task: "Create barrier export in packages/shared/src/index.ts"
Task: "Create database.json in apps/core/migrations/database.json"
Task: "Create .db-migraterc in apps/core/migrations/.db-migraterc"

# Parallel batch 2 — infrastructure files:
Task: "Create DatabaseConnection.ts"
Task: "Create TransactionContext.ts"
Task: "Create testDatabase.ts helper"
Task: "Create astro-env-server-mock.cjs"
```

---

## Parallel Example: User Story 2 (Core App)

```bash
# Parallel batch 1 — all migration SQL files:
Task: "Create create-skills-up.sql"
Task: "Create create-skills-down.sql"
Task: "Create seed-skills-up.sql"
Task: "Create seed-skills-down.sql"
Task: "Create JS migration wrappers"

# Parallel batch 2 — UI components:
Task: "Create SearchBar.astro"
Task: "Create SkillCard.astro"
Task: "Create SkillList.astro"
Task: "Create EmptyState.astro"
Task: "Create .dependency-cruiser.cjs"
Task: "Create tailwind.config.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 2 Only — Core App with Skills)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 2 (Core App)
4. **STOP and VALIDATE**: Start core app, run migrations, see skills with search
5. Deploy/demo as MVP

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add Core App (US2) → Browse + search skills → Demo as MVP
3. Add Landing Page (US1) → Public marketing site → Demo full presence
4. Add Verify Script (US4) → Quality gates → Demo CI-ready
5. Add Documentation (US3) → Contributor-friendly → Demo open-source ready
6. Validate AI-Native (US5) → AI-ready → Full spec complete

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (Core App — most complex)
   - Developer B: User Story 1 (Landing Page — independent, design-heavy)
3. Both merge → then US4 (verify), US3 (docs), US5 (AI-native) in sequence

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All frontend work MUST load `frontend-design` skill and cross-reference `.opencode/skills/design-system/`
- All DDD patterns follow the hexagonal architecture defined in plan.md
- `database.ts`, `TransactionContext`, `Transactional` follow established patterns — do not invent new patterns
