# Skillbase Development Guidance

## 1. Knowledge Sources & Context

Before diving into code, orient yourself with:

1. **Spec Kit Templates** (`.specify/templates/`) — the canonical format
   for feature specs, plans, and tasks.
2. **Architecture** (`architecture/`) — Mermaid diagrams and ARC42 docs
   for the big-picture structure.
3. **Constitution** (`.specify/memory/constitution.md`) — non-negotiable
   project principles.
4. **Design System** (`.opencode/skills/design-system/`) — the single source of truth for
   all visual output, brand rules, and UI component patterns. Load
   `.opencode/skills/design-system/README.md` and `.opencode/skills/design-system/colors_and_type.css`
   before touching any frontend code.

## 2. Philosophy & Style

### Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan before starting. Strong success criteria let you
loop independently. Weak criteria ("make it work") require constant clarification.

### Skillbase-Specific

- **Clean Code**: Code must speak for itself. Precise naming matching the domain language.
- **No Comments**: Do not write comments explaining "what" or "how". Exception: "WHY" comments for unexpected logic or workarounds.
- **Zero Tolerance**: All errors AND warnings from `pnpm run verify` must be fixed. No exceptions.

## 3. Technology Stack

- **Language**: TypeScript 5.x (strict mode everywhere)
- **Frontend**: Astro 5.x SSR, SolidJS 1.9, Tailwind CSS 3.x
- **Testing**: Vitest
- **Formatting/Linting**: Biome
- **Monorepo**: pnpm workspaces in root `package.json`
- **Package manager**: pnpm 11.x (pinned in `package.json`)

## 4. Folder Structure

```text
apps/
  core/                  # Main Skillbase application (Astro SSR)
  landing-page/          # Public landing page (Astro SSG/SSR)
.opencode/skills/design-system/           # Single source of truth for visual design
  colors_and_type.css    # All design tokens
  README.md              # Brand rules, voice, iconography
  ui_kits/               # Reference components for both apps
specs/                   # Feature specifications (Spec Kit)
scripts/                 # Automation scripts (TypeScript)
.ci/                     # CI/CD pipeline definitions
```

## 5. Skills

Project-local skills live in `.opencode/skills/`. OpenCode loads them on
demand when the task matches their description.

- **Frontend Design (`frontend-design`):** **MANDATORY for all frontend work.** Production-grade interfaces following the Skillbase design system (paper + ink + electric lime, Space Grotesk/Geist/JetBrains Mono, Lucide icons, no emoji). MUST be loaded BEFORE writing any `.astro`, `.tsx`, `.jsx`, `.css`, or HTML file in `apps/`. Always cross-reference against `.opencode/skills/design-system/README.md`, `.opencode/skills/design-system/colors_and_type.css`, and the relevant UI kit (`.opencode/skills/design-system/ui_kits/landing-page/` or `.opencode/skills/design-system/ui_kits/core-app/`). Non-negotiable brand rules apply. See `.opencode/skills/frontend-design/SKILL.md`.

- **Git Conventions (`git-conventions`):** Conventional Commits
  format, commitlint enforcement, and Husky hook setup. Load when
  creating commits, writing commit messages, or working with git hooks.
- **Customize OpenCode (`customize-opencode`):** OpenCode config
  reference (opencode.json, agents, skills, plugins, permissions).
  Load when editing any `.opencode/` file or `opencode.json`.

## 6. Deterministic Checks

A single `pnpm run verify` command at the repo root runs all checks.
These MUST pass before any commit is considered complete.

- **Format**: `biome format --write .`
- **Lint**: `biome lint .`
- **Type check**: `astro check` (per Astro app)
- **Tests**: `vitest run`
- **Dead code**: `knip`

## 7. Git Conventions

All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/).
Enforced via commitlint + Husky `commit-msg` hook.

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`, `content`, `revert`.

Full details in the `git-conventions` skill (`.opencode/skills/git-conventions/SKILL.md`).

## 9. Testing Best Practices

See `apps/core/tests/AGENTS.md` for test folder structure, use case test
rules, the Testcontainers pattern, and deterministic checks enforced by ast-grep.

The golden rule: use case tests talk to the system ONLY through use case
methods. If a use case method you need for test setup is missing, add it
as a real implementation — don't bypass through repositories or direct DB.
