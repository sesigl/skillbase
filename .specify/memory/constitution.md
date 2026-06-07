<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 1.0.0 -> 2.0.0 (MAJOR: redefined Principles V and VI)
  Added sections: None
  Removed sections: None
  Modified principles:
    - V: "Multi-Provider Skill Format" -> "Git-Native Skill Source" (skills from team repo, not global catalog)
    - VI: "Public-First Design" -> "Usage Transparency" (invocation tracking + analytics as core)
  Preamble: Rewritten to describe governance + analytics tool, not a registry

  Templates requiring updates:
    - .specify/templates/plan-template.md         ✅ no update needed (Constitution Check gate is generic)
    - .specify/templates/spec-template.md          ✅ no update needed
    - .specify/templates/tasks-template.md         ✅ no update needed
    - .specify/templates/checklist-template.md     ✅ no update needed
    - CONTEXT.md                                   ⚠️ requires full rewrite
    - spec.md                                      ⚠️ requires update

  Follow-up TODOs:
    - Landing page copy must be rewritten to match new positioning
    - README.md tagline must be updated
    - Design system README "What is Skillbase" section must be updated
    - Data model needs skill_invocations table (future spec)
    - GitHub integration for skill source (future spec)
-->

# Skillbase Constitution

## Preamble

Skillbase is a governance and analytics tool for AI coding skills. Point
it at your team's GitHub plugin repository and it shows which skills
exist, who uses them, how often, and whether they measurably improve
outcomes. It fills the gap that Anthropic's own issue tracker documents
(#35319: no mature tool tells teams which named skills are being invoked
and whether they help).

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

### V. Git-Native Skill Source

Skills are read from the team's own GitHub plugin repository — not a
global public catalog.

- Skills live in a GitHub repository as Claude Code / OpenCode plugin
  directories, each with a `SKILL.md` manifest.
- Skillbase pulls skill metadata from the configured repository (via
  GitHub API or local checkout), staying in sync with git history.
- Metadata (name, description, version, author, tags) is parsed from the
  repository's manifest files — no separate publishing step required.
- Version history is tracked via git commits. Governance checks run
  against metadata and tag consistency across versions.

**Rationale**: Skills already live in version-controlled repositories.
Skillbase reads what exists rather than forcing a separate publishing
flow.

### VI. Usage Transparency

Skillbase tracks and surfaces skill invocation data so teams understand
what's being used and whether it helps.

- Skill invocation tracking MUST be the core data pipeline: which named
  skills are invoked, how often, by whom, and with what measurable
  quality impact.
- The system MUST expose invocation data through a dashboard that answers:
  which skills are most used, which are idle, which correlate with
  better outcomes.
- Collection MUST be opt-in via hooks or OpenTelemetry instrumentation
  — no telemetry without explicit setup.
- Data stays local by default. A future team-analytics layer may offer
  shared dashboards, but the single-user/self-hosted path MUST remain
  fully functional without cloud telemetry.
- The initial version is single-user without authentication. Multi-user
  team analytics is a planned extension.

**Rationale**: Teams with 183 skills have no way to know which ones
matter. Usage data turns a growing pile of skills into a manageable,
evidence-backed practice.

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

**Version**: 2.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-06
