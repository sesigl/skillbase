---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

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

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Use case methods from contracts/
  - Entities from data-model.md
  - Feature requirements from plan.md

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize project with dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 [P] Create shared types/enums in src/path/to/shared.ts
- [ ] T004 [P] Setup persistence infrastructure (migrations, schema)
- [ ] T005 [P] Create base interfaces/ports in src/path/to/domain/
- [ ] T006 Configure DI wiring in src/path/to/di.ts

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3+: User Story Phases

One phase per user story in priority order (P1 → P2 → P3...).
Each phase contains one Task Group per use case method from `contracts/`.

### Example Phase:

## Phase 3: User Story 1 — [Title] (Priority: P1)

**Goal**: [What this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Task Group G1: [useCaseMethod1()]

**Use case**: `[method signature from contracts/]`

**Test** (RED — must fail first):
- [ ] T010 [US1] Write use case test for [method] in tests/path/to/CatalogUseCases.test.ts

**Implementation** (make it green):
- [ ] T011 [P] [US1] Create [Entity] type with Zod schema in src/path/to/entity.ts
- [ ] T012 [P] [US1] Create [Repository] interface in src/path/to/domain/Repository.ts
- [ ] T013 [US1] Implement [RepositoryImpl] in src/path/to/infrastructure/RepositoryImpl.ts
- [ ] T014 [US1] Wire [RepositoryImpl] in src/path/to/infrastructure/di.ts

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/path/to/`

---

### Task Group G2: [useCaseMethod2()]

**Use case**: `[method signature from contracts/]`

**Test** (RED — must fail first):
- [ ] T015 [US1] Write use case test for [method] in tests/path/to/CatalogUseCases.test.ts

**Implementation** (make it green):
- [ ] T016 [US1] Implement [logic] in src/path/to/implementation.ts

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/path/to/`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] TXXX Remove deprecated code and old files
- [ ] TXXX Run `pnpm run verify` and fix all errors
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Proceed in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P2)**: Can start after Foundational — may reuse US1 entities but must be independently testable
- **US3 (P3)**: Can start after Foundational — may reuse US1/US2 entities but must be independently testable

### Within Each Task Group

- **RED**: Test task FIRST — must be written and confirmed failing
- **IMPL**: Implementation tasks in dependency order
  - Entity types → Repository interfaces → Repository implementations → DI wiring
- **[P] tasks** within the same group can run in parallel
- **GREEN**: Run verify command to confirm test passes before starting next group

### Parallel Opportunities

- All tasks marked [P] can run in parallel within their group
- Different Task Groups within the same story are sequential (one at a time)
- Different user stories are sequential (P1 → P2 → P3)

---

## Parallel Example: User Story 1, Task Group G1

```bash
# Step 1: RED — Write and fail the use case test
Task: "Write use case test for browseSkills() in tests/..."

# Step 2: IMPL (parallel where marked [P])
Task: "Create Skill type with Zod schema in src/..."
Task: "Create SkillRepository interface in src/..."
# After [P] tasks complete:
Task: "Implement FilesystemSkillRepository in src/..."
Task: "Wire DI in src/..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (all Task Groups)
4. **STOP and VALIDATE**: All use case tests for US1 pass
5. Run `pnpm run verify` from repo root

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → All US1 tests pass → MVP!
3. Add US2 → All US2 tests pass → Deploy/Demo
4. Add US3 → All US3 tests pass → Deploy/Demo

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same group
- One Task Group at a time. Verify GREEN before starting the next.
- Use case tests MUST use only use case methods — no direct repository access
- Unit tests per task are OPTIONAL — only when the task is complex enough (many edge cases, permutations)
- Commit after each Task Group completes (RED → IMPL → GREEN cycle done)
- Stop at any checkpoint to verify the story independently
