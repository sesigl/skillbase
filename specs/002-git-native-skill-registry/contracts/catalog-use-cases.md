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
