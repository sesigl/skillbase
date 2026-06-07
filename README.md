# Skillbase

A governance and analytics tool for AI coding skills. Point it at your team's
GitHub plugin repository and it shows which skills exist, who uses them, how often,
and whether they measurably improve outcomes.

## Quick Start

### Prerequisites

- **Node.js 25.9.0** (exact version in `.node-version`)
- **pnpm 11.5.1** (pinned in `package.json`)
- **Git**
- **Docker** (for Testcontainers PostgreSQL integration tests)
- **PostgreSQL** (Neon recommended, or local Postgres)

### 1. Clone and install

```bash
git clone git@github.com:sesigl/skillbase.git
cd skillbase
pnpm install
```

### 2. Set up the database

Create a `.env` file in `apps/core/`:

```bash
# apps/core/.env
DATABASE_URL=postgresql://user:password@host:5432/skillbase?sslmode=require
PGSSLMODE=require
```

### 3. Run migrations and seed data

```bash
pnpm --filter @skillbase/core migrate
```

Creates the `skills` table and inserts 5 example skills.

### 4. Verify everything works

```bash
pnpm run verify
```

### 5. Start the applications

```bash
pnpm --filter @skillbase/core dev        # Core app → http://localhost:4321
pnpm --filter @skillbase/landing-page dev # Landing page → http://localhost:4322
```

## Project layout

| Directory | Purpose |
|-----------|---------|
| `apps/core/` | Main Skillbase application (Astro SSR + PostgreSQL) |
| `apps/landing-page/` | Public marketing site (dark developer aesthetic, no database) |
| `packages/shared/` | Shared types, skill schema, Zod validation |
| `.opencode/skills/design-system/` | Design tokens, brand rules, UI kits |
| `scripts/` | verify orchestrator, helper scripts |
| `.ci/` | CI/CD pipeline definitions |
| `specs/` | Feature specifications |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute,
the pull request process, and code standards.

## License

MIT — see [LICENSE](./LICENSE).

## Sponsors

Skillbase is open source and self-hosted. Support the project via
[GitHub Sponsors](https://github.com/sponsors/sesigl).
