# Feature Specification: Git-Native Skill Registry

**Feature Branch**: `002-git-native-skill-registry`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "remove the current impl (infrastructure layer) to list and search skills, this is now going to be replaced. add a file system + git native way, a user should be able to register / add / ... (find the best fitting wording) to add a local path as a registered claude code git repository. on that level we should be able to search, list, ... skills (like we currently can with our database skills). this must contain best in class checks if its a valid repository, and know exactly the https://code.claude.com/docs/en/skills specification, EVERY detail must be safely and deterministically implemented to get all information necessary on any operations on skills (e.g. list, search). if one of the checks fails, it's listed and clearly shown whats wrong."

## Clarifications

### Session 2026-06-07

- Q: What is the best-fitting verb for adding a repo? → A: **"Index"** — a user indexes a local path. The system scans the repository, validates it, and makes its skills available for listing and search.
- Q: Should indexing clone a remote or only accept local paths? → A: Only local paths. The repository must already exist on disk. Indexing is a registration step, not a clone operation.
- Q: How is the indexed repository list persisted? → A: In PostgreSQL (the existing database). The list of indexed repository paths is configuration metadata, not skill content. Skills themselves are read from the filesystem on demand. The database stores: which paths to scan, when each was last indexed, and validation status.
- Q: What happens to `@Transactional` on existing use cases? → A: Keep `@Transactional` on `browseSkills()` and `searchSkills()` — even though skill reads are filesystem-only now, removing it risks forgetting to re-add it when database writes are mixed in later. Caveat: no all-or-nothing guarantee while skill reads are outside the transaction boundary.
- Q: How does the user trigger indexing through the UI? → A: The core app has server-side API routes for all mutation operations. The main page includes an "Index repository" section at the top (below the header, above the skill list) with a text input for the local filesystem path and a submit button. After indexing, results (success with skill count, or validation errors) are displayed inline. The page also shows a list of currently indexed repositories with remove/clear buttons. The search bar and skill list remain below, always visible.
- Q: What API surface is needed? → A: Three Astro server-side POST endpoints under the core app: `POST /api/repositories/index` (body: `{ path: string }`), `POST /api/repositories/remove` (body: `{ path: string }`), `POST /api/repositories/clear-all`. These return JSON and are called by the page via form submissions or fetch. The existing GET page already handles browse and search via query parameters.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Index a Local Claude Code Repository (Priority: P1)

A user has a local git repository on disk that contains Claude Code skills (`.claude/skills/` directories with `SKILL.md` files). They want to make those skills visible in Skillbase. They provide the local filesystem path. The system validates that the path points to a valid git repository, scans it for skills following the Claude Code skills specification, and makes them available for browsing and search. If the path is invalid or contains no skills, the system clearly reports every failure so the user knows exactly what is wrong.

**How the user interacts**: The user visits the Skillbase core app at `/`. At the top of the page, below the header, they see an "Index repository" section with a text input field (placeholder: `/path/to/my-skills-repo`) and an "Index" button. The user pastes or types a local filesystem path and clicks "Index". The form submits to `POST /api/repositories/index`. The page then displays the result inline — on success, a green banner with "Indexed N skills from /path/to/repo" appears and the skill list updates. On failure, a red banner lists every validation error with file paths and messages. If the repo is already indexed, a blue banner confirms the re-index with a delta summary (added/updated/removed counts).

**Why this priority**: This is the foundation. Without the ability to index a repository, no skills can be listed or searched. Every other story depends on indexed repositories.

**Independent Test**: Create a temporary git repository with a `.claude/skills/` directory containing valid `SKILL.md` files, index it, and verify the skills appear in a list. Delete the indexed repository and verify the skills are no longer listed.

**Acceptance Scenarios**:

1. **Given** a local path pointing to a valid git repository with one or more `.claude/skills/*/SKILL.md` files, **When** the user indexes that path, **Then** the system parses every skill, stores the repository reference, and returns a summary of indexed skills (count, names).

2. **Given** a local path that does not exist on disk, **When** the user attempts to index it, **Then** the system rejects the path with a clear error: "Path does not exist: /the/path".

3. **Given** a local path that exists but is not a git repository, **When** the user attempts to index it, **Then** the system rejects the path with a clear error: "Not a git repository: /the/path".

4. **Given** a local path pointing to a valid git repository but containing no `.claude/skills/` directories, **When** the user attempts to index it, **Then** the system rejects the path with a clear error: "No skills found in /the/path — repository has no .claude/skills/ directory".

5. **Given** a local path pointing to a valid git repository with a `.claude/skills/` directory containing invalid `SKILL.md` files (e.g., missing required content, malformed YAML frontmatter), **When** the user attempts to index it, **Then** the system lists every validation failure per file (e.g., "skill 'broken-skill': missing description in SKILL.md") and rejects the indexing until all errors are fixed.

6. **Given** a repository has already been indexed, **When** the user indexes the same path again, **Then** the system re-scans the repository, updates any changed skills, and reports the delta (added, updated, removed skills).

---

### User Story 2 - Browse and Search Indexed Skills (Priority: P2)

A user visits the Skillbase core application and wants to see all skills from indexed repositories. They see skills listed with their metadata. They can search across all indexed repositories by skill name, description, tags, or provider, and see results that combine skills from all indexed sources.

**How the user interacts**: The user visits `/` in the browser. Below the "Index repository" section (if present) and the search bar, they see a grid of skill cards. Each card shows: skill name (accent-colored, monospace), source repository path (muted, monospace), description (2-line clamp), invocation type badge (green "user-invocable" or amber "model-only"), tags as pills, and provider badges. The search bar at the top supports GET-based form submission — typing "git" and pressing Enter reloads the page with `?search=git` and shows only matching skills. An empty search field returns all skills. No JavaScript is required — everything works via server-side rendering with form submissions and page reloads.

**Why this priority**: This is the user-facing value — seeing and searching skills. It depends on P1 (indexed repositories must exist) but is independently testable once at least one repository is indexed.

**Independent Test**: Index two different git repositories with different sets of skills, then browse the skill list to verify skills from both appear. Search by a shared tag and verify results span both repositories.

**Acceptance Scenarios**:

1. **Given** one or more repositories have been indexed, **When** the user visits the main page, **Then** they see all skills from all indexed repositories displayed with name, description, source repository path, invocation type (user-invocable / model-invocation-disabled), tags, and providers if available.

2. **Given** multiple skills exist across indexed repositories, **When** the user types a search term, **Then** the page displays only skills matching the term in name, description, tags, or providers.

3. **Given** no repositories have been indexed, **When** the user visits the main page, **Then** they see a prompt to index their first repository with guidance on what constitutes a valid Claude Code skills repository.

4. **Given** all indexed repositories have been removed from disk (missing), **When** the user browses skills, **Then** they see the same "no skills" prompt plus a warning listing the unavailable repository paths so they know what was previously indexed but is now gone.

4. **Given** an indexed repository has been deleted from disk, **When** the user browses skills, **Then** skills from that repository are no longer listed and the system reports the missing repository instead of silently hiding it.

---

### User Story 3 - List and Manage Indexed Repositories (Priority: P3)

A user wants to see which repositories are currently indexed, remove one or clear all. They see each repository's path, status (valid, missing, invalid), skill count, and any validation issues. They can remove a repository from the index, which removes its skills from listings and search results.

**How the user interacts**: Below the "Index repository" form and above the skill grid, the page shows a "Repositories" section — a compact list of indexed repository paths, each with a status badge (green "valid", amber "missing", red "invalid"), the date it was indexed, skill count, and a "Remove" button per repo. Clicking "Remove" on a repo submits to `POST /api/repositories/remove` and removes it from the list and the skill grid below. A "Clear all" button at the bottom of the repo list submits to `POST /api/repositories/clear-all` and clears everything with a confirmation. All operations use standard form submissions (no client-side JavaScript required beyond the browser's native form behavior).

**Why this priority**: Repository management is useful but secondary to the core browse/search experience. A user can get value from P1+P2 without a management UI.

**Independent Test**: Index two repositories, list them, verify both appear with their skill counts. Remove one, list again, verify only the remaining one appears. Re-add it, verify it reappears.

**Acceptance Scenarios**:

1. **Given** one or more repositories have been indexed, **When** the user lists indexed repositories, **Then** they see each repository's path, the date it was indexed, the number of skills found, and its current status (valid/missing/invalid).

2. **Given** a repository is listed as "missing" (path no longer exists on disk), **When** the user views its details, **Then** they see the exact path that is missing and a suggestion to either restore the repository or remove it from the index.

3. **Given** a repository is listed, **When** the user removes it from the index, **Then** the repository and all its skills are removed from listings and search results, but the repository on disk is not modified or deleted.

4. **Given** the user wants a fresh start, **When** they clear all indexed repositories, **Then** all repositories are removed and the skill list becomes empty.

---

### Edge Cases

- **Empty SKILL.md**: A `SKILL.md` file exists but contains only whitespace or just YAML frontmatter with no markdown content. The frontmatter fields are still parsed, but the skill is listed with an empty description.

- **Skill directory without SKILL.md**: A directory exists under `.claude/skills/` but contains no `SKILL.md` file. The directory is ignored (not a skill) and a warning is reported.

- **Symlinked skill directories**: A `.claude/skills/<name>` path is a symlink. The system follows the symlink and treats it as a regular directory.

- **Nested `.claude/skills/` directories**: A repository may have skills at multiple levels (monorepo pattern). The system only scans `.claude/skills/` at the repository root, not in nested subdirectories.

- **Binary or non-UTF8 SKILL.md files**: A `SKILL.md` file contains binary or invalid UTF-8 content. The file is skipped with a clear error message indicating the encoding issue.

- **Duplicate skill names across repositories**: Two indexed repositories both have a skill named `deploy`. Both are listed, and the user sees which repository each originates from. Name uniqueness is not enforced across repositories.

- **Very large SKILL.md files**: A `SKILL.md` file exceeding a reasonable size limit (e.g., 1 MB) is flagged with a warning but not rejected.

- **YAML frontmatter with non-standard fields**: Unknown frontmatter fields are preserved in the skill's metadata but do not cause validation errors.

- **Git repository with no commits (fresh init)**: The repository is valid (it is a git repo), so indexing proceeds normally. The absence of commits is not a validation failure for skill indexing purposes.

- **Concurrent indexing**: Two indexing operations for the same or different repositories are handled without data corruption.

- **Filesystem permission errors**: A `.claude/skills/` directory or `SKILL.md` file exists but the process lacks read permission. The inaccessible file is reported in the validation error list ("Permission denied: /path/to/SKILL.md") and indexing continues for other readable files.

## Requirements *(mandatory)*

### Functional Requirements

#### Repository Validation

- **FR-001**: System MUST verify that the provided path exists on the local filesystem before attempting any further operations.
- **FR-002**: System MUST verify that the provided path is within a valid git repository (i.e., a `.git` directory or file exists at or above the path).
- **FR-003**: System MUST verify that the repository contains at least one `.claude/skills/` directory with at least one `SKILL.md` file.
- **FR-004**: System MUST report ALL validation failures simultaneously, not just the first one encountered.

#### SKILL.md Parsing (Claude Code and Agent Skills Specification)

Per the [Claude Code skills specification](https://code.claude.com/docs/en/skills) and the [Agent Skills open standard](https://agentskills.io/specification):

- **FR-005**: System MUST detect the YAML frontmatter block delimited by `---` markers at the start of each `SKILL.md` file and parse every standard frontmatter field.
- **FR-006**: System MUST extract the skill `name` from the frontmatter. If absent, the directory name is used. The name MUST match the parent directory name (per Agent Skills spec: lowercase alphanumeric + hyphens only, 1-64 chars).
- **FR-007**: System MUST extract the `description` field from frontmatter. If absent, the first paragraph of markdown content after frontmatter is used as the description (per Claude Code behavior).
- **FR-008**: System MUST extract the `license` field from frontmatter if present (per Agent Skills spec).
- **FR-009**: System MUST extract the `compatibility` field from frontmatter if present (per Agent Skills spec, max 500 chars).
- **FR-010**: System MUST extract the `metadata` field from frontmatter as a string-to-string key-value map if present (per Agent Skills spec extension point). This is where Skillbase-specific extensions live: `tags`, `providers`, `author`, `version`, etc.
- **FR-011**: System MUST extract the `when_to_use` field from frontmatter if present (Claude Code extension).
- **FR-012**: System MUST extract the `argument-hint` field from frontmatter if present (Claude Code extension).
- **FR-013**: System MUST extract the `arguments` field from frontmatter as a list of positional argument names if present (Claude Code extension).
- **FR-014**: System MUST extract the `disable-model-invocation` flag from frontmatter as a boolean, defaulting to false (Claude Code extension).
- **FR-015**: System MUST extract the `user-invocable` flag from frontmatter as a boolean, defaulting to true (Claude Code extension).
- **FR-016**: System MUST extract the `allowed-tools` list from frontmatter if present (Claude Code extension).
- **FR-017**: System MUST extract the `disallowed-tools` list from frontmatter if present (Claude Code extension).
- **FR-018**: System MUST extract the `model` override from frontmatter if present (Claude Code extension).
- **FR-019**: System MUST extract the `effort` setting from frontmatter if present. Valid values: `low`, `medium`, `high`, `xhigh`, `max` (Claude Code extension).
- **FR-020**: System MUST extract the `context` setting from frontmatter if present. Valid value: `fork` (Claude Code extension).
- **FR-021**: System MUST extract the `agent` setting from frontmatter if present (Claude Code extension).
- **FR-022**: System MUST extract the `hooks` configuration from frontmatter if present (Claude Code extension).
- **FR-023**: System MUST extract the `paths` glob patterns from frontmatter if present (Claude Code extension).
- **FR-024**: System MUST extract the `shell` setting from frontmatter if present. Valid values: `bash`, `powershell` (Claude Code extension).
- **FR-025**: System MUST extract the skill's markdown body (everything after the frontmatter block) as the skill content, including any dynamic context injection directives (`` !`command` `` patterns) and supporting file references.

#### Skill Metadata (Skillbase Extensions via `metadata`)

- **FR-026**: System MUST read tags from `metadata.tags` if present in the frontmatter `metadata` map. If absent, tags are derived from the skill's directory name and a keyword scan of the description against a predefined taxonomy (deploy, test, security, review, frontend, api, git, documentation, deployment). Tags are always optional — a skill with no tags is valid.
- **FR-027**: System MUST read providers from `metadata.providers` if present in the frontmatter `metadata` map. If absent, providers are inferred from the skill content (presence of Claude Code-specific frontmatter fields like `context`, `agent`, `model`, `effort` strongly implies Claude Code; shell directives like `` !`command` `` are provider-agnostic).
- **FR-028**: System MUST associate each discovered skill with the repository it was found in and display the repository path alongside skill metadata.
- **FR-029**: System MUST extract all supporting files referenced in a skill's `SKILL.md` body (via markdown links and relative paths to `scripts/`, `references/`, `assets/` directories) and list them as assets of the skill.

#### Repository Indexing

- **FR-030**: System MUST persist the list of indexed repository paths (path, indexedAt timestamp, lastStatus) in the database so they survive application restarts.
- **FR-031**: System MUST support re-indexing an already-registered repository (update in place).
- **FR-032**: System MUST support removing a single repository from the index.
- **FR-033**: System MUST support clearing all indexed repositories.
- **FR-034**: System MUST record the timestamp when a repository was last indexed.

#### Skill Listing and Search

- **FR-035**: System MUST list all skills from all indexed repositories combined.
- **FR-036**: System MUST support searching skills by name (case-insensitive substring match).
- **FR-037**: System MUST support searching skills by description (case-insensitive substring match).
- **FR-038**: System MUST support searching skills by tags (exact match on any tag).
- **FR-039**: System MUST support searching skills by provider (exact match on any provider).
- **FR-040**: Search MUST return results from all indexed repositories, not just the first match.
- **FR-041**: When a repository's path no longer exists on disk, its skills MUST be excluded from listings, and the system MUST surface a warning that the repository is unavailable.

#### Error Reporting

- **FR-042**: Every validation failure per SKILL.md file MUST include the full file path and a human-readable description of the problem.
- **FR-043**: When multiple validation failures exist across multiple files, ALL failures MUST be collected and reported together.

### Key Entities

- **IndexedRepository**: A database-persisted record of a local filesystem path that has been registered in Skillbase. Attributes: path (absolute filesystem path, unique), indexedAt (timestamp of last successful scan), status (valid, missing, or invalid — determined at query time by checking filesystem).

- **Skill**: A Claude Code / Agent Skills skill discovered from a `SKILL.md` file. Core attributes come from the Agent Skills open spec: name (from directory name, must match frontmatter `name`), description, license, compatibility, allowed-tools. Claude Code extensions add: whenToUse, argumentHint, arguments, disableModelInvocation, userInvocable, disallowedTools, model, effort, context, agent, hooks, paths, shell. Skillbase extensions live in the `metadata` key-value map (optional, string→string): tags, providers, author, version, etc. Additional attributes: content (markdown body), assets (supporting files in scripts/, references/, assets/), sourceRepository (path to the containing repository), sourcePath (path to the SKILL.md file).

- **RepositoryScanResult**: The outcome of scanning a repository. Attributes: repository (path), status (valid/invalid), skills (list of discovered Skill entities), validationErrors (list of per-file errors), warnings (list of non-blocking issues).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can index a valid Claude Code skills repository in under 5 seconds for a repository with up to 100 skills.
- **SC-002**: The system correctly parses 100% of standard Claude Code `SKILL.md` frontmatter fields as documented in the official specification.
- **SC-003**: Every validation failure for an invalid repository is reported with a message that clearly identifies the file path and the specific problem — a user who has never seen the codebase can understand what is wrong without additional documentation.
- **SC-004**: Search across all indexed repositories returns results in under 1 second for up to 10,000 skills.
- **SC-005**: Removing a repository from the index correctly hides all its skills from subsequent listings and searches.
- **SC-006**: When an indexed repository path becomes unavailable (deleted or moved), the system surfaces the issue rather than failing silently.

## Assumptions

- Repositories are local filesystem paths — the user has already cloned or created them on disk before indexing.
- The `.claude/skills/` directory at the repository root is the sole location scanned for skills. Nested skill directories (monorepo pattern) are out of scope for v1.
- The persisted repository index is stored as a plain file within the Skillbase project, not in PostgreSQL. The existing PostgreSQL infrastructure for skills (PostgresSkillRepository, migrations, seed data) is removed.
- Skillbase-specific data (tags, providers, author, version) lives in the `metadata` field of SKILL.md frontmatter — following the Agent Skills open spec extension point (string→string map). All Skillbase-specific metadata fields are optional. A skill without any `metadata` is fully valid and listable. Skillbase never adds required fields that Claude Code or the Agent Skills spec don't require.
- Tag derivation from `metadata`: if `metadata.tags` is present, it is used verbatim. If absent, tags are derived from the directory name and a keyword scan of the description against a predefined taxonomy.
- Provider inference: if `metadata.providers` is present, it is used verbatim. If absent, the presence of Claude Code-specific frontmatter fields (context, agent, model, effort) is used as a signal.
- The search is server-side (Astro SSR), matching the current implementation pattern. User types a query → server scans indexed repositories → renders filtered results.
- The indexed repository list (paths, timestamps, status) is persisted in PostgreSQL — this is configuration metadata, not skill content. Skills themselves are read from the filesystem at scan/search time.
- Skill repository tests use temporary directories on disk with fixture `SKILL.md` files — no Docker/Testcontainers needed for filesystem reads. The `RepositoryRegistry` tests still use Testcontainers PostgreSQL for database operations.
