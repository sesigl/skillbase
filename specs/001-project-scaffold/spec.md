# Feature Specification: Skillbase Project Scaffold

**Feature Branch**: `001-project-scaffold`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "create a governance and analytics tool for AI coding skills. Point it at a GitHub Claude Code plugin repo, show all skills, search, add skills, support versioning via git history, enforce governance via tags and metadata, track usage statistics — which skills are invoked, how often, by whom, whether they improve outcomes." The scaffold increment establishes the repo structure, the landing page, and a basic skill browser backed by PostgreSQL.

## Clarifications

### Session 2026-06-04

- Q: What uniquely identifies a Skill? → A: Name + author (same author can't duplicate a skill name, different authors can)
- Q: Where does skill data live? → A: PostgreSQL (Neon) via pg + db-migrate
- Q: Where does skill search execute? → A: Server-side Astro SSR (URL query param → DB query → renders filtered page)
- Q: Landing page primary CTA destination? → A: GitHub repository (self-hostable, no hosted SaaS)
- Q: Core application architecture style? → A: Full DDD hexagonal architecture (domain/application/infrastructure layers, @Transactional, repository interfaces, dependency-cruiser)
- Q: Create project glossary? → A: Yes — created CONTEXT.md at repo root with canonical terms (Skill, Skill Format, SKILL.md, Provider, Skillbase Core, Landing Page)
- Q: Sponsor/donation mechanism on landing page? → A: GitHub Sponsors only (link via FUNDING.yml + button)
- Q: Bounded context name for the Skill aggregate? → A: `catalog` — owns skills, handles browse and search
- Q: Database test strategy? → A: Testcontainers PostgreSQL (real DB in Docker)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the Landing Page (Priority: P1)

A prospective user or contributor discovers Skillbase through its product landing page. They learn that Skillbase is a governance and analytics tool for AI coding skills — point it at a GitHub plugin repo and see what skills exist, who uses them, and whether they help. The page communicates the open-source, self-hostable nature and provides a path to the core application and GitHub repository.

**Why this priority**: The landing page is the first touchpoint for everyone — users, contributors, and sponsors. Without it, there is no public presence.

**Independent Test**: Start the landing page dev server, navigate to the index page, and verify all content sections render correctly with working navigation links. The page is self-contained and delivers value even if the core app does not exist yet.

**Acceptance Scenarios**:

1. **Given** the landing page is deployed, **When** a visitor navigates to the index page, **Then** they see a hero section explaining Skillbase's purpose as a governance and analytics tool, feature highlights, and a primary call-to-action linking to the GitHub repository.
2. **Given** the landing page is deployed, **When** a visitor scrolls through the page, **Then** they see content sections describing the problem Skillbase solves (tracking skill usage, enforcing governance) and how to get started.
3. **Given** the landing page is deployed, **When** a visitor views the footer, **Then** they find links to GitHub, license information, and sponsor/donation information.

---

### User Story 2 - Explore Skills in the Core Application (Priority: P1)

A user opens the Skillbase core application and sees a UI showing the skills from their configured GitHub plugin repository. The UI presents skills in a searchable list view with metadata (name, description, tags). Skills are parsed from the repo's SKILL.md manifests — no manual entry required.

**Why this priority**: The core application is the product itself. A skill browsing experience sourced from a real GitHub repo validates the concept.

**Independent Test**: Start the core app dev server, connect to the database, run migrations, seed sample data, navigate to the index page, and verify skills are displayed in a list. No auth dependencies.

**Acceptance Scenarios**:

1. **Given** the core application is running, **When** a user visits the main page, **Then** they see a list of available skills with name, description, and tags.
2. **Given** multiple skills exist, **When** a user types a search term and submits the search, **Then** the page reloads with the skill list filtered server-side to show only matching skills by name or description.
3. **Given** no skills match the search, **When** the user performs a search, **Then** an empty state message is displayed suggesting the user broaden their search.

---

### User Story 3 - Understand the Monorepo Structure (Priority: P2)

A contributor clones the repository and immediately understands the project layout. Top-level directories are named intuitively, the README explains how to get started, and AGENTS.md provides comprehensive AI-native development guidance.

**Why this priority**: A clean, self-documenting structure is essential for attracting open-source contributors and enabling AI-assisted development.

**Independent Test**: Clone the repo, inspect the top-level tree, and verify every promised directory and file exists with correct content. AGENTS.md references valid commands.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** a contributor lists the top-level directory, **Then** they see `apps/`, `packages/`, `specs/`, `scripts/`, `.ci/`, and documentation files (`README.md`, `AGENTS.md`, `CONTRIBUTING.md`).
2. **Given** the repository is set up, **When** a contributor runs the commands listed in README.md's "Quick Start" section, **Then** they have the project running locally in under 5 minutes.
3. **Given** AGENTS.md exists, **When** an AI agent reads it, **Then** it can locate and execute all deterministic check commands, understand the folder conventions, and know which technologies to use.

---

### User Story 4 - Run Deterministic Checks (Priority: P2)

A contributor or CI pipeline runs a single command that validates code quality across the entire monorepo. The checks cover formatting, linting, type-checking, and tests — all must pass before any change is accepted.

**Why this priority**: Quality gates are the foundation of a maintainable codebase. They prevent regressions and enforce consistency from day one.

**Independent Test**: Intentionally introduce a formatting error, then run `pnpm run verify` and confirm it fails. Fix the error, re-run, and confirm it passes. Each check type can be validated independently.

**Acceptance Scenarios**:

1. **Given** the project is set up, **When** a contributor runs `pnpm run verify` at the repo root, **Then** all formatting, linting, type-checking, and test checks execute and pass.
2. **Given** a code change introduces a type error, **When** `pnpm run verify` is executed, **Then** the command fails with a non-zero exit code and the error is reported.
3. **Given** a commit is about to be made, **When** the pre-commit hook runs, **Then** formatting and linting are enforced automatically.

---

### User Story 5 - AI-Native Development Experience (Priority: P3)

An AI coding agent working within the repository can load project-local skills, access specification templates, and follow development conventions documented in AGENTS.md. The project structure is optimized for AI-assisted workflows.

**Why this priority**: AI-native tooling enhances development speed and consistency but depends on the basic structure being in place first.

**Independent Test**: Load a project-local skill file and verify it contains valid instructions. Check that OpenCode configuration references the correct skill paths.

**Acceptance Scenarios**:

1. **Given** the repository is set up, **When** an AI agent identifies a relevant task (e.g., Astro UI work), **Then** it can load the corresponding project-local skill from `.opencode/skills/`.
2. **Given** a new feature is starting, **When** the developer uses `/speckit.specify`, **Then** a spec file is created following the template in `.specify/templates/spec-template.md`.

---

### Edge Cases

- What happens when a contributor runs `pnpm run verify` on a fresh clone without having installed dependencies? The verify script must detect missing dependencies and provide a clear error message.
- How does the system handle a scenario where only one app (landing page or core) is being developed and the other has broken types? Each app must be independently verifiable; a failure in one app should not block development in the other.
- What happens when the landing page is accessed from a mobile device? The page must render responsively and all interactive elements must be usable on small screens.
- What happens when the core application is deployed and no skills exist in the data store? A graceful empty state must be shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST have a monorepo structure with `apps/core/`, `apps/landing-page/`, `packages/shared/`, `specs/`, `scripts/`, and `.ci/` directories at the top level.
- **FR-002**: The landing page (`apps/landing-page/`) MUST be a standalone Astro application that renders a product page in a dark developer aesthetic with at minimum: a hero section explaining Skillbase as a governance and analytics tool for AI coding skills, feature highlights, a GitHub Sponsors section, and a footer with GitHub, license, and sponsor links.
- **FR-003**: The core application (`apps/core/`) MUST be a standalone Astro application that renders a publicly accessible UI for browsing skills.
- **FR-004**: The core application UI MUST display a list of skills with at minimum: name, description, and tags for each skill.
- **FR-005**: The core application UI MUST provide a text search that filters the skill list server-side via URL query parameter, querying the database with a WHERE clause on name and description.
- **FR-006**: The landing page MUST share no application code with the core application. Any shared types or utilities MUST live in `packages/shared/`.
- **FR-007**: A single `pnpm run verify` command at the repo root MUST execute formatting checks (Biome), linting checks (Biome), type-checking (`tsc --noEmit`) across all packages, and tests (Vitest) across all packages.
- **FR-008**: The repository MUST contain an `AGENTS.md` file at the root that documents development conventions, folder structure, technology stack, deterministic check commands, and available project-local skills.
- **FR-009**: The repository MUST contain a `README.md` file with a "Quick Start" section that enables a new contributor to get the project running locally in under 5 minutes.
- **FR-010**: The repository MUST contain a `CONTRIBUTING.md` file that explains how to contribute, the pull request process, and code standards.
- **FR-011**: The `packages/shared/` package MUST contain at minimum the canonical skill format type definitions and a Zod schema for validating skill metadata.
- **FR-012**: Project-local skills MUST be stored in `.opencode/skills/` and follow a consistent structure with a `SKILL.md` manifest and optional supporting files.
- **FR-013**: Every application and package MUST have its own `package.json`, `tsconfig.json` with strict mode enabled, and Vitest configuration.
- **FR-014**: The pnpm workspace configuration MUST declare `apps/*` and `packages/*` as workspace directories.
- **FR-015**: Pre-commit hooks (Husky) MUST enforce formatting and linting on staged files before every commit.
- **FR-016**: Commit message format MUST be enforced via commitlint following Conventional Commits with allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `content`, `revert`.
- **FR-017**: The core application MUST use PostgreSQL (Neon) as its persistent data store, accessed via a `pg` Pool singleton in `apps/core/src/lib/shared/database.ts`.
- **FR-018**: Database migrations MUST use db-migrate with SQL files in a `migrations/` directory, following the `YYYYMMDDHHMMSS-name-{up,down}.sql` naming convention.
- **FR-019**: The core application MUST include a seed migration that populates the skills table with 5 example skills.
- **FR-020**: The core application MUST follow a hexagonal DDD architecture: `domain/` (repository interfaces), `application/` (use cases with `@Transactional`), and `infrastructure/` (Postgres repositories, connection pool, `di.ts`).
- **FR-021**: The core application MUST implement `TransactionContext` (AsyncLocalStorage) and `@Transactional` decorator for database transaction management.
- **FR-022**: The core application MUST enforce architecture boundaries via dependency-cruiser rules: pages may not import infrastructure directly, only `TransactionContext` and `Transactional` may import from `database.ts`.

### Key Entities

- **Skill**: A self-contained AI coding capability from the team's GitHub plugin repository, represented by metadata (name, description, version, author, tags) parsed from a `SKILL.md` manifest. Uniquely identified by name + author. Stored in PostgreSQL and synced from the configured repo.
- **Skill Source**: The GitHub repository that Skillbase reads skills from. Configured via `GITHUB_REPO` env var or application settings. Skills are parsed from `SKILL.md` manifests in the repo's skill directories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new contributor can clone the repository, install dependencies, and run the project locally in under 5 minutes, as verified by following the README Quick Start instructions from a clean environment.
- **SC-002**: `pnpm run verify` completes in under 10 seconds on a clean checkout and returns a zero exit code when no violations exist.
- **SC-003**: `pnpm run verify` returns a non-zero exit code within 5 seconds when a formatting violation, lint error, type error, or test failure is present.
- **SC-004**: Both the landing page and core application render their index pages without errors when the dev server is started with their respective `dev` commands.
- **SC-005**: The landing page renders correctly on viewport widths from 320px (mobile) to 1920px (desktop) without horizontal scrolling or layout breakage.
- **SC-006**: The core application skill list supports filtering with text search that returns results in under 1 second for up to 100 skills.
- **SC-007**: 100% of files in the repository are written in TypeScript (application code, scripts, and configuration tooling) except where a native format is required (`.astro`, `.json`, `.yaml`, `.md`).

## Assumptions

- The landing page is an Astro SSR application and does not require a database in this initial increment.
- The core application uses PostgreSQL via Neon for the `DATABASE_URL` with db-migrate for migrations (`database.json`, `.db-migraterc`, `migrations/sqls/` directory, `dotenv -- db-migrate up` scripts).
- The core application (only) follows a hexagonal DDD architecture: `src/lib/<context>/domain/`, `application/`, `infrastructure/` layers with `di.ts` per context, `@Transactional` decorator, repository interfaces, and dependency-cruiser boundary enforcement.
- The shared infrastructure utilities (`database.ts`, `TransactionContext`, `Transactional`) live in `apps/core/src/lib/shared/` and are not extracted to `packages/shared/` since the landing page has no database dependency.
- Docker setup and self-hosting configuration are out of scope for this increment and will be addressed in a follow-up feature.
- Authentication and user management are out of scope. The core application is fully public with no login requirement.
- The project uses Biome for formatting and linting (not Prettier or ESLint), following the convention established in the existing `AGENTS.md`.
- The project uses Vitest as the test runner across all packages.
- Tailwind CSS is used for styling in both applications.
- SolidJS is available but not required for this minimal increment — static Astro components suffice for the initial UI.
- The canonical skill format definition in `packages/shared/` starts as a minimal TypeScript type and Zod schema, not a full specification document. The full skill format spec will be refined in a follow-up feature.
- GitHub Sponsors integration on the landing page is limited to linking to the GitHub Sponsors profile and displaying sponsor tiers. The repository includes a `.github/FUNDING.yml` pointing to GitHub Sponsors. No payment processing or third-party platform integration in this increment.
- Node.js version requirement mirrors the existing `.node-version` file and `package.json` engines field.
