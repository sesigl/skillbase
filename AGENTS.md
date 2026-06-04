<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->

# Skillbase Development Guidance

## 1. Knowledge Sources & Context

Before diving into code, orient yourself with:

1. **Spec Kit Templates** (`.specify/templates/`) — the canonical format
   for feature specs, plans, and tasks.
2. **Architecture** (`architecture/`) — Mermaid diagrams and ARC42 docs
   for the big-picture structure.
3. **Constitution** (`.specify/memory/constitution.md`) — non-negotiable
   project principles.

## 2. Philosophy & Style

- **Simplicity**: Prefer simple solutions. Small, focused modules.
- **Clean Code**: Code must speak for itself. Precise naming matching
  the domain language.
- **No Comments**: Do not write comments explaining "what" or "how".
  Exception: "WHY" comments for unexpected logic or workarounds.
- **Zero Tolerance**: All errors AND warnings from `npm run verify`
  must be fixed. No exceptions.

## 3. Technology Stack

- **Language**: TypeScript 5.x (strict mode everywhere)
- **Frontend**: Astro 5.x SSR, SolidJS 1.9, Tailwind CSS 3.x
- **Testing**: Vitest
- **Formatting/Linting**: Biome
- **Monorepo**: npm workspaces in root `package.json`

## 4. Folder Structure

```text
apps/
  core/                  # Main Skillbase application (Astro SSR)
  landing-page/          # Public landing page (Astro SSG/SSR)
packages/
  shared/                # Shared types, utilities, skill format defs
specs/                   # Feature specifications (Spec Kit)
scripts/                 # Automation scripts (TypeScript)
.ci/                     # CI/CD pipeline definitions
```

## 5. Skills

Project-local skills live in `.opencode/skills/`. OpenCode loads them on
demand when the task matches their description.

- **Git Conventions (`git-conventions`):** Conventional Commits
  format, commitlint enforcement, and Husky hook setup. Load when
  creating commits, writing commit messages, or working with git hooks.
- **Customize OpenCode (`customize-opencode`):** OpenCode config
  reference (opencode.json, agents, skills, plugins, permissions).
  Load when editing any `.opencode/` file or `opencode.json`.

## 6. Deterministic Checks

A single `npm run verify` command at the repo root runs all checks.
These MUST pass before any commit is considered complete.

- **Format**: `biome format --write .`
- **Lint**: `biome lint .`
- **Type check**: `tsc --noEmit` (per package)
- **Tests**: `vitest run`

## 7. Git Conventions

All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/).
Enforced via commitlint + Husky `commit-msg` hook.

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`, `content`, `revert`.

Full details in the `git-conventions` skill (`.opencode/skills/git-conventions/SKILL.md`).

## 8. Quality Gates in CI

CI pipelines defined in `.ci/` run the same `verify` command as locally.
No PR merges without a green CI run.
