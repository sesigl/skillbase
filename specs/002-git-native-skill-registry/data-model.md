# Data Model: Git-Native Skill Registry

**Feature**: 002-git-native-skill-registry  
**Date**: 2026-06-07

## Entities

### Skill (Filesystem Aggregate)

Read from `.claude/skills/<name>/SKILL.md` files on disk. Never persisted in a database — the filesystem is the source of truth.

| Field | Type | Source | Required |
|-------|------|--------|----------|
| `name` | `string` (1-64 chars, lowercase alphanumeric + hyphens) | Directory name, must match frontmatter `name` if present | Yes |
| `description` | `string` | Frontmatter `description`, or first paragraph of body | Yes |
| `license` | `string` \| undefined | Frontmatter `license` (Agent Skills spec) | No |
| `compatibility` | `string` (max 500) \| undefined | Frontmatter `compatibility` (Agent Skills spec) | No |
| `allowedTools` | `string[]` \| undefined | Frontmatter `allowed-tools` (Agent Skills spec + Claude Code) | No |
| `whenToUse` | `string` \| undefined | Frontmatter `when_to_use` (Claude Code extension) | No |
| `argumentHint` | `string` \| undefined | Frontmatter `argument-hint` (Claude Code extension) | No |
| `arguments` | `string[]` \| undefined | Frontmatter `arguments` (Claude Code extension) | No |
| `disableModelInvocation` | `boolean` (default false) | Frontmatter `disable-model-invocation` (Claude Code extension) | Yes |
| `userInvocable` | `boolean` (default true) | Frontmatter `user-invocable` (Claude Code extension) | Yes |
| `disallowedTools` | `string[]` \| undefined | Frontmatter `disallowed-tools` (Claude Code extension) | No |
| `model` | `string` \| undefined | Frontmatter `model` (Claude Code extension) | No |
| `effort` | `"low"` \| `"medium"` \| `"high"` \| `"xhigh"` \| `"max"` \| undefined | Frontmatter `effort` (Claude Code extension) | No |
| `context` | `"fork"` \| undefined | Frontmatter `context` (Claude Code extension) | No |
| `agent` | `string` \| undefined | Frontmatter `agent` (Claude Code extension) | No |
| `hooks` | `Record<string, unknown>` \| undefined | Frontmatter `hooks` (Claude Code extension) | No |
| `paths` | `string[]` \| undefined | Frontmatter `paths` (Claude Code extension) | No |
| `shell` | `"bash"` \| `"powershell"` \| undefined | Frontmatter `shell` (Claude Code extension) | No |
| `metadata` | `Record<string, string>` \| undefined | Frontmatter `metadata` (Agent Skills spec extension) | No |
| `tags` | `string[]` | `metadata.tags` (comma-separated), or derived from dir name + keyword scan | No (empty array ok) |
| `providers` | `string[]` | `metadata.providers` (comma-separated), or inferred from Claude Code fields | No (empty array ok) |
| `content` | `string` | Markdown body after frontmatter block | Yes |
| `assets` | `string[]` | Relative paths extracted from body (markdown links, code blocks referencing `scripts/`, `references/`, `assets/`) | Yes (empty array ok) |
| `sourceRepository` | `string` | Absolute path to the git repository containing this skill | Yes |
| `sourcePath` | `string` | Absolute path to the SKILL.md file | Yes |

**Identity**: `(name, sourceRepository)` — two skills with the same name from different repos are distinct.

**Lifecycle**: Immutable from Skillbase's perspective. Exists as long as the SKILL.md file exists on disk.

**Validation Rules**:
- `name` must match parent directory name (Agent Skills spec)
- `name` must be lowercase alphanumeric + hyphens only, 1-64 chars
- `description` non-empty (from frontmatter or first body paragraph)
- `effort` must be one of: `low`, `medium`, `high`, `xhigh`, `max`
- `shell` must be `bash` or `powershell`
- `context` must be `fork` if present
- Files exceeding 1MB are flagged with a warning but not rejected

### IndexedRepository (Database Aggregate)

Persisted in PostgreSQL `indexed_repositories` table. Manages which paths Skillbase scans.

| Column | Type | Constraints |
|--------|------|-------------|
| `path` | `TEXT` | PRIMARY KEY, absolute filesystem path |
| `indexed_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() |
| `last_status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'valid' |

**SQL Schema**:
```sql
CREATE TABLE indexed_repositories (
  path TEXT PRIMARY KEY,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_status VARCHAR(20) NOT NULL DEFAULT 'valid'
);
```

**Identity**: `path` (natural key — a repo can only be indexed once).

**Lifecycle**:
1. `register(path)` → validates path, stores record with status `valid`
2. `remove(path)` → deletes record
3. `clearAll()` → deletes all records
4. At query time → if path no longer exists on disk, no error thrown; record stays but no skills returned

**Status values**: `valid` (path exists, git repo, has skills), `missing` (path doesn't exist), `invalid` (path exists but not a git repo or no skills)

### RepositoryScanResult (Transient)

Returned by indexing operations. Not persisted — exists only in memory during a scan.

| Field | Type |
|-------|------|
| `repository` | `string` (path) |
| `status` | `"valid"` \| `"invalid"` |
| `skills` | `Skill[]` |
| `validationErrors` | `{ file: string, message: string }[]` |
| `warnings` | `string[]` |

### Relationships

```
IndexedRepository (1) ──scans──▶ Skill (*)
  path                          sourceRepository (FK by value, not DB FK)
```

Skills are discovered from indexed repositories during each query. The relationship is by path value only — no database foreign key. If a repository is removed from the index, its skills stop appearing in queries but no data is "deleted" (skills live on disk).

## Removed Entities

The old `skills` table and its schema (name, author, description, version, tags, providers, license, homepage) are deleted. The `Skill` type in `apps/core/src/lib/shared/skill.ts` is replaced.
