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

## ISSUE #7: Root QA script is missing

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: Automated QA gate
- **Expected**: `pnpm run qa` executes the repository QA test set.
- **Actual**: `pnpm run qa` fails before tests run because the root `package.json` has no `qa` script.
- **Error Log snippet**: `[ERR_PNPM_NO_SCRIPT] Missing script: qa`
- **Regression check**: `pnpm run qa`
- **Fix**: Added a root `qa` script that runs the core and landing-page QA scripts.

## ISSUE #8: SKILL.md tab does not switch from Overview in the browser

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: US3 — View Raw `SKILL.md` Source
- **Expected**: Clicking the `SKILL.md` tab switches `aria-selected` to `SKILL.md`, hides Overview, and shows the raw source panel.
- **Actual**: Clicking the `SKILL.md` tab reports success, but `Overview` remains selected and the Overview panel remains visible.
- **Error Log snippet**: Core server log shows `200` for the detail route and no server error. Browser error check returned `✗` without a readable message.
- **Regression test**: `tests/lib/catalog/presentation/skillDetailTabs.test.ts`
- **Fix**: Replaced the unreliable inline `document.currentScript` lookup with a tested `initializeSkillDetailTabs()` initializer bound to `data-skill-detail-tabs`, covering click and ArrowRight tab switching.

## ISSUE #9: Missing skill in a valid indexed repo renders repository-unavailable

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: US1 — Skill detail error states
- **Expected**: A missing skill under a valid indexed repository renders `This skill does not exist or has been removed`. A previously indexed repository that is missing on disk renders `The repository containing this skill is no longer available...`.
- **Actual**: Missing skill URL `http://localhost:4321/skill/L1VzZXJzL3NlYmFzdGlhbi5zaWdsL1dvcmtzcGFjZS9jbGF1ZGUtY29kZS1wZXJzb25hbC1wbHVnaW4/no-such-skill` renders repository-unavailable even though the repository is listed as `valid` and existing skill URLs load. An arbitrary unregistered repo URL correctly renders skill-not-found.
- **Error Log snippet**: Core server log shows `200` for the missing-skill route and no server error.
- **Regression test**: `tests/lib/catalog/presentation/resolveSkillDetailErrorState.test.ts`
- **Fix**: Added `resolveSkillDetailErrorState()` so only an indexed repository with `lastStatus: missing` renders the repository-unavailable state; valid indexed repos with missing skills render skill-not-found.

## ISSUE #10: Skill detail Overview duplicates the full document and is hard to scan

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: US2 — View rendered skill content with frontmatter
- **Expected**: The Overview tab helps users quickly decide what the skill is for, how it is invoked, what constraints apply, and where to inspect details.
- **Actual**: The Overview tab renders the full markdown body, duplicating the `SKILL.md` tab and creating a dense, hard-to-read page.
- **Error Log snippet**: No runtime error. This is a UX defect observed during manual QA.
- **Regression test**: `tests/lib/catalog/presentation/buildSkillOverview.test.ts`
- **Fix**: Replaced the full-markdown Overview with a scan-first operator brief: concise summary, runtime signals, invocation contract, operating bounds, catalog signal, content map, supporting files, and manifest facts. The detailed raw content remains in the `SKILL.md` tab.

## ISSUE #11: Raw SKILL.md panel adds indentation before source content

- **Severity**: ISSUE
- **Status**: RESOLVED
- **Use Case**: US3 — View Raw `SKILL.md` Source
- **Expected**: The raw source panel preserves the original `SKILL.md` content without adding leading whitespace before the first byte.
- **Actual**: The source tab renders spaces before the opening `---` frontmatter delimiter.
- **Error Log snippet**: Browser snapshot shows raw source beginning with `    ---`.
- **Regression test**: `tests/pages/skill-detail-source.test.ts`
- **Fix**: Moved the raw source HTML injection directly onto the `<pre>` boundary so Astro template indentation is not emitted before the source content.
