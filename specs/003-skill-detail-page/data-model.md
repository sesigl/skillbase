# Data Model: Skill Detail Page

**Feature**: 003-skill-detail-page
**Date**: 2026-06-07

## Overview

No new database entities. The feature reuses the existing `Skill` entity (from spec 002) and adds presentation-layer types for the detail page layout.

## Existing Entities (Reused)

### Skill

Defined in `apps/core/src/lib/catalog/domain/skill/Skill.ts` (Zod schema). Full field list:

| Field | Type | Required? | Source |
|-------|------|-----------|--------|
| `name` | `string` | yes | Directory name / frontmatter |
| `description` | `string` | yes | Frontmatter or first paragraph fallback |
| `license` | `string \| undefined` | no | Frontmatter |
| `compatibility` | `string \| undefined` | no | Frontmatter |
| `allowedTools` | `string[] \| undefined` | no | Frontmatter |
| `whenToUse` | `string \| undefined` | no | Frontmatter |
| `argumentHint` | `string \| undefined` | no | Frontmatter |
| `arguments` | `string[] \| undefined` | no | Frontmatter |
| `disableModelInvocation` | `boolean` | yes | Frontmatter (default false) |
| `userInvocable` | `boolean` | yes | Frontmatter (default true) |
| `disallowedTools` | `string[] \| undefined` | no | Frontmatter |
| `model` | `string \| undefined` | no | Frontmatter |
| `effort` | `'low' \| 'medium' \| 'high' \| 'xhigh' \| 'max' \| undefined` | no | Frontmatter |
| `context` | `'fork' \| undefined` | no | Frontmatter |
| `agent` | `string \| undefined` | no | Frontmatter |
| `hooks` | `Record<string, unknown> \| undefined` | no | Frontmatter |
| `paths` | `string[] \| undefined` | no | Frontmatter |
| `shell` | `'bash' \| 'powershell' \| undefined` | no | Frontmatter |
| `metadata` | `Record<string, string> \| undefined` | no | Frontmatter |
| `tags` | `string[]` | yes | Derived (metadata.tags or keyword scan) |
| `providers` | `string[]` | yes | Derived (metadata.providers or inference) |
| `content` | `string` | yes | Markdown body after frontmatter |
| `assets` | `string[]` | yes | Files in scripts/, references/, assets/ |
| `sourceRepository` | `string` | yes | Absolute git root path |
| `sourcePath` | `string` | yes | Full path to SKILL.md |

### IndexedRepository

Defined in `apps/core/src/lib/catalog/domain/repository-registry/IndexedRepository.ts`:

| Field | Type | Purpose |
|-------|------|---------|
| `path` | `string` | Absolute filesystem path (unique) |
| `indexedAt` | `Date` | Last successful index timestamp |
| `lastStatus` | `'valid' \| 'missing' \| 'invalid'` | Current filesystem status |
| `type` | `'standalone' \| 'plugin' \| 'multi-plugin'` | Repository layout type |

## New Presentation Types

### SkillHeaderFields

Fields displayed in the page header. Always present.

```typescript
interface SkillHeaderFields {
  name: string;
  description: string;
  sourceRepository: string;
  isUserInvocable: boolean;
  isModelInvocationDisabled: boolean;
}
```

### SidebarField

Represents a single row in the metadata sidebar. Only present fields produce rows.

```typescript
type SidebarFieldKind = 'scalar' | 'list' | 'pills' | 'entries' | 'key-value' | 'object';

interface SidebarField {
  label: string;          // Human-readable field name (e.g., "License", "Allowed tools")
  kind: SidebarFieldKind; // Controls rendering: inline vs expandable vs pills
  value: string | string[] | Record<string, string> | Record<string, unknown>;
}
```

### SkillDetailView

The complete data structure passed to the detail page.

```typescript
interface SkillDetailView {
  skill: Skill;                    // The full skill entity
  header: SkillHeaderFields;       // Classified header fields
  sidebar: SidebarField[];         // Classified sidebar fields (only present ones)
  renderedMarkdown: string;        // Sanitized HTML from markdown rendering
  rawSource: string;               // Original SKILL.md content verbatim
  urlIdentifier: string;           // The URL-safe composite (base64url of repo path)
  indexedAt: Date | null;          // From IndexedRepository (null if repo missing)
}
```

### Error States

```typescript
type DetailPageError =
  | { type: 'not-found' }
  | { type: 'repo-unavailable'; repoPath: string }
  | { type: 'skill-removed'; skillName: string; repoPath: string };
```

## Field Classification Rules

`classifySkillFields(skill: Skill): { header: SkillHeaderFields; sidebar: SidebarField[] }`

### Header fields (always shown)

| Source | Target | Notes |
|--------|--------|-------|
| `skill.name` | `header.name` | |
| `skill.description` | `header.description` | |
| `skill.sourceRepository` | `header.sourceRepository` | |
| `skill.userInvocable` | `header.isUserInvocable` | → green badge |
| `skill.disableModelInvocation` | `header.isModelInvocationDisabled` | → amber badge |

### Sidebar fields (only when defined/non-empty)

| Source | Label | Kind | Condition |
|--------|-------|------|-----------|
| `skill.license` | "License" | `scalar` | `skill.license !== undefined` |
| `skill.compatibility` | "Compatibility" | `scalar` | `skill.compatibility !== undefined` |
| `skill.model` | "Model" | `scalar` | `skill.model !== undefined` |
| `skill.effort` | "Effort" | `scalar` | `skill.effort !== undefined` |
| `skill.context` | "Context" | `scalar` | `skill.context !== undefined` |
| `skill.agent` | "Agent" | `scalar` | `skill.agent !== undefined` |
| `skill.shell` | "Shell" | `scalar` | `skill.shell !== undefined` |
| `skill.argumentHint` | "Argument hint" | `scalar` | `skill.argumentHint !== undefined` |
| `skill.whenToUse` | "When to use" | `scalar` | `skill.whenToUse !== undefined` |
| `skill.allowedTools` | "Allowed tools" | `list` | `skill.allowedTools.length > 0` |
| `skill.disallowedTools` | "Disallowed tools" | `list` | `skill.disallowedTools.length > 0` |
| `skill.arguments` | "Arguments" | `list` | `skill.arguments.length > 0` |
| `skill.paths` | "Paths" | `list` | `skill.paths.length > 0` |
| `skill.tags` | "Tags" | `pills` | `skill.tags.length > 0` |
| `skill.providers` | "Providers" | `entries` | `skill.providers.length > 0` |
| `skill.hooks` | "Hooks" | `object` | `skill.hooks !== undefined` |
| `metadata.author` | "Author" | `scalar` | metadata has 'author' key |
| `metadata.version` | "Version" | `scalar` | metadata has 'version' key |
| `metadata.*` (any other) | key name | `scalar` | each remaining metadata entry |

### Sidebar display rules

- **scalar**: Plain text value in monospace font.
- **list**: Comma-separated inline if ≤3 items; collapsed/expandable `<details>` if >3.
- **pills**: Styled pill badges (matching existing skill card tag style).
- **entries**: Labeled provider entries.
- **object**: Collapsed JSON preview or "Yes" indicator.
- **key-value**: Each entry as a labeled row (for unknown metadata keys).

## State Transitions

No state transitions. The detail page is a read-only view. Error states are transient — the page shows an error message and the user navigates away.

## Relationships

```
IndexedRepository (path, indexedAt, lastStatus)
    │
    │ 1:0..1
    │
┌───┴──────────────────┐
│ Skill (from 002 spec) │
│  ├── sourceRepository │──→ matches IndexedRepository.path
│  ├── name             │──→ unique within repository
│  └── ...              │
└──────────────────────┘
    │
    │ 1:1 (on detail page)
    │
┌───┴──────────────┐
│ SkillDetailView  │
│  ├── header      │──→ SkillHeaderFields (classified)
│  ├── sidebar     │──→ SidebarField[] (classified, only present)
│  ├── rendered    │──→ sanitized HTML string
│  └── rawSource   │──→ verbatim SKILL.md string
└──────────────────┘
```
