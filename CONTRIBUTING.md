# Contributing to Skillbase

Thanks for your interest in contributing to Skillbase.

## Getting started

Follow the [Quick Start](./README.md#quick-start) in the README to get the
project running locally.

## Code standards

- **TypeScript strict mode** everywhere
- **No comments** explaining "what" or "how" — let the code speak
- **Zero tolerance**: `pnpm run verify` must pass with zero errors and warnings before committing
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages

## Pull request process

1. Create a feature branch from `main`
2. Make your changes following the code standards above
3. Ensure `pnpm run verify` passes locally
4. Open a pull request against `main`
5. CI will run the same `verify` checks — the PR must be green to merge

## Commit conventions

All commits follow Conventional Commits. Allowed types:

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `content`, `revert`

Enforcement is automatic via commitlint and Husky.

## Architecture

- **Landing page** (`apps/landing-page`): Astro SSR, no database, dark developer aesthetic
- **Core app** (`apps/core`): Astro SSR + PostgreSQL, DDD hexagonal architecture (`catalog` bounded context)
- **Shared** (`packages/shared`): Canonical skill types and Zod schemas

See [AGENTS.md](./AGENTS.md) for full development conventions and the
[design system](./.opencode/skills/design-system/README.md) for brand and UI patterns.

## AI-assisted development

Skillbase is designed for AI-native workflows. See [AGENTS.md](./AGENTS.md) for
the complete development guidance that AI agents follow, including available
project-local skills in `.opencode/skills/`.
