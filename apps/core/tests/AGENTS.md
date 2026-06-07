# Core App — Testing Best Practices

## Test Folder Structure

Tests **mirror the `src/` folder structure**. For every source file at
`src/lib/<module>/.../file.ts`, the test lives at
`tests/lib/<module>/.../file.test.ts`.

| Path | Purpose |
|------|---------|
| `tests/lib/**/` | Mirrors `src/lib/**/`. Each test maps to its source file. |
| `tests/helpers/` | Test utilities: `testDatabase.ts`, fake ports, fixtures. |

### Mirroring Examples

| Source | Test |
|--------|------|
| `src/lib/catalog/application/CatalogUseCases.ts` | `tests/lib/catalog/application/CatalogUseCases.test.ts` |
| `src/lib/catalog/infrastructure/persistence/PostgresSkillRepository.ts` | `tests/lib/catalog/infrastructure/persistence/PostgresSkillRepository.test.ts` |
| `src/lib/shared/skill.ts` | `tests/lib/shared/skill.test.ts` |

## Use Case Test Rules

Use case tests MUST interact with the system **only through use case
methods**. This is non-negotiable and enforced by ast-grep.

### Golden Rule

**If you need to create, read, or change data in a use case test and the
use case layer doesn't expose a method for it, add that method to the
use case as you would for a real implementation.**

No shortcuts. No `pool.query()` to seed data. No calling repository
methods directly. If `CatalogUseCases` lacks an `addSkill()` method and
you need one for test setup, add `addSkill()` — with proper input
validation, `@Transactional`, and a repository method. The test is the
first consumer; the implementation is real.

| Rule | Enforced by |
|------|-------------|
| No direct DB access (`pool.query()`, `client.query()`, `getTestPool()`) | ast-grep |
| No repository method calls (only constructor args for wiring) | ast-grep |
| Prefer DI factories (`createCatalogUseCases()`) over manual wiring | use-case-tests.ts check |
| Missing use case methods → add them, don't bypass | code review |

### Wiring Pattern

```ts
import { createCatalogUseCases } from '../../../../src/lib/catalog/infrastructure/di';

describe('CatalogUseCases', () => {
  let useCases: ReturnType<typeof createCatalogUseCases>;

  beforeAll(() => {
    useCases = createCatalogUseCases();
  });

  // Tests call only useCases.browseSkills(), useCases.searchSkills(), etc.
});
```

### Anti-Pattern (forbidden)

```ts
// NEVER: direct DB access
const pool = getTestPool();
await pool.query('INSERT INTO skills ...');

// NEVER: direct repository calls
const repo = new PostgresSkillRepository(db);
await repo.findAll();
```

## Test Database (Testcontainers)

- `setupTestDatabase()` in `setup.ts` spins up `postgres:16-alpine`, runs all migrations (including seed), sets `process.env.DATABASE_URL`
- Container is reused across test files via singleton caching in `testDatabase.ts`
- `teardownTestDatabase()` in `setup.ts` stops the container after all tests
- `cleanDatabase()` truncates all public tables — use only for write tests that create their own data
- `withTestTransaction()` wraps logic in a `BEGIN/COMMIT/ROLLBACK` block with AsyncLocalStorage

## Deterministic Checks

| Check | What it verifies |
|-------|-----------------|
| `ast-grep scan` | No `pool.query()`, `client.query()`, `getTestPool()`, `getTransactionClient()`, or direct repository calls in use case tests |
| `tsx scripts/checks/use-case-tests.ts` | Tests that import UseCases must mirror the `src/` folder structure under `tests/`; no mocks in application tests |

All check scripts run via `pnpm run verify`. Both checks MUST pass.
