# Tasks: Skill Detail Page

**Input**: Design documents from `/specs/003-skill-detail-page/`

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

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies and create shared utility modules that all user stories depend on.

- [X] T001 Install dependencies: `marked`, `isomorphic-dompurify`, `highlight.js`, `@types/dompurify` via `pnpm --filter @skillbase/core add`
- [X] T002 [P] Create URL-safe base64 encode/decode utilities in `apps/core/src/lib/catalog/infrastructure/adapters/url-encoding.ts`

**Checkpoint**: Dependencies installed, URL encoding utility ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain and application changes that ALL user stories depend on: the skill lookup capability.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Task Group G1: findByRepositoryAndName() + getSkill()

**Use cases**: `SkillRepository.findByRepositoryAndName(repoPath, name)` → `Skill | null`, `CatalogUseCases.getSkill(repoPath, name)` → `Skill | null`

**Test** (RED — must fail first):

- [X] T003 Write use case test for `getSkill()` with existing repo + skill, missing repo, missing skill in `apps/core/tests/catalog/CatalogUseCases.test.ts`

**Implementation** (make it green):

- [X] T004 Add `findByRepositoryAndName(repoPath: string, name: string): Promise<Skill | null>` to `SkillRepository` interface in `apps/core/src/lib/catalog/domain/skill/SkillRepository.ts`
- [X] T005 Add `getSkill(repoPath: string, name: string): Promise<Skill | null>` to `CatalogUseCases` in `apps/core/src/lib/catalog/application/CatalogUseCases.ts`
- [X] T006 Implement `findByRepositoryAndName()` in `FilesystemSkillRepository` — scan only the specified repo, find skill by name in `apps/core/src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository.ts`

**Verify** (GREEN):

- Run: `pnpm --filter @skillbase/core exec vitest run tests/catalog/CatalogUseCases.test.ts`

**Checkpoint**: Foundation ready — skills can be looked up individually by repo path + name. User story implementation can now begin.

---

## Phase 3: User Story 1 — Navigate from Search to Skill Detail (Priority: P1)

**Goal**: User clicks a skill card on the main page → navigates to a dedicated detail page via a unique URL → can return to search. Direct URL access and error states work.

**Independent Test**: Index a repository, open main page, click a skill card, verify detail page loads. Click back, verify return. Navigate directly to a detail URL, verify correct skill. Navigate to bad URL, verify error page.

### Task Group G2: Skill detail page route skeleton

**Use case**: Page renders with basic header (name, description, source repo) for any valid skill URL.

**Test** (RED — must fail first):

- [X] T007 [US1] Write page-level test for skill detail route rendering header fields and back link in `apps/core/tests/pages/skill-detail.test.ts`

**Implementation** (make it green):

- [X] T008 [P] [US1] Create `SkillDetailHeader.astro` — renders name (monospace, lime), description, source repository path, "Back to skills" link in `apps/core/src/components/SkillDetailHeader.astro`
- [X] T009 [P] [US1] Create `SkillNotFound.astro` — shows "This skill does not exist or has been removed" message with back link in `apps/core/src/components/SkillNotFound.astro`
- [X] T010 [P] [US1] Create `RepositoryUnavailable.astro` — shows missing repo path, "Remove from index" action (POST form), "Go to browse" link in `apps/core/src/components/RepositoryUnavailable.astro`
- [X] T011 [US1] Create the Astro dynamic route page `apps/core/src/pages/skill/[repoEncoded]/[skillName].astro` — decode URL (using url-encoding.ts), check repo availability via registry, call `catalog.getSkill()`, render header or error component
- [X] T012 [US1] Make `SkillCard.astro` a clickable link — wrap card in `<a>` with `href` generated from `sourceRepository` + `name` via `url-encoding.ts` in `apps/core/src/components/SkillCard.astro`

**Verify** (GREEN):

- Run: `pnpm --filter @skillbase/core exec vitest run tests/pages/skill-detail.test.ts`

**Checkpoint**: User Story 1 is fully functional — clicking a skill card navigates to the detail page, direct URLs work, error states render correctly.

---

## Phase 4: User Story 2 — View Rendered Skill Content with Frontmatter (Priority: P1)

**Goal**: The Overview tab renders the skill's markdown body as formatted content with design-system typography. Frontmatter fields are classified into header (mandatory) and sidebar (optional, only when present). Supporting files are listed.

**Independent Test**: Index a skill with many optional fields, verify all populated fields are visible and empty fields are absent. Index a skill with only mandatory fields, verify a clean uncluttered view.

### Task Group G3: classifySkillFields()

**Use case**: `classifySkillFields(skill: Skill): { header: SkillHeaderFields; sidebar: SidebarField[] }`

**Test** (RED — must fail first):

- [X] T013 [US2] Write unit test for `classifySkillFields()` — test with fully populated skill, minimal skill, skill with long lists (>3 items), skill with metadata extensions in `apps/core/tests/catalog/classifySkillFields.test.ts`

**Implementation** (make it green):

- [X] T014 [US2] Create `SkillHeaderFields` and `SidebarField` types plus `classifySkillFields()` function following the classification table from data-model.md in `apps/core/src/lib/catalog/application/classifySkillFields.ts`

**Verify** (GREEN):

- Run: `pnpm --filter @skillbase/core exec vitest run tests/catalog/classifySkillFields.test.ts`

### Task Group G4: Markdown rendering + sanitization

**Use case**: `renderMarkdown(content: string): string` — renders markdown to sanitized HTML with syntax-highlighted code blocks.

**Test** (RED — must fail first):

- [X] T015 [US2] Write use case test for markdown rendering — test headings, code blocks (fenced + inline), lists, links, `` !`command` `` patterns, XSS vector (raw `<script>`, `javascript:` links) in `apps/core/tests/pages/skill-detail.test.ts`

**Implementation** (make it green):

- [X] T016 [P] [US2] Create markdown rendering utility using `marked` with `highlight.js` integration for code blocks and custom renderer for `` !`command` `` pattern styling in `apps/core/src/lib/catalog/application/renderMarkdown.ts`
- [X] T017 [P] [US2] Add `isomorphic-dompurify` sanitization step after markdown rendering — strip raw HTML tags, block unsafe URI schemes in `apps/core/src/lib/catalog/application/renderMarkdown.ts`

**Verify** (GREEN):

- Run: `pnpm --filter @skillbase/core exec vitest run tests/pages/skill-detail.test.ts`

### Task Group G5: Overview tab components

**Use case**: Page renders the Overview tab with rendered markdown, frontmatter header, sidebar with adaptive optional fields, and supporting file list.

**Implementation** (no new use case — composition of existing ones):

- [X] T018 [P] [US2] Create `SkillDetailSidebar.astro` — renders `SidebarField[]` adapting to kind (scalar, list expandable, pills, entries, key-value) in `apps/core/src/components/SkillDetailSidebar.astro`
- [X] T019 [P] [US2] Create `SkillDetailOverview.astro` — renders sanitized markdown HTML in prose container + supporting file list at bottom in `apps/core/src/components/SkillDetailOverview.astro`
- [X] T020 [US2] Update `apps/core/src/pages/skill/[repoEncoded]/[skillName].astro` — call `classifySkillFields()`, `renderMarkdown()`, pass `SkillDetailView` to layout, render Overview tab content with header + sidebar + rendered markdown + files

**Verify** (GREEN):

- Run: `pnpm --filter @skillbase/core exec vitest run tests/pages/skill-detail.test.ts`

**Checkpoint**: User Story 2 is fully functional — rendered markdown with XSS protection, adaptive frontmatter display. A minimal skill (name + description only) looks complete.

---

## Phase 5: User Story 3 — View Raw SKILL.md Source (Priority: P2)

**Goal**: The SKILL.md tab displays the raw `SKILL.md` file content in a dark code panel with lime-highlighted YAML frontmatter keys. Tab switching is client-side with WAI-ARIA keyboard navigation.

**Independent Test**: Open a skill detail page, switch to SKILL.md tab, verify displayed content matches the file byte-for-byte. Verify keyboard navigation (arrow keys) switches tabs.

### Task Group G6: SKILL.md source tab + tab switching

**Use case**: Page renders both Overview and SKILL.md tabs, tab switching is client-side with WAI-ARIA pattern.

**Test** (RED — must fail first):

- [X] T021 [US3] Write page-level test for tab switching — verify both tabs present in HTML, SKILL.md content matches raw source, YAML keys have lime class, keyboard navigation works in `apps/core/tests/pages/skill-detail.test.ts`

**Implementation** (make it green):

- [X] T022 [P] [US3] Create `SkillDetailSource.astro` — renders raw `SKILL.md` content with YAML frontmatter keys wrapped in `.yaml-key` spans (lime accent) and code body in standard foreground in `apps/core/src/components/SkillDetailSource.astro`
- [X] T023 [P] [US3] Create `SkillDetailTabs.astro` — WAI-ARIA tablist with Overview/SKILL.md buttons, inline `<script>` for keyboard navigation (arrow keys, Enter/Space), `hidden` attribute toggling on panels in `apps/core/src/components/SkillDetailTabs.astro`
- [X] T024 [US3] Update `apps/core/src/pages/skill/[repoEncoded]/[skillName].astro` — wrap Overview and Source content inside `SkillDetailTabs`, pass both `renderedMarkdown` and `rawSource` as slots

**Verify** (GREEN):

- Run: `pnpm --filter @skillbase/core exec vitest run tests/pages/skill-detail.test.ts`

**Checkpoint**: User Story 3 is fully functional — tabs switch instantly (no page reload), keyboard accessible, raw source shows with YAML highlighting.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and quality gates.

- [X] T025 Run `pnpm run verify` from repo root — fix all Biome format/lint errors, all vitest tests pass, astro check passes
- [X] T026 Verify quickstart.md validation — index a repo, click skill card, verify all tabs and frontmatter states (rich vs sparse skill), test error URLs
- [X] T027 Verify edge cases from spec — skill with no markdown body, skill with empty frontmatter, duplicate names across repos, very long markdown

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — NO dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational — NO dependency on US3
- **User Story 3 (Phase 5)**: Depends on Foundational — US1 page shell AND US2 components must exist (tabs wrap overview content)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P1)**: Can start after Foundational — should run sequentially after US1 since it builds on the page shell
- **US3 (P2)**: Depends on US1 + US2 complete — wraps their content in tabs

### Within Each Task Group

- **RED**: Test task FIRST — must be written and confirmed failing
- **IMPL**: Implementation tasks in dependency order
- **[P] tasks** within the same group can run in parallel
- **GREEN**: Run verify command to confirm test passes before starting next group

### Parallel Opportunities

- T002 (url-encoding) is independent of T001 (deps)
- T008, T009, T010 (error/page components) can run in parallel
- T016, T017 (markdown render + sanitize) different concerns in same file but sequential
- T018, T019 (Sidebar + Overview components) can run in parallel
- T022, T023 (Source + Tabs components) can run in parallel

---

## Parallel Example: Phase 4, Task Group G5

```bash
# IMPL (parallel where marked [P])
Task: T018 [P] [US2] Create SkillDetailSidebar.astro
Task: T019 [P] [US2] Create SkillDetailOverview.astro
# After [P] tasks complete:
Task: T020 [US2] Update page to compose sidebar + overview
```

## Parallel Example: Phase 5, Task Group G6

```bash
# IMPL (parallel where marked [P])
Task: T022 [P] [US3] Create SkillDetailSource.astro
Task: T023 [P] [US3] Create SkillDetailTabs.astro
# After [P] tasks complete:
Task: T024 [US3] Update page to wrap content in tabs
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 — Navigation
4. **STOP and VALIDATE**: Click a skill card, verify page loads with header and back link. Test error URLs.
5. Complete Phase 4: User Story 2 — Rendered Content + Frontmatter
6. **STOP and VALIDATE**: Verify markdown renders with correct typography, frontmatter adapts to rich/sparse skills.
7. Run `pnpm run verify` from repo root
8. **At this point**: Users can browse to detail page, read skills with full formatting. MVP achieved.

### Full Delivery

1. After US1 + US2 MVP verified, continue
2. Complete Phase 5: User Story 3 — Raw Source Tab
3. Run `pnpm run verify`
4. Complete Phase 6: Polish & Edge Cases

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same group
- One Task Group at a time. Verify GREEN before starting the next.
- Use case tests MUST use only use case methods — no direct repository access
- The `CatalogUseCases.test.ts` tests use the DI factory `createCatalogUseCases()` — existing pattern from the codebase
- Page-level tests use Astro's test utilities or mock the DI layer
- Commit after each Task Group completes (RED → IMPL → GREEN cycle done)
- Stop at any checkpoint to verify the story independently
- US1 + US2 together form the MVP — US3 is a power-user enhancement
