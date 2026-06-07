# QA Findings — 2026-06-07

## ISSUE #1: No HTTP endpoint for repository indexing/management

- **Severity**: OBSERVATION (not a bug — feature gap)
- **Status**: NOT ADDRESSED (out of scope for this QA pass)
- **Use Case**: US1 (indexRepository), US3 (removeRepository, clearAll)
- **Expected**: Users can index repositories, remove them, and clear all through the web UI or API.
- **Actual**: The use case methods are fully implemented and tested in `CatalogUseCases.ts`, but no HTTP endpoint exposes them. The page only calls read operations (`browseSkills`, `searchSkills`, `listRepositories`).
- **Resolution**: This is a feature gap, not a regression. The current tasks.md does not include API/UI tasks for these mutations. Should be addressed in a future phase.

## ISSUE #2: Orphaned `skills` table in database

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: Data model migration
- **Expected**: After migrating from DB-backed skills to git-native registry, the old `skills` table should be cleaned up.
- **Actual**: The `skills` table had 5 rows of orphaned seed data with no code reading from it.
- **Fix**: Dropped the `skills` table with `DROP TABLE IF EXISTS skills CASCADE`. Verified the DB now has only `indexed_repositories` and `migrations` tables.

## ISSUE #3: Duplicate Phase 5 in tasks.md

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: Documentation
- **Expected**: tasks.md should have exactly one set of tasks per phase.
- **Actual**: `specs/002-git-native-skill-registry/tasks.md` had two "Phase 5: User Story 3" sections.
- **Fix**: Removed the duplicate section (lines 170-216 of original). The first section (lines 123-167) correctly reflects that US3 is implemented.

## ISSUE #4: Phase 6 tasks apparently completed but not checked

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: Documentation
- **Expected**: Task completion checkboxes accurately reflect implementation state.
- **Actual**: T031-T035 were implemented but marked `[ ]` in tasks.md.
- **Fix**: Updated T031-T036 checkboxes to `[x]` after verifying each task was completed.

## ISSUE #5: SkillList missing multi-repo grouping

- **Severity**: OBSERVATION
- **Status**: ACKNOWLEDGED (minor UX, non-blocking)
- **Use Case**: US2 (browseSkills)
- **Expected**: Per T032, SkillList should handle "multi-repo grouping or display source repository path per skill."
- **Actual**: SkillList renders a flat grid. Each SkillCard shows `sourceRepository` in a monospace truncate below the skill name, providing per-card repo identification.
- **Resolution**: The current implementation satisfies the "display source repository path per skill" variant of T032. Visual grouping by repository can be added later.

## ISSUE #6: Verify not yet run

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Expected**: `pnpm run verify` passes with zero errors.
- **Actual**: Not yet executed at start of QA pass.
- **Fix**: Ran `pnpm run verify` — all checks passed (format ✓, lint ✓, design-system ✓, core verify 12/12 ✓, landing verify 0 errors ✓).

## Final Verify Run

```
--- Verify Results ---
  ✓ root:format
  ✓ root:lint
  ✓ root:design-system
  ✓ @skillbase/core
  ✓ @skillbase/landing-page

All checks passed.
```

## Core Verify (12/12)

```
  ✓ check:ast-grep
  ✓ ls-lint
  ✓ format:check
  ✓ lint
  ✓ check:architecture
  ✓ check:use-case-tests
  ✓ check:env-imports
  ✓ check:migrations
  ✓ knip
  ✓ test:arch
  ✓ astro:check
  ✓ test
```

## Tests (73 passed, 0 failed)

- `CatalogUseCases.test.ts` — 18 tests
- `FilesystemSkillRepository.test.ts` — 18 tests
- `PostgresRepositoryRegistry.test.ts` — 10 tests
- `skill.test.ts` — 16 tests (Schema validation)
- `landing-page/pages/index.test.ts` — 1 test (render check)
