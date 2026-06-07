# Core App — Testing Best Practices

## Test Quality

Tests are as important as production code. Readability and structure are
the highest priorities — a test that isn't easy to understand won't be
maintained, and a test that isn't maintained will be deleted.

### Self-Contained Test Cases

A test case must tell you everything you need to understand it without
jumping to helper files. When parts are extracted into helpers (asserters,
fixtures, builders), the parameter names passed to those helpers must make
the information flow obvious. Someone reading the test should see what goes
in, what comes out, and why — all in one glance.

```ts
// GOOD: parameters reveal intent without looking at saveSkill
const skill = await saveSkill(useCases, {
  name: "code-review",
  description: "Review PRs for code quality",
  path: "/skills/code-review",
});
expect(await useCases.browseSkills()).toContainEqual(skill);

// BAD: opaque call, hides what's being saved
const skill = await createFixture("skill-1");
```

### Reusability Through Extraction

Common patterns belong in shared modules — not duplicated across test files.

| What | Where |
|------|-------|
| Custom assertions (e.g. `assertSkillMatches(...)`) | `tests/helpers/asserters/` |
| Data fixtures (builders, factories) | `tests/helpers/fixtures/` |
| Test database lifecycle | `tests/helpers/testDatabase.ts` |
| Fake/reference implementations of ports | `tests/helpers/fakes/` |

Extract early for readability and future reuse. Before writing new test
logic, always scan `tests/helpers/` first — existing helpers make new tests
shorter and more expressive. When in doubt, extract. If duplication does
slip through, refactor it into shared helpers when you notice it.

### Private Methods for Test Structure

Use `describe` blocks for grouping, but use **private module-level functions**
for shared setup logic that spans multiple test cases within the same file.
Private functions keep the `it()` blocks focused on the scenario while the
repeated wiring lives outside.

```ts
describe("CatalogUseCases", () => {
  const { useCases, cleanup } = setupTestContext();

  afterEach(() => cleanup());

  async function givenAnIndexedRepo(path: string): Promise<IndexedRepository> {
    return useCases.indexRepository({ path });
  }

  it("returns empty list when no skills exist", async () => {
    expect(await useCases.browseSkills()).toEqual([]);
  });

  it("returns skills from an indexed repository", async () => {
    await givenAnIndexedRepo("/tmp/skill-repo");

    const skills = await useCases.browseSkills();

    expect(skills.length).toBeGreaterThan(0);
  });
});
```

### Parameterized & Permutation Tests

When a function has many input variations that produce distinct outcomes,
use parameterized tests (`it.each` / `describe.each`) instead of copying.

```ts
it.each([
  { input: "react", expected: 3 },
  { input: "python", expected: 1 },
  { input: "", expected: 0 },
])("search '$input' returns $expected skills", async ({ input, expected }) => {
  const results = await useCases.searchSkills(input);
  expect(results).toHaveLength(expected);
});
```

For cross-product permutations (e.g. provider × type combinations), use
`describe.each` to generate the full matrix — one test case per permutation.

```ts
describe.each(["anthropic", "openai"])("provider: %s", (provider) => {
  describe.each(["prompt", "hook", "command"])("type: %s", (type) => {
    it("is recognized as valid", () => {
      expect(isValidProvider(provider, type)).toBe(true);
    });
  });
});
```

## Test Folder Structure

Tests **mirror the `src/` folder structure**. For every source file at
`src/lib/<module>/.../file.ts`, the test lives at
`tests/lib/<module>/.../file.test.ts`.

| Path | Purpose |
|------|---------|
| `tests/lib/**/` | Mirrors `src/lib/**/`. Each test maps to its source file. |
| `tests/helpers/asserters/` | Custom assertions (e.g. `assertSkillMatches(...)`) |
| `tests/helpers/fixtures/` | Data builders and factories shared across test files |
| `tests/helpers/fakes/` | Fake/reference implementations of ports |
| `tests/helpers/testDatabase.ts` | Testcontainers lifecycle (setup, teardown, cleanup) |

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
