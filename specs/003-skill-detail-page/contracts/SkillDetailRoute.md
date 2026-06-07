# Skill Detail Route Contract

**Feature**: 003-skill-detail-page
**Path**: `GET /skill/[repoEncoded]/[skillName]`

## Route Definition

```
GET /skill/:repoEncoded/:skillName
```

| Parameter | Type | Encoding | Example |
|-----------|------|----------|---------|
| `repoEncoded` | string (route segment) | URL-safe base64 (RFC 4648, no padding) of absolute repository path | `L1VzZXJzL2FsaWNlL3dvcmtlc3BhY2UvcGx1Z2luLXJlcG8` |
| `skillName` | string (route segment) | Plain, no encoding (already kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`) | `deploy`, `commit-helper`, `pr-describer` |

## URL Construction

```typescript
// From Skill entity to URL path
function skillToUrlPath(skill: Skill): string {
  const encoded = toBase64Url(skill.sourceRepository);
  return `/skill/${encoded}/${skill.name}`;
}

// From URL path to repo + name
function urlPathToSkillIdentifier(repoEncoded: string, skillName: string): { repoPath: string; name: string } {
  const repoPath = fromBase64Url(repoEncoded);
  return { repoPath, name: skillName };
}
```

## Response States

### 200 OK — Skill Found

Renders the full skill detail page with two tabs (Overview, SKILL.md).

**Page props (Astro)**:
```typescript
interface SkillDetailPageProps {
  view: SkillDetailView;  // From data-model.md
}
```

### 404 — Skill Not Found

**Triggered when**:
- The URL decodes to a repo path that is NOT in the indexed repository registry
- The URL decodes to a repo path that IS indexed but contains no skill with `skillName`

**Renders**: `SkillNotFound.astro` with message "This skill does not exist or has been removed" and a `Back to browse` link.

### 404 — Repository Unavailable

**Triggered when**:
- The URL decodes to a repo path that IS in the registry but the path no longer exists on disk

**Renders**: `RepositoryUnavailable.astro` with:
- Missing repository path displayed
- Message: "The repository containing this skill is no longer available at `<path>`. It was indexed on `<date>`."
- Two actions: "Remove from index" (POST to existing remove action) and "Go to browse" (link to `/`)

## Data Flow

```
Browser                     Astro Server                    Domain/Infrastructure
  │                             │                               │
  │ GET /skill/<enc>/<name>     │                               │
  │────────────────────────────>│                               │
  │                             │ fromBase64Url(repoEncoded)    │
  │                             │ skillExists on disk?          │
  │                             │──────────────────────────────>│ (pathExists)
  │                             │ <─────────────────────────────│
  │                             │                               │
  │                             │ [if path missing]             │
  │                             │ check registry for path       │
  │                             │──────────────────────────────>│ registry.findByPath()
  │                             │ <─────────────────────────────│ registered? yes/no
  │                             │ → 404 RepoUnavailable         │
  │                             │   or 404 SkillNotFound        │
  │                             │                               │
  │                             │ [if path exists]              │
  │                             │ getSkill(repoPath, name)      │
  │                             │──────────────────────────────>│ skillRepo.findByRepositoryAndName()
  │                             │ <─────────────────────────────│ Skill | null
  │                             │                               │
  │                             │ [if skill null]               │
  │                             │ → 404 SkillNotFound           │
  │                             │                               │
  │                             │ [if skill found]              │
  │                             │ classifySkillFields(skill)    │
  │                             │ renderMarkdown(skill.content) │
  │                             │ sanitize(html)                │
  │                             │ → 200 SkillDetailView page    │
  │ <────────────────────────────│                              │
  │                             │                               │
  │ [user clicks "SKILL.md" tab]│                               │
  │ (client-side, no request)   │                               │
```

## Tab Contract

Tabs are entirely client-side. Both panel contents are present in the initial server-rendered HTML.

**Markup structure** (WAI-ARIA tabs pattern):
```html
<div class="tabs" role="tablist" aria-label="Skill content">
  <button role="tab" aria-selected="true" aria-controls="panel-overview" id="tab-overview">
    Overview
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-source" id="tab-source" tabindex="-1">
    SKILL.md
  </button>
</div>
<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
  <!-- Rendered markdown + frontmatter header + files -->
</div>
<div role="tabpanel" id="panel-source" aria-labelledby="tab-source" hidden>
  <!-- Raw SKILL.md code panel -->
</div>
```

**Keyboard behavior**:
- `Tab` focuses into the active tab from outside
- `Left Arrow / Right Arrow` moves focus between tabs
- `Enter / Space` activates (shows) the focused tab
- `Tab` from active tab moves focus into the visible panel

## Error Recovery Actions Contract

### "Remove from index" (on Repository Unavailable page)

```
POST / (same as existing removeRepository action)
Content-Type: application/x-www-form-urlencoded

action=remove&path=<repositoryPath>
```

After removal, redirects to GET `/` (main browse page). Existing `actions/index.ts` already handles this.

### "Go to browse" (on all error pages)

Simple `<a href="/">` link — no state preservation needed.

## Encoding Contract

```typescript
// apps/core/src/lib/catalog/infrastructure/adapters/url-encoding.ts
export function toBase64Url(input: string): string;
export function fromBase64Url(encoded: string): string;
```

- `toBase64Url`: Encodes UTF-8 bytes as URL-safe base64 (no padding `=`).
- `fromBase64Url`: Decodes URL-safe base64 back to the original string.
- Uses Node.js `Buffer` APIs on the server.
- No client-side encoding/decoding needed — all happens server-side in the Astro page's frontmatter or use case layer.
