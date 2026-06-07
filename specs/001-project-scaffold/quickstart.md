# Quickstart: Skillbase Local Development

**Feature**: 001-project-scaffold
**Date**: 2026-06-04

## Prerequisites

- **Node.js 25.9.0** (exact version in `.node-version`)
- **pnpm 11.5.1** (pinned in `package.json` `packageManager`)
- **Git**
- **Docker** (for Testcontainers PostgreSQL integration tests)
- **PostgreSQL database** (Neon recommended, or local Postgres)

## 1. Clone & Install

```bash
git clone git@github.com:sesigl/skillbase.git
cd skillbase
pnpm install
```

The `prepare` script runs Husky automatically, setting up the `commit-msg` hook for Conventional Commits enforcement.

## 2. Set Up Database

Create a `.env` file in `apps/core/`:

```bash
# apps/core/.env
DATABASE_URL=postgresql://user:password@host:5432/skillbase?sslmode=require
PGSSLMODE=require
```

If using Neon, the connection string is available from the Neon dashboard.

## 3. Run Migrations & Seed

```bash
pnpm --filter @skillbase/core migrate
```

This creates the `skills` table and inserts 5 seed skills (Git Conventions, Frontend Design, PDF Toolkit, Clean Code Reviewer, Security Review).

## 4. Verify Everything Works

```bash
pnpm run verify
```

Should output all checks passing:
- `biome format` — formatting check (repo root)
- `biome lint` — linting check (repo root)
- `tsc --noEmit` — type check (per package)
- `vitest run` — tests including DB integration tests (per package)
- `dependency-cruiser` — architecture boundary check (core only)
- `astro check` — Astro template check (core + landing page)

## 5. Start the Core Application

```bash
pnpm --filter @skillbase/core dev
# Opens at http://localhost:4321
```

You'll see a searchable skill list fetched from PostgreSQL. Type a search term and submit — results filter server-side via URL query parameter.

## 6. Start the Landing Page

```bash
pnpm --filter @skillbase/landing-page dev
# Opens at http://localhost:4322
```

Dark developer aesthetic landing page with:
- Hero section: "View on GitHub" CTA
- Problem & Features sections
- GitHub Sponsors section
- Footer with GitHub, license, and sponsor links

## Project Layout

| Directory | Purpose |
|-----------|---------|
| `apps/core/` | Main Skillbase application (Astro SSR + PostgreSQL) |
| `apps/core/src/lib/catalog/` | `catalog` bounded context (domain/application/infrastructure) |
| `apps/core/src/lib/shared/` | Shared infrastructure (database, TransactionContext, Transactional) |
| `apps/core/migrations/` | db-migrate SQL migrations |
| `apps/landing-page/` | Public marketing site (en.dev-style, no database) |
| `packages/shared/` | Shared types + skill format definition + Zod schema |
| `scripts/` | verify.ts orchestrator, biome-format.sh |
| `.ci/` | CI/CD pipeline definitions |
| `.github/FUNDING.yml` | GitHub Sponsors configuration |
| `.opencode/skills/` | Project-local AI agent skills |
| `specs/` | Feature specifications |
| `CONTEXT.md` | Project glossary |

## Useful Commands

```bash
# Run verify in a specific package
pnpm --filter @skillbase/shared verify

# Run tests in watch mode
pnpm --filter @skillbase/core test

# Create a new migration
pnpm --filter @skillbase/core migrate:create my-migration -- --sql-file

# Rollback last migration
pnpm --filter @skillbase/core migrate:down

# Format and lint everything
pnpm biome check --write .

# Build both apps
pnpm --filter @skillbase/core build
pnpm --filter @skillbase/landing-page build
```

## Troubleshooting

- **`pnpm: command not found`**: Install pnpm globally: `npm install -g pnpm@11.5.1`
- **Wrong Node version**: Use `nodenv install` (recommended) or install Node 25.9.0 manually
- **Husky hooks not running**: Run `pnpm run prepare` manually
- **Database connection refused**: Verify `DATABASE_URL` in `apps/core/.env` and that the database is running
- **Migration fails**: Check `database.json` has `"ssl": true` for Neon; for local Postgres, set `"ssl": false`
- **Testcontainers fails**: Ensure Docker daemon is running; Testcontainers needs Docker to spin up PostgreSQL
- **Port 4321/4322 in use**: Kill the process or change the port in `astro.config.mjs`
- **`astro:env/server` not found in tests**: The Vitest config aliases this to `tests/astro-env-server-mock.cjs`
