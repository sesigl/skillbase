# Implementation Plan: Skillbase Project Scaffold

**Branch**: `001-project-scaffold` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-scaffold/spec.md`

## Summary

Establish the foundational monorepo structure for Skillbase: a TypeScript pnpm workspace containing the core application (`apps/core/`), product landing page (`apps/landing-page/`), and shared skill type definitions (`packages/shared/`). The core app uses PostgreSQL (Neon) with db-migrate, following a hexagonal DDD architecture (`catalog` bounded context with `domain/`, `application/`, `infrastructure/` layers, `@Transactional` decorator, repository interfaces, dependency-cruiser enforcement). Skillbase is a governance and analytics tool for AI coding skills — point it at a GitHub plugin repo and it shows what skills exist, who uses them, and whether they improve outcomes. The landing page is a dark developer aesthetic site with a GitHub CTA and GitHub Sponsors integration. Quality gates (Biome formatting/linting, Vitest tests including Testcontainers PostgreSQL, `tsc --noEmit` type-checking) are runnable via `pnpm run verify`. Documentation (README, AGENTS.md, CONTRIBUTING.md, CONTEXT.md glossary) and project-local skills complete the AI-native development setup.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode everywhere)

**Primary Dependencies**: Astro 5.x SSR, Tailwind CSS 3.x, Biome (format/lint), Vitest (test), Zod (validation), pg (PostgreSQL client), db-migrate + db-migrate-pg (migrations), dependency-cruiser (architecture enforcement), @testcontainers/postgresql (integration tests), SolidJS 1.9 (available but optional for this increment)

**Storage**: PostgreSQL via Neon (`DATABASE_URL`), accessed through a connection pool singleton in `apps/core/src/lib/shared/database.ts`, migrations via db-migrate SQL files

**Testing**: Vitest (per-package `vitest run`), Testcontainers PostgreSQL for core app repository integration tests

**Target Platform**: Web (Astro SSR), Linux server (future Docker)

**Project Type**: Monorepo — 2 Astro web applications + 1 shared TypeScript package

**Performance Goals**: `pnpm run verify` under 10s; skill search under 1s for 100 skills; landing page renders on 320px–1920px viewports

**Constraints**: Zero warnings/errors on verify; no auth; Docker (except Testcontainers) deferred; all code TypeScript except native formats (.astro, .json, .yaml, .md, .sql)

**Scale/Scope**: 2 apps, 1 shared package, 1 bounded context (`catalog`), ~25 source files, ~8 doc files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Open-Source First & Self-Hostable | ✅ PASS | No proprietary deps. PostgreSQL (Neon) is freely available for local dev. README Quick Start targets <5 min local setup with `DATABASE_URL`. Docker deferred to follow-up. |
| II. Monorepo Discipline | ✅ PASS | `apps/core/`, `apps/landing-page/`, `packages/shared/` with independent `package.json` files. Landing page has zero dep on core. Cross-package imports via declared exports. |
| III. AI-Native Development | ✅ PASS | `AGENTS.md` updated with conventions; `.opencode/skills/` with project-local skills; `specs/` follows Spec Kit template; `CONTEXT.md` glossary for domain language. |
| IV. TypeScript Everywhere | ✅ PASS | Strict `tsconfig.json` in every package/app. Verify script, migration scripts in TypeScript. |
| V. Git-Native Skill Source | ✅ PASS | Skills metadata stored with tags, version, and author. `packages/shared/` defines `Skill` type and `SkillSchema` (Zod). GitHub repo integration and SKILL.md parsing deferred to follow-up feature; seed data simulates a repo for this scaffold. |
| VI. Usage Transparency | ✅ PASS | No auth. Single-user. Usage analytics pipeline (`skill_invocations` table) deferred to follow-up feature. Scaffold establishes the data foundation for invocation tracking. |
| VII. Deterministic Quality Gates | ✅ PASS | `pnpm run verify` runs Biome format+lint, `tsc --noEmit`, Vitest (including Testcontainers DB tests). Husky `commit-msg` for commitlint. dependency-cruiser for architecture boundaries. |

**Gate result**: ALL PASS — no violations to justify.

*Post-Phase-1 re-check: No design changes that affect constitution compliance.*

## Project Structure

### Documentation (this feature)

```text
specs/001-project-scaffold/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
apps/
  core/                       # Main Skillbase application (Astro SSR)
    ├── src/
    │   ├── lib/
    │   │   ├── catalog/
    │   │   │   ├── domain/
    │   │   │   │   └── SkillRepository.ts        # Repository interface
    │   │   │   ├── application/
    │   │   │   │   └── CatalogUseCases.ts         # Browse + search use cases
    │   │   │   └── infrastructure/
    │   │   │       ├── PostgresSkillRepository.ts # pg implementation
    │   │   │       └── di.ts                      # DI container for catalog
    │   │   └── shared/
    │   │       ├── database.ts                    # pg Pool singleton
    │   │       └── infrastructure/
    │   │           └── persistence/
    │   │               ├── DatabaseConnection.ts   # Connection abstraction
    │   │               ├── TransactionContext.ts   # AsyncLocalStorage
    │   │               └── Transactional.ts        # @Transactional decorator
    │   ├── pages/
    │   │   └── index.astro                        # Skill list + search
    │   └── components/                            # Astro UI components
    ├── migrations/
    │   ├── .db-migraterc
    │   ├── database.json
    │   └── sqls/
    │       ├── YYYYMMDDHHMMSS-create-skills-up.sql
    │       ├── YYYYMMDDHHMMSS-create-skills-down.sql
    │       ├── YYYYMMDDHHMMSS-seed-skills-up.sql
    │       └── YYYYMMDDHHMMSS-seed-skills-down.sql
    ├── tests/
    │   ├── helpers/
    │   │   └── testDatabase.ts                    # Testcontainers setup
    │   ├── astro-env-server-mock.cjs              # astro:env mock for tests
    │   └── setup.ts                               # Vitest global setup
    ├── package.json
    ├── tsconfig.json
    ├── astro.config.mjs
    ├── vitest.config.ts
    └── .dependency-cruiser.cjs
  landing-page/               # Public landing page (Astro SSR)
    ├── src/
    │   ├── components/       # Hero, Features, Sponsors, Footer
    │   ├── layouts/          # BaseLayout (dark theme)
    │   └── pages/            # index.astro
    ├── package.json
    ├── tsconfig.json
    ├── astro.config.mjs
    └── vitest.config.ts
packages/
  shared/                     # Shared types + skill schema
    ├── src/
    │   ├── skill.ts          # Skill type + SkillSchema (Zod)
    │   ├── skill-format.ts   # SkillFormat type
    │   ├── skill.test.ts     # Schema validation tests
    │   └── skill-format.test.ts
    ├── package.json
    ├── tsconfig.json
    └── vitest.config.ts
scripts/
  verify.ts                   # Root verify orchestrator
  biome-format.sh             # Biome format wrapper for opencode.json
.ci/
  verify.yml                  # CI workflow
.github/
  FUNDING.yml                 # GitHub Sponsors config
.opencode/
  skills/
    git-conventions/          # Existing skill
    repository-setup/         # Existing skill
specs/                        # Feature specifications
CONTEXT.md                    # Project glossary
README.md
AGENTS.md
CONTRIBUTING.md
LICENSE                       # MIT
package.json                  # Root workspace + verify scripts
pnpm-workspace.yaml
biome.json                    # Root Biome config
commitlint.config.js          # Existing
.node-version                 # 25.9.0
.gitignore
```

**Structure Decision**: Monorepo with `apps/` (independently deployable Astro sites) and `packages/` (shared libraries). Core app uses a hexagonal DDD pattern: `src/lib/catalog/` bounded context with `domain/`, `application/`, `infrastructure/` layers. Shared infrastructure (`database.ts`, `TransactionContext`, `Transactional`) lives in `apps/core/src/lib/shared/` since the landing page has no database dependency. dependency-cruiser enforces architecture boundaries.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| DDD hexagonal architecture for single entity | Ensures consistency with future bounded contexts; zero-cost to set up from the start | Simple Astro page querying DB directly would need full rewrite when second context is added |
| `@Transactional` / `TransactionContext` for single use case | Ensures data integrity when write operations and invocation tracking are added in next increment | Raw `pool.query()` is simpler now but creates a pattern divergence that's costly to fix later |
