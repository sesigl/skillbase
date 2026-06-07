# Skillbase

A governance and analytics tool for AI coding skills. Point it at your team's GitHub plugin repository and it shows which skills exist, who uses them, how often, and whether they measurably improve outcomes.

## Language

**Skillbase**:
The application that pulls AI coding skills from a team's GitHub plugin repo, displays them, enforces governance rules, and tracks usage analytics.
_Avoid_: Registry, marketplace, platform, catalog, directory, canonical registry

**Skill**:
A self-contained AI coding capability — a directory with a `SKILL.md` manifest and optional supporting files (scripts, templates, references) inside a Claude Code or OpenCode plugin repository. Uniquely identified by name + author.
_Avoid_: Plugin, extension, agent, module

**Skill Source**:
The GitHub repository that Skillbase reads skills from. Configured once; Skillbase stays in sync with the repo's git history. Skills are parsed from their `SKILL.md` manifests — no separate publishing step.
_Avoid_: Registry, catalog, database, store, marketplace

**Governance**:
Automated checks that validate skill quality and consistency: required tags, metadata completeness, version format, license compliance. Rules are defined per team; violations surface in the UI.
_Avoid_: Validation alone (governance implies rules + enforcement), linting, auditing

**Usage Analytics**:
Invocation tracking that answers: which named skills are invoked, how often, by whom, and whether they correlate with improved outcomes (e.g., fewer errors, faster completion). Collected via hooks or OpenTelemetry instrumentation.
_Avoid_: Telemetry alone (analytics implies insight + scores), monitoring, logs

**Invocation**:
A single execution of a named skill by an AI coding agent. Tracked as a discrete event with metadata: skill name, timestamp, user, session context, and optional outcome signal.
_Avoid_: Call, run, execution, trigger (less precise)

**Provider**:
An AI coding assistant platform that loads and executes skills (e.g., OpenCode, Claude Code).
_Avoid_: Platform, runtime, environment, IDE, agent

**SKILL.md**:
The required manifest file at the root of every skill directory. Contains frontmatter metadata (name, description, version, author, tags) and the skill's instructions in markdown body. Parsed by Skillbase to build the skill inventory.
_Avoid_: Manifest, config, README, spec

**Skillbase Core**:
The main application (`apps/core/`) — a skill browser with search, governance dashboards, and usage analytics. Self-hosted, reads from a configured GitHub repo, backed by PostgreSQL.
_Avoid_: App, frontend, UI, registry

**Landing Page**:
The product site (`apps/landing-page/`) explaining what Skillbase does — governance and analytics for team AI coding skills. Dark developer aesthetic.
_Avoid_: Website, homepage, marketing site
