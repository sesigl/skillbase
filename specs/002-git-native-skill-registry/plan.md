# Implementation Plan: Git-Native Skill Registry

**Branch**: `002-git-native-skill-registry` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-git-native-skill-registry/spec.md`

## Summary

Replace the PostgreSQL-backed skill catalog with a filesystem-native approach. Skills are read directly from indexed local git repositories on every request. Two new aggregates: `Skill` (filesystem, read-only) and `IndexedRepository` (PostgreSQL, CRUD). The old `skills` table, seed data, and `PostgresSkillRepository` are removed. A new `RepositoryRegistry` manages which paths to scan.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Astro 5.x (SSR), pg (PostgreSQL), yaml (frontmatter parsing), Zod (frontmatter schema validation), node:fs/path (filesystem operations)

**Storage**: Filesystem (skills — read on every request), PostgreSQL (indexed_repositories table — config metadata)

**Testing**: Vitest, Testcontainers (PostgreSQL for RepositoryRegistry tests only), Node.js fs.mkdtemp (temporary directories for skill repository tests)

**Target Platform**: Node.js 22+ on macOS, Windows, Linux

**Project Type**: Web application (Astro SSR monorepo with pnpm workspaces)

**Performance Goals**: Index 100 skills in <5s, search 10,000 skills in <1s (no caching)

**Constraints**: No in-memory cache, scan filesystem on every request, cross-platform path handling

**Scale/Scope**: Dozens of indexed repositories, hundreds of skills per repo, single-user local-first

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Open-Source First & Self-Hostable | ✅ PASS | Filesystem + PostgreSQL = fully self-hostable, no proprietary deps |
| II. Monorepo Discipline | ✅ PASS | All changes in `apps/core/src/lib/catalog/` bounded context, no cross-app leakage |
| III. AI-Native Development | ✅ PASS | Spec in `specs/`, DDD skill loaded, plan follows Spec Kit template |
| IV. TypeScript Everywhere | ✅ PASS | All new code in strict TypeScript, Zod schemas for validation |
| V. Git-Native Skill Source | ✅ PASS | This is the feature that implements this principle — skills read from git repos |
| VI. Usage Transparency | ✅ PASS | No invocation tracking changes — out of scope for this feature |
| VII. Deterministic Quality Gates | ✅ PASS | `pnpm run verify` will pass (format, lint, typecheck, test) |
| VIII. DDD with Hexagonal | ✅ PASS | Two separate aggregate roots (Skill, IndexedRepository), separate repos, clean layers |

**Complexity Tracking**: No violations — no entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-git-native-skill-registry/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/core/
├── src/
│   ├── lib/
│   │   ├── shared/
│   │   │   ├── skill.ts                          # REPLACE: new Claude Code native Skill type + Zod schema
│   │   │   ├── database.ts                       # KEEP: existing database singleton
│   │   │   └── infrastructure/
│   │   │       └── persistence/
│   │   │           ├── DatabaseConnection.ts     # KEEP: interface
│   │   │           ├── PostgresDatabaseConnection.ts  # KEEP: pg implementation
│   │   │           ├── TransactionContext.ts     # KEEP: transaction management
│   │   │           └── Transactional.ts          # KEEP: @Transactional decorator
│   │   └── catalog/
│   │       ├── domain/
│   │       │   ├── skill/
│   │       │   │   ├── SkillRepository.ts        # KEEP: interface (findAll, search)
│   │       │   │   └── Skill.ts                  # NEW: Skill aggregate root
│   │       │   └── repository-registry/
│   │       │       ├── RepositoryRegistry.ts     # NEW: interface (register, remove, clearAll, listAll)
│   │       │       └── IndexedRepository.ts      # NEW: IndexedRepository aggregate root
│   │       ├── application/
│   │       │   └── CatalogUseCases.ts            # MODIFY: add indexRepo, removeRepo, clearAll, listRepos
│   │       └── infrastructure/
│   │           ├── di.ts                         # REPLACE: new wiring
│   │           ├── filesystem/
│   │           │   └── FilesystemSkillRepository.ts  # NEW: implements SkillRepository
│   │           └── persistence/
│   │               ├── PostgresSkillRepository.ts    # REMOVE
│   │               └── PostgresRepositoryRegistry.ts # NEW: implements RepositoryRegistry
│   ├── components/
│   │   ├── SkillCard.astro                      # MODIFY: new fields (no author/version/license)
│   │   ├── SkillList.astro                      # KEEP or minor update
│   │   ├── SearchBar.astro                      # KEEP
│   │   ├── EmptyState.astro                     # MODIFY: handle "no repos indexed" state
│   │   ├── IndexForm.astro                      # NEW: path input + submit for indexing repos
│   │   └── RepositoryList.astro                 # NEW: list indexed repos with remove/clear
│   ├── pages/
│   │   ├── index.astro                          # MODIFY: add IndexForm + RepositoryList, remove DATABASE_URL guard
│   │   └── api/
│   │       └── repositories/
│   │           ├── index.ts                     # NEW: POST /api/repositories/index
│   │           ├── remove.ts                    # NEW: POST /api/repositories/remove
│   │           └── clear-all.ts                 # NEW: POST /api/repositories/clear-all
├── migrations/
│   ├── sqls/
│   │   ├── 20260604000000-create-skills-up.sql   # REMOVE
│   │   ├── 20260604000000-create-skills-down.sql # REMOVE
│   │   ├── 20260604000001-seed-skills-up.sql     # REMOVE
│   │   ├── 20260604000001-seed-skills-down.sql   # REMOVE
│   │   ├── 202606XXXXXXX-create-indexed-repos-up.sql   # NEW
│   │   └── 202606XXXXXXX-create-indexed-repos-down.sql # NEW
│   ├── 20260604000000-create-skills.js           # REMOVE
│   ├── 20260604000001-seed-skills.js             # REMOVE
│   └── 202606XXXXXXX-create-indexed-repos.js     # NEW
└── tests/
    ├── catalog/
    │   ├── PostgresSkillRepository.test.ts       # REMOVE
    │   ├── FilesystemSkillRepository.test.ts     # NEW: tmp dir fixtures
    │   └── PostgresRepositoryRegistry.test.ts    # NEW: Testcontainers
    ├── lib/catalog/application/
    │   └── CatalogUseCases.test.ts               # REWRITE: use new repos, tmp dir fixtures
    └── lib/shared/
        └── skill.test.ts                         # REWRITE: test new Claude Code native schema
```

## Phase 0: Research

See [research.md](./research.md) for resolved decisions.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).
