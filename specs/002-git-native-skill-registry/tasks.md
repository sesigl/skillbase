# Tasks: Git-Native Skill Registry

**Input**: Design documents from `/specs/002-git-native-skill-registry/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Use case tests are MANDATORY for every use case method defined in `contracts/`. Unit tests per task are OPTIONAL and only for complex functions.

**Organization**: Tasks are organized by user story. Within each story, Task Groups follow a RED → GREEN cycle.

## Format: `[ID] [P?] [USX] Description`

- **[P]**: Can run in parallel (different files, no dependencies within same group)
- **[USX]**: Which user story this task belongs to (e.g., US1, US2, US3). Setup/Foundational/Polish tasks omit this.
- Include exact file paths in descriptions.

## Task Group Lifecycle (RED → GREEN)

Every use case gets a Task Group:

1. **RED** — Write the use case test. Run it, confirm it fails.
2. **IMPL** — Implement the code that makes it pass.
3. **GREEN** — Run the test. It must pass before moving on.

Use case tests call the system ONLY through use case methods. They never touch repositories, databases, or internal infrastructure directly. If a test needs to set up data, add the necessary use case method — do not bypass to repositories.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Remove obsolete code, install new dependencies, create migration scaffold.

- [ ] T001 Remove old skill migration files: `apps/core/migrations/sqls/20260604000000-create-skills-up.sql`, `apps/core/migrations/sqls/20260604000000-create-skills-down.sql`, `apps/core/migrations/sqls/20260604000001-seed-skills-up.sql`, `apps/core/migrations/sqls/20260604000001-seed-skills-down.sql`, `apps/core/migrations/20260604000000-create-skills.js`, `apps/core/migrations/20260604000001-seed-skills.js`
- [ ] T002 Remove `apps/core/src/lib/catalog/infrastructure/persistence/PostgresSkillRepository.ts` and `apps/core/tests/catalog/PostgresSkillRepository.test.ts`
- [ ] T003 [P] Install `yaml` npm package in `apps/core` (`pnpm --filter @skillbase/core add yaml`)
- [ ] T004 [P] Create migration for `indexed_repositories` table: `apps/core/migrations/sqls/20260607000000-create-indexed-repos-up.sql` (CREATE TABLE with path TEXT PRIMARY KEY, indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_status VARCHAR(20) NOT NULL DEFAULT 'valid') and matching down migration, plus `apps/core/migrations/20260607000000-create-indexed-repos.js` migration script

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, interfaces, and infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Create Skill aggregate root with Zod frontmatter schema in `apps/core/src/lib/catalog/domain/skill/Skill.ts` — all fields per data-model.md (name, description, license, compatibility, allowedTools, whenToUse, argumentHint, arguments, disableModelInvocation, userInvocable, disallowedTools, model, effort, context, agent, hooks, paths, shell, metadata, tags, providers, content, assets, sourceRepository, sourcePath) with validation rules (name matches parent dir, 1-64 lowercase alphanumeric+hyphens, effort enum, shell enum, context enum)
- [ ] T006 [P] Update SkillRepository interface in `apps/core/src/lib/catalog/domain/skill/SkillRepository.ts` — keep `findAll()` and `search(query)` signatures, update return types to use new `Skill` type from T005
- [ ] T007 [P] Create IndexedRepository aggregate and RepositoryScanResult type in `apps/core/src/lib/catalog/domain/repository-registry/IndexedRepository.ts` per data-model.md (path: string, indexedAt: Date, lastStatus: 'valid'|'missing'|'invalid')
- [ ] T008 [P] Create RepositoryRegistry interface in `apps/core/src/lib/catalog/domain/repository-registry/RepositoryRegistry.ts` with methods: `register(path)`, `remove(path)`, `clearAll()`, `listAll()`, `findByPath(path)`
- [ ] T009 Implement PostgresRepositoryRegistry in `apps/core/src/lib/catalog/infrastructure/persistence/PostgresRepositoryRegistry.ts` — implements RepositoryRegistry, uses existing PostgreSQL connection, INSERT/UPDATE/DELETE/SELECT on `indexed_repositories` table
- [ ] T010 [P] Write Skill Zod schema unit tests in `apps/core/tests/lib/shared/skill.test.ts` — test valid frontmatter parsing, required field validation (name, description), optional field handling, enum validation (effort, shell, context), edge cases (empty SKILL.md, missing frontmatter, binary content, large files >1MB warning, name/directory mismatch)
- [ ] T011 [P] Write PostgresRepositoryRegistry integration test in `apps/core/tests/catalog/PostgresRepositoryRegistry.test.ts` — use Testcontainers PostgreSQL, test register/remove/clearAll/listAll/findByPath, test duplicate path handling (idempotent re-register), test empty state
- [ ] T012 Update DI wiring in `apps/core/src/lib/catalog/infrastructure/di.ts` — register PostgresRepositoryRegistry singleton, export factory function

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Index a Local Claude Code Repository (Priority: P1)

**Goal**: Users can index a local git repository path, validate it contains Claude Code skills, parse all SKILL.md files with full spec compliance, and persist the repository reference. Every validation failure is reported clearly.

**Independent Test**: Create a temporary git repository with a `.claude/skills/` directory containing valid `SKILL.md` files, call `indexRepository()`, and verify the returned `RepositoryScanResult` contains correctly parsed skills. Delete the temp repo and verify the path is no longer listed.

### Task Group G1: indexRepository(path)

**Use case**: `indexRepository(path: string): Promise<RepositoryScanResult>` — validates path, scans for skills, persists repo reference, reports all errors

**Test** (RED — must fail first):
- [ ] T013 [US1] Write use case test for `indexRepository()` in `apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts` — cover: valid repo with skills, path does not exist, path not a git repo, no .claude/skills/ directory, invalid SKILL.md files with all errors collected, re-indexing same path (idempotent update), mixed valid/invalid skills in same repo

**Implementation** (make it green):
- [ ] T014 [P] [US1] Implement `findGitRoot(path)` helper — walks up from given path checking for `.git` entry (file or directory) using `fs.statSync`, returns git root path or null
- [ ] T015 [P] [US1] Implement `parseFrontmatter(content)` helper — extracts YAML block between `---` markers, parses with `yaml.parse()`, returns `{ frontmatter: Record<string, unknown>, body: string }`
- [ ] T016 [US1] Implement FilesystemSkillRepository in `apps/core/src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository.ts` — implements SkillRepository, discovers `.claude/skills/*/SKILL.md` files synchronously, parses frontmatter with T015 helper, validates with Skill Zod schema from T005, extracts assets from markdown body, derives tags and providers per research.md, collects ALL validation errors per FR-004, handles edge cases: symlinked skill dirs, permission errors (skip with error), non-UTF8 content (skip with error), empty SKILL.md, missing SKILL.md in directory (warn), nested .claude/skills/ (only scan root), large files (warn >1MB)
- [ ] T017 [US1] Implement `indexRepository(path)` method in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — validates path sequentially (exists → git repo → has .claude/skills/ → has SKILL.md files), delegates to FilesystemSkillRepository for scanning, persists via PostgresRepositoryRegistry, returns RepositoryScanResult with all errors/warnings/skills, handles re-indexing (update indexed_at, detect delta)
- [ ] T018 [US1] Write FilesystemSkillRepository integration tests in `apps/core/tests/catalog/FilesystemSkillRepository.test.ts` — use `fs.mkdtempSync` + `git init` for fixture repos, test: valid skills, skills with all Claude Code extension fields, skills with metadata.tags/providers, skills with hooks/context/agent/effort, directory without SKILL.md (ignored + warning), invalid frontmatter (all errors collected), permission error simulation, symlink handling, large file warning, name/directory mismatch validation, tags derivation fallback, providers inference fallback
- [ ] T019 [US1] Update DI wiring in `apps/core/src/lib/catalog/infrastructure/di.ts` — register FilesystemSkillRepository, wire into CatalogUseCases constructor

**Verify** (GREEN):
- [ ] Run `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/` and `pnpm --filter @skillbase/core test -- tests/catalog/FilesystemSkillRepository.test.ts`

**Checkpoint**: User Story 1 is fully functional — users can index repositories with full validation and error reporting.

---

## Phase 4: User Story 2 — Browse and Search Indexed Skills (Priority: P2)

**Goal**: Users can browse all skills from indexed repositories and search across them by name, description, tags, and providers. When no repos are indexed or all repos are missing, users see appropriate guidance.

**Independent Test**: Index two different git repositories with different skills, call `browseSkills()` to verify combined results from both, call `searchSkills()` with a tag/term spanning both repos and verify cross-repo results.

### Task Group G2: browseSkills()

**Use case**: `browseSkills(): Promise<Skill[]>` — returns all skills from all indexed repos, skips missing paths with warning

**Test** (RED — must fail first):
- [ ] T020 [US2] Write use case test for `browseSkills()` in `apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts` — cover: skills from multiple repos combined, empty result when no repos indexed, missing repo paths excluded from results, repo with no skills returns empty for that repo

**Implementation** (make it green):
- [ ] T021 [US2] Implement/update `browseSkills()` method in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — reads all indexed repo paths from PostgresRepositoryRegistry, scans each via FilesystemSkillRepository, combines results, skips missing paths with collected warnings, returns `Skill[]`

**Verify** (GREEN):
- [ ] Run `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/CatalogUseCases.test.ts` (browseSkills subset)

### Task Group G3: searchSkills(query)

**Use case**: `searchSkills(query: string): Promise<Skill[]>` — searches by name (case-insensitive substring), description (substring), tags (exact match), providers (exact match)

**Test** (RED — must fail first):
- [ ] T022 [US2] Write use case test for `searchSkills()` in `apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts` — cover: name substring match (case-insensitive), description substring match, tag exact match, provider exact match, combined multi-field search, empty query returns all, no results, cross-repo search results

**Implementation** (make it green):
- [ ] T023 [US2] Implement `searchSkills(query)` method in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — calls `browseSkills()` then filters by name/description substring, tags exact match, providers exact match, returns `Skill[]`
- [ ] T024 [US2] Add `search()` method to FilesystemSkillRepository in `apps/core/src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository.ts` if not already present — filters scanned skills by term matching name, description, tags, providers

**Verify** (GREEN):
- [ ] Run `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/CatalogUseCases.test.ts` (searchSkills subset)

**Checkpoint**: User Story 2 is fully functional — users can browse and search across all indexed repositories.

---

## Phase 5: User Story 3 — List and Manage Indexed Repositories (Priority: P3)

**Goal**: Users can list indexed repositories with their status and skill counts, remove individual repos, and clear all repos. Repository removal affects listings immediately.

**Independent Test**: Index two repos, call `listRepositories()` to verify both appear with status/skill counts, `removeRepository()` one and verify it disappears, `clearAll()` and verify empty list.

### Task Group G4: listRepositories()

**Use case**: `listRepositories(): Promise<IndexedRepository[]>` — returns all indexed repos with current status determined at query time

**Test** (RED — must fail first):
- [ ] T025 [US3] Write use case test for `listRepositories()` in `apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts` — cover: repos with status valid, repos with status missing (path deleted after indexing), repos with status invalid, empty list, skill count per repo

**Implementation** (make it green):
- [ ] T026 [US3] Implement `listRepositories()` method in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — reads all repos from PostgresRepositoryRegistry, checks filesystem to determine current status (valid/missing/invalid), counts skills per repo via FilesystemSkillRepository scan, returns `IndexedRepository[]`

**Verify** (GREEN):
- [ ] Run `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/CatalogUseCases.test.ts` (listRepositories subset)

### Task Group G5: removeRepository(path)

**Use case**: `removeRepository(path: string): Promise<void>` — removes path from index, does not touch filesystem

**Test** (RED — must fail first):
- [ ] T027 [US3] Write use case test for `removeRepository()` in `apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts` — cover: remove existing repo, remove non-indexed path (no-op), verify skills from removed repo no longer appear in browseSkills, repo on disk is untouched

**Implementation** (make it green):
- [ ] T028 [US3] Implement `removeRepository(path)` method in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — delegates to PostgresRepositoryRegistry.remove(), no-op if path not indexed

**Verify** (GREEN):
- [ ] Run `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/CatalogUseCases.test.ts` (removeRepository subset)

### Task Group G6: clearAll()

**Use case**: `clearAll(): Promise<void>` — removes all indexed repos, skills list becomes empty

**Test** (RED — must fail first):
- [ ] T029 [US3] Write use case test for `clearAll()` in `apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts` — cover: clear with multiple repos indexed, clear when already empty (no-op), verify browseSkills returns empty after clear

**Implementation** (make it green):
- [ ] T030 [US3] Implement `clearAll()` method in `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — delegates to PostgresRepositoryRegistry.clearAll()

**Verify** (GREEN):
- [ ] Run `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/CatalogUseCases.test.ts` (clearAll subset)

**Checkpoint**: User Story 3 is fully functional — users can manage their indexed repositories.

---

## Phase 6: UI & Polish

**Purpose**: Update frontend components and pages to use new data model, remove old code, and pass quality gates.

- [ ] T031 Update `apps/core/src/components/SkillCard.astro` — replace old skill fields (author, version, license) with new fields (sourceRepository, sourcePath, invocationType via disableModelInvocation/userInvocable, tags, providers), preserve design system styling
- [ ] T032 [P] Update `apps/core/src/components/SkillList.astro` — handle multi-repo grouping or display source repository path per skill, integrate with updated SkillCard props
- [ ] T033 [P] Update `apps/core/src/components/EmptyState.astro` — add states for "no repositories indexed" (prompt to index first repo with guidance) and "all repos missing" (warning with unavailable paths list), keep existing "no skills matching search" state
- [ ] T034 Update `apps/core/src/pages/index.astro` — remove DATABASE_URL guard (no longer needed since Postgres is not required for skill reads), add missing-repo warning banner, wire updated use cases
- [ ] T035 Remove old `apps/core/src/lib/shared/skill.ts` — delete the file, update all remaining imports that reference it to use the new Skill type from `apps/core/src/lib/catalog/domain/skill/Skill.ts`
- [ ] T036 Run `pnpm run verify` from repo root — fix all Biome format/lint errors, Astro typecheck errors, Vitest test failures
- [ ] T037 Run quickstart.md validation — execute the example code paths (indexRepository, browseSkills, searchSkills, listRepositories, removeRepository, clearAll) to confirm they work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3): Can start after Foundational. No dependencies on US2/US3.
  - US2 (Phase 4): Depends on US1 (needs FilesystemSkillRepository from US1). Also needs PostgresRepositoryRegistry from Foundational.
  - US3 (Phase 5): Depends on US1 (needs PostgresRepositoryRegistry wired). Can start in parallel with US2 since both only read from repos written by US1.
  - Proceed in priority order: P1 → P2 → P3
- **UI & Polish (Phase 6)**: Depends on all completed user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — provides FilesystemSkillRepository and PostgresRepositoryRegistry that US2/US3 need
- **US2 (P2)**: Can start after US1 — reuses FilesystemSkillRepository for browse/search
- **US3 (P3)**: Can start after Foundational (only needs PostgresRepositoryRegistry) but benefits from US1's wiring — can run in parallel with US2

### Within Each Task Group

- **RED**: Test task FIRST — must be written and confirmed failing
- **IMPL**: Implementation tasks in dependency order
  - T014/T015 ([P] can run in parallel) → T016 (depends on both) → T017 (depends on T016) → T018 ([P] with T019, depends on T016) → T019 (wiring)
- **[P] tasks** within the same group can run in parallel
- **GREEN**: Run verify command to confirm test passes before starting next group

### Parallel Opportunities

- T003 ∥ T004 (Phase 1)
- T006 ∥ T007 ∥ T008 (Phase 2, after T005)
- T010 ∥ T011 (Phase 2, after T009)
- T014 ∥ T015 (Phase 3 US1, before T016)
- T018 ∥ T019 (Phase 3 US1, after T017)
- T032 ∥ T033 (Phase 6)
- US2 and US3 phases can partially overlap (both read from repos indexed by US1)

---

## Parallel Example: User Story 1, Task Group G1

```bash
# Step 1: RED — Write and fail the use case test
Task T013: "Write use case test for indexRepository() in tests/..."

# Step 2: IMPL (parallel where marked [P])
Task T014 [P]: "Implement findGitRoot(path) helper"
Task T015 [P]: "Implement parseFrontmatter(content) helper"
# After [P] helpers complete:
Task T016: "Implement FilesystemSkillRepository"
# After repository implementation:
Task T017: "Implement indexRepository() in CatalogUseCases"
Task T018 [P]: "Write FilesystemSkillRepository integration tests"
Task T019 [P]: "Update DI wiring"
# After all implementation:
Verify GREEN: Run tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T012)
3. Complete Phase 3: User Story 1 (T013–T019)
4. **STOP and VALIDATE**: All use case tests for US1 pass, `pnpm run verify` clean
5. At this point: users can index repositories and get validation results

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → All US1 tests pass → Users can index repos (MVP!)
3. Add US2 → All US2 tests pass → Users can browse/search indexed skills
4. Add US3 → All US3 tests pass → Users can manage their index
5. Add UI + Polish → Full end-to-end feature with updated frontend

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same group
- One Task Group at a time. Verify GREEN before starting the next.
- Use case tests MUST use only use case methods — no direct repository access, no bypass to DI or infrastructure
- Unit tests (T010 Skill schema, T011 PostgresRepositoryRegistry, T018 FilesystemSkillRepository) test individual components thoroughly — use case tests focus on integration behavior
- Skills are read from disk on every call (no caching per research.md decision 8)
- Synchronous filesystem operations (per research.md decision 3)
- Tag derivation and provider inference per research.md decisions 9 and 10
- Cross-platform path handling via `path.resolve`/`path.join` (research.md decision 4)
