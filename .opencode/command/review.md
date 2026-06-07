---
description: Execute after /speckit.implement to review code quality, architecture, and standards compliance before QA.
---

## User Input

```text
$ARGUMENTS
```

## Context

Load the `Clean Code Reviewer (Uncle Bob & Kent Beck)` and `frontend-design` skills for review context.

Before proceeding, get all changes in the current branch:

```bash
git diff HEAD~1
```

Also determine changed files:

```bash
git diff --name-only HEAD~1
```

## Requirements to Verify

Read the diff. Each section below applies only if its trigger matches the changes.

### All code changes

- Run `pnpm run verify`. All checks MUST pass with zero errors and zero warnings.
- Review all changed code like Uncle Bob and Kent Beck would in a pair programming session.
  - **Does the code speak for itself?** No comments explaining what or how. Exception: "WHY" comments for non-obvious workarounds.
  - **Simplicity.** Would a senior engineer say this is overcomplicated? If yes, simplify. No abstractions for single-use code. No speculative flexibility.
  - **Surgical changes.** Every changed line must trace to the user's request. Flag any unintended adjacent edits.
  - **Naming.** Prefer domain-meaningful names (e.g., `SkillRepository`, not `ISkillRepository`). No `I` prefix on interfaces. No underscore prefixes.

### If domain layer files change (`src/lib/*/domain/`)

- Domain must NOT import from application, infrastructure, or interfaces layers. Dependency inversion — domain at center, all deps point inward.
- Domain files must be inside aggregate subfolders (e.g., `domain/skill/SkillRepository.ts`, not `domain/SkillRepository.ts`).
- Domain must have no direct database, HTTP, or framework imports. Pure TypeScript, ports only.
- No logic in repositories. Repositories are interfaces (ports) in domain. Implementations live in infrastructure.

### If application layer files change (`src/lib/*/application/`)

- Use cases must not contain SQL, HTTP calls, or filesystem access. Infrastructure concerns live in infrastructure layer.
- Every use case method that calls a repository must be `@Transactional` or use `runInNewTransaction`. Verify with `check:ast-grep` included in verify.
- Use cases must NOT import from infrastructure (except shared `Transactional` and `TransactionContext`). Dependencies arrive via constructor injection.
- No domain logic in use cases. They orchestrate domain entities and repositories. Rich domain models preferred over anemic models.

### If infrastructure layer files change (`src/lib/*/infrastructure/`)

- `infrastructure/` root must contain ONLY `di.ts`. All other files must be in subfolders (`persistence/`, `adapters/`).
- Postgres repositories must use `getTransactionClient()` from `TransactionContext`, never `pool.query()` or `pool.connect()` directly.
- Repository constructors must NOT accept a `Pool` parameter. Repositories must be stateless.
- DI containers (`di.ts`) are the only files allowed to import `getDatabaseConnection` from `database.ts`.

### If Astro page or component files change

- No function definitions in page frontmatter. Move logic to shared utilities or use cases.
- Pages must NOT directly instantiate repositories. Use DI via `createCatalogUseCases()`.
- Check `check:env-imports`: no `import.meta.env.*` usage except `PROD`, `DEV`, `SSR` in `.ts`/`.tsx` files. Astro pages use `import.meta.env` as standard API and are excluded.
- Component files follow PascalCase for `.astro` components.

### If user-visible text changes (`.astro`, `.tsx` with copy)

- **No AI slop.** Scan all changed files for banned phrases and patterns:
  - **Em dashes (—)** in UI copy: max 1-2 per page. Replace overuse with commas, periods, or sentence splits.
  - **Banned phrases**: `delve`, `unlock`, `seamlessly`, `effortlessly`, `leverage`, `empower`, `supercharge`, `cutting-edge`, `streamline`, `revolutionize`, `game-changer`, `harness`, `tailored`, `synergy`, `holistic`, `paradigm`, `curated`, `world-class`, `best-in-class`, `next-level`.
  - **Filler intensifiers**: `incredibly`, `remarkably`, `notably`.
  - **Fake dramatic setups**: `the uncomfortable X`, `here is the thing`, `let me be X about`.
  - **Forced transitions**: `Furthermore,`, `Moreover,`, `Additionally,`, `That said,`.
  - **Hedge stacks**: `It's worth noting that`, `It's important to X`.
  - **Rhetorical fluff**: `let's dive in`, `let's unpack`, `let's break this down`.
  - **Fake enthusiasm**: `I hope this helps`, `hope that clarifies`.
  - Run for verification: the `check:copy-quality` step in architecture check covers these automatically.

### If migration files change

- Every SQL up file must have a matching down file and JS wrapper. Verified by `check:migrations` in verify pipeline.
- Seed migrations must be idempotent (`ON CONFLICT DO NOTHING`).
- Check migration SQL for correct table naming (no reserved words, `snake_case`).

### If any file structure changes (new files, moved files, renames)

- Verify `knip` passes: no unused files, dependencies, or exports.
- Verify `ls-lint` passes: file naming follows project conventions (PascalCase for components, kebab-case for pages/scripts, `regex:[0-9]+-[a-z0-9-]+` for migrations).
- Verify `depcruise` passes: no new architecture violations.

## Execution

1. Read the git diff and determine which sections above apply.
2. Execute all applicable review items. Report findings inline.
3. Fix any issues found automatically. Only surface for discussion if the fix is ambiguous or requires a design decision.

## Next Step

Once review passes with zero findings, run `/qa` for end-to-end browser verification.
