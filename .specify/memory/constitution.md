<!--
  SYNC IMPACT REPORT
  ==================
  Version change: N/A (template) -> 1.0.0
  Added sections: All (initial creation — Preamble, 7 Core Principles, Project Structure, Governance)
  Removed sections: None
  Modified principles: None (initial)

  Templates requiring updates:
    - .specify/templates/plan-template.md         ✅ no update needed (Constitution Check gate is generic)
    - .specify/templates/spec-template.md          ✅ no update needed
    - .specify/templates/tasks-template.md         ✅ no update needed
    - .specify/templates/checklist-template.md     ✅ no update needed

  Follow-up TODOs:
    - AGENTS.md is currently a stub; it must be expanded with concrete technology choices,
      folder structure conventions, and deterministic check commands once the first
      implementation plan is created.
    - RATIFICATION_DATE is today (2026-06-04). No prior adoption date exists.
-->

# Skillbase Constitution

## Preamble

Skillbase is an open-source, self-hostable hub for managing AI coding
skills across providers (OpenCode, Claude Code, and others). It provides
a single interface to add, remove, search, publish, and benchmark skills
— eventually extending into governance, versioning, usage analytics, MCP
exposure, and compatibility layers.

This constitution defines non-negotiable principles that govern every
implementation decision. All plans, specifications, tasks, and code
contributions MUST comply.

## Core Principles

### I. Open-Source First & Self-Hostable

Skillbase MUST be fully self-hostable from day one. Every feature MUST
ship with a working Docker Compose setup that brings the entire stack
online with a single command.

- No proprietary dependencies that block self-hosting.
- The public `README.md` MUST contain a "Quick Start" section that gets a
  contributor running in under 5 minutes.
- All infrastructure (database, caching, storage) MUST use open-source
  or freely available alternatives.
- Enterprise-only features are out of scope for v1; the codebase remains
  fully Apache 2.0 or MIT licensed.

**Rationale**: Open-source self-hostability is the project's core
promise — without it, there is no Skillbase.

### II. Monorepo Discipline

The repository is a TypeScript monorepo with clear separation between
the core application, the landing page, and shared packages.

- The `apps/` directory contains independently deployable applications.
- The `packages/` directory contains shared libraries with explicit
  contracts (no circular dependencies).
- Each app and package has its own `package.json` and build pipeline.
- Cross-package imports MUST flow only through declared `exports` in
  `package.json` — no reaching into `src/` of sibling packages.
- The landing page (`apps/landing-page/`) is a standalone Astro site
  with zero dependency on the core application.

**Rationale**: Clear boundaries enable independent iteration, prevent
entanglement, and make the codebase approachable for contributors.

### III. AI-Native Development

Skillbase is built for AI-assisted development. The repository itself
MUST be an exemplar of how to collaborate with AI coding agents.

- `AGENTS.md` at the repository root is the evolving source of truth for
  development conventions, folder structure, technology choices,
  testing standards, and executable checks. It MUST be updated whenever
  a new convention, tool, or pattern is adopted.
- `.opencode/skills/` contains project-local skills that AI agents load
  for domain-specific guidance (e.g., Astro patterns, testing
  conventions). Skills MUST be maintained alongside the code they
  describe.
- Every feature starts with a spec in `specs/` following the Spec Kit
  template, created via `/speckit.specify`.
- Deterministic quality gates (formatting, linting, type-checking) MUST
  be runnable by a single command and MUST pass before any commit is
  considered complete.

**Rationale**: Dogfooding AI-native workflows ensures the tool is
designed from real experience.

### IV. TypeScript Everywhere

All application code, scripts, tooling, and configuration (where
feasible) MUST be written in TypeScript.

- `strict` mode enabled in every `tsconfig.json`.
- No `any` escape hatches without a documented justification (a
  `// WHY:` comment and `@ts-expect-error`).
- No barrel exports (`index.ts` that only re-exports). Import files
  directly.
- Configuration files (Astro, Tailwind, etc.) use their native formats;
  build scripts, migration runners, and CLI tools MUST be TypeScript.

**Rationale**: A single language reduces cognitive overhead, enables
cross-package refactoring, and ensures type safety across the entire
stack.

### V. Multi-Provider Skill Format

Skills managed by Skillbase MUST be stored in a provider-agnostic
format.

- The canonical skill format is a self-contained directory with a
  mandatory `SKILL.md` (or equivalent manifest) and optional supporting
  files (scripts, templates, references).
- Metadata (name, description, version, author, provider compatibility,
  tags) MUST be machine-readable from the manifest.
- Export adapters translate the canonical format into
  provider-specific formats (OpenCode skills, Claude Code plugins,
  etc.). No provider lock-in.
- The canonical format MUST be documented and versioned independently
  from the application.

**Rationale**: A neutral format is the foundation for multi-provider
compatibility and future ecosystem growth.

### VI. Public-First Design

Skillbase v1 is a public, single-user application without
authentication.

- Every feature MUST be fully functional without a login wall.
- The UI is publicly accessible; no gated content.
- API endpoints (if any) are public and documented.
- Authentication/authorization (OAuth, API keys, multi-tenancy) is an
  opt-in layer for a future version — not baked into the v1 data model
  in a way that blocks the public use case.
- Rate limiting and abuse prevention are handled at the infrastructure
  level (reverse proxy, CDN), not in application code.

**Rationale**: Public-first reduces friction for early adopters and
demonstrates the product's value immediately.

### VII. Deterministic Quality Gates

Every change MUST pass automated, deterministic checks before it is
considered done.

- A single `npm run verify` command (or equivalent) at the repo root
  runs all checks: formatting, linting, type-checking, and tests.
- Zero tolerance for errors and warnings. The gate is binary: pass or
  fail.
- At minimum, the following tooling MUST be configured:
  - **Formatter** (Biome or Prettier) — enforced on save and in CI.
  - **Linter** (Biome or ESLint) — strict rule set, no warnings
    tolerated.
  - **Type checker** (`tsc --noEmit`) — across all packages.
  - **Test runner** (Vitest) — all tests must pass.
- Pre-commit hooks (Husky + lint-staged) enforce formatting and linting
  locally.

**Rationale**: Deterministic gates eliminate "it works on my machine"
and keep the codebase consistently clean.

## Project Structure

The following top-level layout is canonical for Skillbase. New
directories MUST follow this convention.

```text
apps/
  core/              # Main Skillbase application (Astro SSR)
  landing-page/      # Public landing page (Astro SSG/SSR)
packages/
  shared/            # Shared types, utilities, skill format definitions
specs/               # Feature specifications (Spec Kit)
scripts/             # Automation scripts (TypeScript)
.ci/                 # CI/CD pipeline definitions
.opencode/           # OpenCode configuration, commands, skills
.specify/            # Spec Kit configuration and templates
```

- `apps/` — independently deployable applications. The landing page
  shares no code with the core app.
- `packages/` — shared libraries with explicit contracts. The skill
  format definition lives here so both apps and external consumers can
  depend on it.
- `specs/` — one subdirectory per feature, containing `spec.md`,
  `plan.md`, and related design artifacts.
- `scripts/` — development and CI automation scripts.
- `.opencode/skills/` — project-local skills loaded by AI agents during
  development.

## Governance

### Amendment Procedure

1. Propose a change via an issue or discussion.
2. Update `AGENTS.md` if the change affects development conventions,
   tooling, or folder structure.
3. Update this constitution: increment version, update `Last Amended`,
   and document the change in a Sync Impact Report comment.
4. Submit a PR. At least one maintainer must approve.

### Versioning Policy

This constitution follows Semantic Versioning:

- **MAJOR**: Removal or incompatible redefinition of a core principle.
- **MINOR**: New principle added or materially expanded guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic refinements.

### Compliance Review

- Every implementation plan (`plan.md`) MUST include a "Constitution
  Check" section confirming alignment with each core principle.
- Any violation MUST be documented with a justification in the plan's
  "Complexity Tracking" table.
- The `/speckit.plan` command automatically populates the Constitution
  Check gate based on this file.

### Relationship to AGENTS.md

`AGENTS.md` is the operational companion to this constitution. The
constitution defines *what* principles govern the project; `AGENTS.md`
defines *how* those principles are executed day-to-day (tooling commands,
folder conventions, testing patterns, technology versions).

Both documents MUST be kept in sync. If a conflict arises, this
constitution prevails for architectural decisions; `AGENTS.md` prevails
for operational details.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
