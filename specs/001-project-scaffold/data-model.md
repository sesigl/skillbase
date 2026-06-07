# Data Model: Skillbase Project Scaffold (Clarified)

**Feature**: 001-project-scaffold
**Date**: 2026-06-04

## Entities

### Skill

The core aggregate root in the `catalog` bounded context. Represents an AI coding skill parsed from the team's GitHub plugin repository (Claude Code / OpenCode format via `SKILL.md` manifest).

**Storage**: PostgreSQL table `skills` in the core app's Neon database. Accessed via `SkillRepository` interface → `PostgresSkillRepository` implementation.

**Identity**: Composite natural key (name + author) with a UUID surrogate key for foreign key references.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate key for FK references |
| `name` | `VARCHAR(100)` | NOT NULL, part of UNIQUE(name, author) | Human-readable skill name |
| `author` | `VARCHAR(255)` | NOT NULL, part of UNIQUE(name, author) | Author name or handle |
| `description` | `TEXT` | NOT NULL | What the skill does |
| `version` | `VARCHAR(20)` | NOT NULL | Semantic version string |
| `tags` | `TEXT[]` | NOT NULL, DEFAULT '{}' | Searchable tags |
| `providers` | `TEXT[]` | NOT NULL, DEFAULT '{}' | Compatible providers |
| `license` | `VARCHAR(50)` | NOT NULL | SPDX license identifier |
| `homepage` | `VARCHAR(500)` | nullable | URL to skill homepage |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update time |

### Validation Rules (Zod `SkillSchema`)

| Field | Rule |
|-------|------|
| `name` | Non-empty string, max 100 chars |
| `author` | Non-empty string, max 255 chars |
| `description` | Non-empty string |
| `version` | Matches semver regex `/^\d+\.\d+\.\d+$/` |
| `tags` | Array with ≥1 entry, each non-empty |
| `providers` | Array with ≥1 entry, each non-empty |
| `license` | Non-empty string |
| `homepage` | Optional, valid URL if present |

### DDL

```sql
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  providers TEXT[] NOT NULL DEFAULT '{}',
  license VARCHAR(50) NOT NULL,
  homepage VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, author)
);

CREATE INDEX IF NOT EXISTS idx_skills_name_author ON skills(name, author);
CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_skills_providers ON skills USING GIN(providers);
```

### Seed Data

5 example skills inserted via a seed migration:

| Name | Author | Tags | Providers |
|------|--------|------|-----------|
| Git Conventions | skillbase | git, conventions, commitlint | opencode, claude-code |
| Frontend Design | skillbase | frontend, design, tailwind, ui | opencode |
| PDF Toolkit | skillbase | pdf, documents, forms | opencode, claude-code |
| Clean Code Reviewer | skillbase | code-review, refactoring, testing | opencode, claude-code |
| Security Review | skillbase | security, audit, dependencies | opencode, claude-code |

### Repository Interface

```typescript
export interface SkillRepository {
  findAll(): Promise<Skill[]>;
  search(query: string): Promise<Skill[]>;
}
```

### Entity Diagram

```
┌──────────────────────────────────────┐
│            skills (table)             │
├──────────────────────────────────────┤
│ PK  id: UUID (gen_random_uuid)       │
│ UNI (name, author)                   │
│     name: VARCHAR(100)               │
│     author: VARCHAR(255)             │
│     description: TEXT                │
│     version: VARCHAR(20)             │
│     tags: TEXT[]                     │
│     providers: TEXT[]                │
│     license: VARCHAR(50)             │
│     homepage: VARCHAR(500) nullable  │
│     created_at: TIMESTAMPTZ          │
│     updated_at: TIMESTAMPTZ          │
│                                      │
│ IDX idx_skills_name_author           │
│ IDX idx_skills_tags (GIN)            │
│ IDX idx_skills_providers (GIN)       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           Skill (domain)              │
├──────────────────────────────────────┤
│ + name: string                        │
│ + author: string                      │
│ + description: string                 │
│ + version: string (semver)            │
│ + tags: string[] (min 1)              │
│ + providers: string[] (min 1)         │
│ + license: string                     │
│ + homepage?: string                   │
└──────────────────────────────────────┘
```

### Skill Format (Canonical)

Defined in `packages/shared/` as a type, distinct from the database entity. The Skill Format is the provider-agnostic directory structure on disk:

```typescript
export interface SkillFormat {
  /** The directory name */
  name: string;
  /** Required manifest at directory root */
  manifest: 'SKILL.md';
  /** Optional supporting files */
  files: string[];
}
```

The relationship: a `Skill` entity in the database represents the metadata of a `SkillFormat` directory. In this increment, only metadata is stored — the directory/files storage is deferred.

### Future Considerations

- A `skill_invocations` table will track which named skills are invoked, how often, by whom, and with what outcome signal — the core analytics pipeline
- A `SkillVersion` table will track version history when publishing is added
- GitHub integration: `github_repos` config table for skill source configuration
- Governance rules: `governance_checks` table for tag requirements, metadata validation, and compliance status
- Tags and providers may become normalized join tables if search complexity grows
