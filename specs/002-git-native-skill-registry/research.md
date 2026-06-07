# Research: Git-Native Skill Registry

**Feature**: 002-git-native-skill-registry  
**Date**: 2026-06-07

## Decisions

### 1. YAML Frontmatter Parsing

**Decision**: Use the `yaml` npm package for parsing YAML frontmatter blocks.

**Rationale**: `yaml` is the most mature YAML parser for Node.js, handles edge cases (multi-line strings, nested maps, YAML 1.2 spec), and is already a common dependency. The frontmatter block (text between `---` markers) is extracted from the SKILL.md file, then parsed with `yaml.parse()`.

**Alternatives considered**:
- `gray-matter`: Too simple — only handles flat key-value frontmatter, can't parse nested YAML structures like `metadata`, `hooks`, or list fields.
- `front-matter`: Same limitation as gray-matter.
- Manual regex: Fragile, doesn't handle YAML edge cases.

### 2. Git Repository Detection

**Decision**: Check for `.git` entry at the repo root using `fs.statSync()`. Accept both directories (normal repos) and files (submodule pointers, worktree links). Walk up from the given path to find the git root using `findUp` pattern.

**Rationale**: Git worktrees use `.git` as a plain file containing a reference to the actual `.git` directory. Submodules also use `.git` as a file. Checking `statSync` and accepting both cases ensures all valid git repository layouts work. Walking up from the path supports specifying a subdirectory within a repo.

**Alternatives considered**:
- Running `git rev-parse --git-dir`: Requires git CLI installed, adds process spawning overhead, not available on all systems.
- Checking only for `.git` directory: Breaks for worktrees and submodules.

### 3. Filesystem Scanning Approach

**Decision**: Synchronous filesystem operations (`readdirSync`, `readFileSync`, `statSync`) for SKILL.md discovery and reading.

**Rationale**: The scan happens in a request handler (SSR page load). Async introduces unnecessary complexity for filesystem reads that are inherently fast. The No-cache decision means every request rescans — sync operations are simpler and the I/O is sequential anyway (cannot parallelize the scan itself).

**Alternatives considered**:
- Async `fs.promises` with `Promise.all`: Over-engineering for sequential directory traversal. Skill directories are read one-by-one, not parallelizable at the directory level.
- Streaming reads: Unnecessary — SKILL.md files are small (max 1MB warning threshold, typical <10KB).

### 4. Cross-Platform Path Handling

**Decision**: Use Node.js `path` module exclusively (`path.resolve`, `path.join`, `path.dirname`). Never use string concatenation for paths. Store absolute paths in the database.

**Rationale**: macOS uses `/`, Windows uses `\`. Node.js `path` module handles both correctly. Storing absolute paths (resolved via `path.resolve` at index time) ensures the path can be reopened later even if the CWD changes.

**Alternatives considered**:
- Storing relative paths: Breaks if CWD changes between indexing and query time.
- Using `file://` URLs: Overcomplicates comparisons and filesystem operations.

### 5. SKILL.md Validation Strategy

**Decision**: Parse frontmatter with `yaml.parse()`, then validate with a Zod schema. Collect ALL errors per file before reporting (per FR-004). Non-standard frontmatter fields are preserved as-is (per Edge Case).

**Rationale**: Zod provides type-safe schema validation with excellent error messages. The schema is permissive for optional fields (Claude Code extension fields are not required) and strict for the Agent Skills spec minimums (name must match directory name, description must exist).

**Alternatives considered**:
- Manual validation: Error-prone, no type inference.
- JSON Schema: Overkill for this use case, no TypeScript integration without extra tooling.

### 6. Temporary Test Directories

**Decision**: Use `fs.mkdtempSync()` with a base path from `os.tmpdir()` for test fixture repositories. Initialize as git repos with `git init` in the temp dir. Clean up in `afterAll` with `fs.rmSync(tmpDir, { recursive: true, force: true })`.

**Rationale**: `mkdtemp` is OS-independent (uses platform temp location on macOS, Windows, Linux). Cleanup in `afterAll` ensures no leftover fixtures on the host system.

**Alternatives considered**:
- Vitest `tmpdir` utilities: Not available in base Vitest without plugins.
- Hardcoded `/tmp/skillbase-test-*`: Not cross-platform (macOS uses `/tmp`, Windows uses `%TEMP%`).

### 7. Database Migration Strategy

**Decision**: Remove old migration files (`*create-skills*`, `*seed-skills*`). Create a new up/down migration for the `indexed_repositories` table. Keep the existing db-migrate setup.

**Rationale**: The `skills` table and seed data are obsolete — removing the migration files ensures a clean state for new deployments and tests. The db-migrate tooling (`.db-migraterc`, `database.json`) stays.

### 8. No Caching

**Decision**: No in-memory cache. Every `findAll()` and `search()` call scans all indexed repositories from disk.

**Rationale**: Explicit decision from spec clarifications. Keeps data fresh without sync logic. Cache can be added later as an optimization. The performance target (1s for 10k skills) is achievable with pure filesystem reads on modern SSDs.

### 9. Provider Inference

**Decision**: If `metadata.providers` is absent, infer `["claude-code"]` if any Claude Code-specific frontmatter fields are present (`context`, `agent`, `model`, `effort`, `paths`, `shell`, `disallowed-tools`). Otherwise, infer `["unknown"]`.

**Rationale**: Claude Code extensions are the most distinctive signal. Skills using `context: fork`, `agent: Explore`, `model`, etc. are clearly Claude Code skills. Skills using only Agent Skills base fields could work with any provider — marking as "unknown" avoids false assumptions.

### 10. Tag Derivation

**Decision**: If `metadata.tags` is absent, tags = `[directoryName]` + keywords from description matched against a predefined taxonomy: `deploy`, `test`, `security`, `review`, `frontend`, `api`, `git`, `documentation`, `deployment`, `testing`, `backend`, `database`, `refactoring`, `monitoring`, `ci`, `cd`.

**Rationale**: Automated tagging reduces the barrier to entry — users don't need to modify their SKILL.md files. The taxonomy is conservative (common skill categories) to avoid noisy false positives.
