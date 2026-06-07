# Catalog Bounded Context — Use Case Contracts

**Feature**: 002-git-native-skill-registry  
**Date**: 2026-06-07

The catalog bounded context exposes its functionality through `CatalogUseCases`. These methods are the ONLY entry point — pages, tests, and other contexts call these and nothing else.

## CatalogUseCases

### browseSkills()

```
browseSkills(): Promise<Skill[]>
```

Returns all skills from all indexed repositories. Scans the filesystem on every call. Skips repositories whose paths no longer exist on disk and adds a warning to the result.

**Errors**: None (returns empty array if no repos indexed or all paths missing).

---

### searchSkills(query)

```
searchSkills(query: string): Promise<Skill[]>
```

Searches all indexed repositories for skills matching `query` in: name (case-insensitive substring), description (case-insensitive substring), tags (exact match on any), providers (exact match on any).

Empty query behaves like `browseSkills()`.

**Errors**: None.

---

### indexRepository(path)

```
indexRepository(path: string): Promise<RepositoryScanResult>
```

Validates the path, scans for skills, and persists the repository reference. Reports all validation errors.

**Validation sequence**:
1. Path exists on filesystem → else error: "Path does not exist"
2. Path is within a git repo (`.git` dir/file found by walking up) → else error: "Not a git repository"
3. `.claude/skills/` directory exists at repo root → else error: "No skills found — repository has no .claude/skills/ directory"
4. Each `SKILL.md` file is parsed and validated
5. All errors collected and returned together

**Re-indexing**: If path already in database, updates `indexed_at` and rescans. Reports delta (added/updated/removed skills).

**Errors**: `RepositoryValidationError` with per-file details if validation fails.

---

### removeRepository(path)

```
removeRepository(path: string): Promise<void>
```

Removes `path` from the indexed repositories table. Does not delete or modify the filesystem. After removal, skills from this repository no longer appear in list/search results.

**Errors**: None (no-op if path not indexed).

---

### clearAll()

```
clearAll(): Promise<void>
```

Removes all indexed repositories. Skills list becomes empty.

**Errors**: None.

---

### listRepositories()

```
listRepositories(): Promise<IndexedRepository[]>
```

Returns all indexed repositories with their current status (determined by checking filesystem at query time).

**Status determination**:
- `valid`: Path exists, is a git repo, has `.claude/skills/`
- `missing`: Path does not exist on disk
- `invalid`: Path exists but fails git repo or skills check

**Errors**: None.

---

## API Surface

All mutation operations are exposed as Astro server-side API routes under the core app. The GET page handles browsing and search via query parameters. All routes return JSON. The page calls these routes via form submissions (native HTML `<form method="post">`) — no client-side JavaScript required.

### GET / (browse and search)

Already implemented. Accepts optional `?search=` query parameter. Renders the full page with SearchBar, repository list, skill grid, and EmptyState as appropriate. Calls `browseSkills()` or `searchSkills(query)` and `listRepositories()` server-side.

### POST /api/repositories/index

```
Content-Type: application/x-www-form-urlencoded
Body: path=<absolute filesystem path>

Response 200:
{
  "status": "valid" | "invalid",
  "repository": "<absolute path>",
  "skills": [Skill, ...],
  "validationErrors": [{ "file": "<path>", "message": "<description>" }, ...],
  "warnings": ["<message>", ...],
  "reindexed": true | false,
  "delta": { "added": N, "updated": N, "removed": N }  // only if reindexed
}
```

Calls `indexRepository(path)`. On success (status: "valid"), the browser redirects back to `/` with the result shown via flash message or query parameter. On failure, renders the same page with validation errors.

### POST /api/repositories/remove

```
Content-Type: application/x-www-form-urlencoded
Body: path=<absolute filesystem path>

Response: Redirect to / with success flash
```

Calls `removeRepository(path)`. No-op if path not indexed. Does not touch the filesystem.

### POST /api/repositories/clear-all

```
Content-Type: application/x-www-form-urlencoded
Body: (none)

Response: Redirect to / with success flash
```

Calls `clearAll()`. Removes all indexed repositories.
