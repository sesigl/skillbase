# Research: Project Scaffold (Clarified)

**Feature**: 001-project-scaffold
**Date**: 2026-06-04

## R1: Monorepo Package Manager & Workspace Setup

**Decision**: pnpm 11.x with `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`.

**Rationale**: pnpm is already the pinned package manager. `workspace:*` protocol enables intra-repo dependency references (e.g., `"@skillbase/shared": "workspace:*"`).

**Alternatives considered**: npm workspaces, yarn, Turborepo — all rejected for reasons documented in v1 of this research (no `workspace:*`, not pinned, overkill).

---

## R2: Biome as Sole Formatter + Linter

**Decision**: Single `biome.json` at repo root shared by all packages/apps. Strict TypeScript enforcement.

**Rationale**: Unchanged from v1. Constitution-mandated, one tool for both format + lint.

**Key config**:
- `indentStyle: space`, `indentWidth: 2`, `lineWidth: 100`
- Single quotes, trailing commas es5, semicolons always
- `noUnusedImports`, `noUnusedVariables`, `noUnusedFunctionParameters`: error
- `noExplicitAny`: error, `useImportType`: error
- Test file override: `noUnusedFunctionParameters: off`

---

## R3: PostgreSQL Connection Pattern

**Decision**: `pg` Pool singleton in `apps/core/src/lib/shared/database.ts`, accessed via `DATABASE_URL` from `astro:env/server`. `database.json` with `{ driver: "pg", "ENV": "DATABASE_URL", "ssl": true }`. `.db-migraterc` with `{ "sql-file": true, "migrations-dir": "migrations" }`.

**Rationale**: Clarified during spec session — Neon is the target, accessed via standard `pg` driver with SSL. No `@neondatabase/serverless` needed; Neon's connection pooler works with regular `pg`.

**Connection string**: `postgresql://...@ep-...pooler....aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require`, with `PGSSLMODE=verify-full` env var for db-migrate compatibility.

**Alternatives considered**:
- `@neondatabase/serverless` driver — unnecessary, adds vendor lock-in, `pg` works fine with Neon pooler
- Drizzle/Prisma ORM — overkill for one table, raw SQL with `pg` is simpler

---

## R4: db-migrate Migration Pattern

**Decision**: db-migrate with `--sql-file` flag, migrations in `apps/core/migrations/sqls/` directory. Naming: `YYYYMMDDHHMMSS-name-{up,down}.sql`. JS wrapper files in `migrations/` read and execute the SQL files. Seed data as a separate migration.

**Rationale**: Two migrations for this increment:
1. `create-skills` — DDL for skills table
2. `seed-skills` — INSERT 5 example skills

Migration scripts in `package.json`:
```json
"migrate": "dotenv -- db-migrate up",
"migrate:down": "dotenv -- db-migrate down",
"migrate:create": "dotenv -- db-migrate create migration-name -- --sql-file"
```

**Alternatives considered**: Prisma migrations, Knex — would require learning new tooling.

---

## R5: DDD Architecture & Bounded Context

**Decision**: Single bounded context `catalog` in `apps/core/src/lib/catalog/` with `domain/` (Skill aggregate, SkillRepository interface), `application/` (CatalogUseCases with BrowseSkills, SearchSkills), `infrastructure/` (PostgresSkillRepository, DI container).

**Rationale**: Clarified — full DDD from start. Though only one entity exists now, the architecture is zero-cost to set up and prevents a rewrite when more bounded contexts are added.

**File layout**:
```
src/lib/catalog/
├── domain/
│   └── SkillRepository.ts          # interface { findAll, search(query) }
├── application/
│   └── CatalogUseCases.ts          # class with @Transactional methods
└── infrastructure/
    ├── PostgresSkillRepository.ts  # implements SkillRepository
    └── di.ts                       # factory function returning CatalogUseCases
src/lib/shared/
├── database.ts                     # Pool singleton
└── infrastructure/persistence/
    ├── DatabaseConnection.ts       # connection lifecycle
    ├── TransactionContext.ts       # AsyncLocalStorage
    └── Transactional.ts            # @Transactional decorator
```

---

## R6: Skill Entity & Database Schema

**Decision**: Skills table with a natural composite key (name + author) enforced via UNIQUE constraint, plus a UUID surrogate key for foreign keys in future tables.

**Schema**:
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  providers TEXT[] NOT NULL DEFAULT '{}',
  license VARCHAR(50) NOT NULL,
  homepage VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, author)
);
```

**Rationale**: Clarified — name+author is the unique identity. UUID `id` enables clean foreign key references when other entities (versions, reviews) are added. `TEXT[]` arrays for tags/providers simplify querying with PostgreSQL `ANY()`.

---

## R7: Testcontainers PostgreSQL for Integration Tests

**Decision**: `@testcontainers/postgresql` spins up a real PostgreSQL container for repository integration tests. Migrations are applied programmatically (not via db-migrate CLI) using the same `pg` client. `astro:env/server` is mocked via Vitest alias.

**Rationale**: Clarified — real PostgreSQL catches SQL errors and schema mismatches that mocks miss. `withTestTransaction()` helper wraps each test in `BEGIN/ROLLBACK` for isolation.

**Test setup flow**:
1. `globalSetup` starts PostgreSQL container, sets `DATABASE_URL`
2. `setup.ts` applies all `-up.sql` migrations to the test DB
3. Each test file uses `withTestTransaction()` which mirrors `runInNewTransaction()`

**Alternatives considered**: pg-mem (in-memory) — doesn't support all PostgreSQL features, would miss syntax errors.

---

## R8: Landing Page Design & Sponsors

**Decision**: Dark developer aesthetic (en.dev-style) with JetBrains Mono + system sans-serif fonts. Primary hero CTA = GitHub repository link. Sponsor section = GitHub Sponsors tiers with link to GitHub Sponsors profile. `.github/FUNDING.yml` at repo root.

**Rationale**: Clarified — no hosted SaaS, landing page drives GitHub traffic and sponsorships. en.dev's dark theme and font pairing are proven for developer audiences.

**Fonts**: JetBrains Mono (headings/code) + system sans-serif (body) via `@fontsource/jetbrains-mono`.

**Landing page sections**: Hero (with "View on GitHub" CTA), Problem, Features, How It Works, Sponsors (GitHub Sponsors tiers), Footer.

---

## R9: Verify Script Architecture

**Decision**: Unchanged from v1 but expanded. Root `scripts/verify.ts` orchestrates per-package checks plus root-level checks. Core app verify includes: `biome check`, `tsc --noEmit`, `astro check`, `dependency-cruiser`, `vitest run` (with Testcontainers). Landing page verify includes: `biome check`, `tsc --noEmit`, `astro check`, `vitest run`. Shared package verify includes: `biome check`, `tsc --noEmit`, `vitest run`.

**Rationale**: Constitution VII requires a single `pnpm run verify`. Each app/package has its own `verify` script; the root orchestrator runs them with concurrency via `availableParallelism()`.

---

## R10: Project-Local Skills

**Decision**: Two existing skills (`git-conventions`, `repository-setup`) stay. No new skills needed for this increment — AGENTS.md and the Spec Kit templates cover the development conventions.

**Rationale**: The two existing skills cover git workflow and local setup. DDD-specific skills (repository patterns, transactional use cases, architecture guardrails) can be added when the core app's DDD layer matures.
