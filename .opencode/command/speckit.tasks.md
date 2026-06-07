---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs: 
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before tasks generation)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_tasks` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    
    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-tasks.sh --json` from repo root and parse FEATURE_DIR, TASKS_TEMPLATE, and AVAILABLE_DOCS list.

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios)

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map each use case contract to the user story it serves
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Each user story phase contains one or more **Task Groups** (see below)
   - Generate dependency graph showing user story completion order
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Fill the TASKS_TEMPLATE with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (P1, P2, P3...)
   - Each user story phase contains Task Groups organized by use case
   - Final Phase: Polish & cross-cutting concerns
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Implementation strategy section (MVP first, incremental delivery)

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per user story
   - Task Group count per story
   - Independent test criteria for each story
   - Suggested MVP scope (User Story 1 complete)
   - Format validation: Confirm ALL tasks follow the checklist format

6. **Check for extension hooks** (after_tasks) per `.specify/extensions.yml`.

## Task Generation Rules

### Core Principle: Use Case Tests First (RED → GREEN)

Every task group follows a strict RED → GREEN cycle:

1. **RED**: Write a use case test that calls the system ONLY through use case methods. The test MUST fail because the implementation doesn't exist yet.
2. **IMPL**: Implement the code that makes the test pass. Multiple tasks may be needed per group.
3. **GREEN**: Run the test — it must pass. The task group is complete.

Use case tests talk to the system ONLY through use case methods (as defined in `contracts/`). They never touch repositories, database connections, or internal infrastructure directly.

### Task Group Structure

```text
## Task Group G[N]: [Use Case Name]

**Use case**: [Which contract method this group implements]

**Test** (RED — must fail first):
- [ ] T[N] [USX] Write use case test for [method()] in tests/path/to/test.ts

**Implementation** (steps to make it green):
- [ ] T[N+1] [P] [USX] Create [entity] in src/path/to/entity.ts
- [ ] T[N+2] [USX] Implement [repository/service] in src/path/to/impl.ts
- [ ] T[N+3] [USX] Wire [component] in src/path/to/wiring.ts

**Verify** (GREEN — test must pass):
- Run: `pnpm test -- tests/path/to/test.ts`
```

### Unit Tests Per Task (Optional)

A single implementation task MAY include a unit test task above it — but ONLY when the task is complex enough to warrant isolated testing (many edge cases, permutations, algorithmic logic). Simple data objects, trivial mappings, or pass-through functions do not need unit tests.

```text
- [ ] T[N] [USX] Write unit tests for [function] in tests/path/to/unit.test.ts  ← only if complex
- [ ] T[N+1] [USX] Implement [function] in src/path/to/function.ts
```

Do NOT create unit test tasks for: type definitions, Zod schemas (these are tested by use case tests), configuration files, DI wiring, or Astro component files.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [USX] Description with file path
```

1. **Checkbox**: ALWAYS `- [ ]`
2. **Task ID**: Sequential number (T001, T002, T003...)
3. **[P]**: Include ONLY if parallelizable (different files, no dependency on uncompleted tasks in the same group)
4. **[USX]**: Story label (US1, US2, US3). Setup/Foundational/Polish tasks omit this.
5. **Description**: Clear action with exact file path

### Phase Structure

- **Phase 1**: Setup — one-time project initialization tasks (no story labels)
- **Phase 2**: Foundational — shared infrastructure that ALL user stories depend on (no story labels)
- **Phase 3+**: One phase per user story in priority order (P1 → P2 → P3...)
  - Within each story: one Task Group per use case contract method
  - Each group: RED test → IMPL tasks → GREEN verify
- **Final Phase**: Polish & Cross-Cutting Concerns

### Task Group Derivation from Contracts

For each use case method in `contracts/`:

1. Identify which user story it belongs to
2. Create a Task Group with the use case test task
3. For each entity that method needs, add an implementation task
4. For each repository/service the method calls, add an implementation task
5. For each wiring/infrastructure change, add an implementation task
6. Mark tasks that can be done in parallel with [P]

### Example: A User Story with Two Use Cases

```text
## Phase 3: User Story 1 — Browse Skills (Priority: P1)

### Task Group G1: browseSkills()

**Use case**: `browseSkills(): Promise<Skill[]>`

**Test** (RED):
- [ ] T010 [US1] Write use case test for browseSkills() in apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts

**Implementation**:
- [ ] T011 [P] [US1] Create Skill type with Zod schema in apps/core/src/lib/shared/skill.ts
- [ ] T012 [P] [US1] Create SkillRepository interface in apps/core/src/lib/catalog/domain/skill/SkillRepository.ts
- [ ] T013 [US1] Implement FilesystemSkillRepository in apps/core/src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository.ts
- [ ] T014 [US1] Update DI wiring in apps/core/src/lib/catalog/infrastructure/di.ts

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/`

---

### Task Group G2: searchSkills()

**Use case**: `searchSkills(query: string): Promise<Skill[]>`

**Test** (RED):
- [ ] T015 [US1] Write use case test for searchSkills() in apps/core/tests/lib/catalog/application/CatalogUseCases.test.ts

**Implementation**:
- [ ] T016 [US1] Add search filtering logic to FilesystemSkillRepository in apps/core/src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository.ts

**Verify** (GREEN):
- Run: `pnpm --filter @skillbase/core test -- tests/lib/catalog/application/`
```

## Behavior Rules

- Every user story MUST have at least one Task Group with a RED → GREEN cycle
- Use case tests are MANDATORY for every use case method — no skipping
- Use case tests MUST call only use case methods (from `contracts/`), never internals
- Unit tests per task are OPTIONAL — only when the task is complex enough
- Never batch: one task group at a time, verify green before moving to the next
- Tasks without [P] are sequential within their group
