# Research: Skill Detail Page

**Feature**: 003-skill-detail-page
**Date**: 2026-06-07

## 1. URL Encoding for Filesystem Paths

**Decision**: Use URL-safe base64 encoding of the repository path, paired with the skill name in a dynamic Astro route: `/skill/[repoEncoded]/[skillName]`.

**Rationale**: Repository paths are absolute filesystem paths (e.g., `/Users/alice/work/plugin-repo`). They contain characters unsafe in URLs (`/`, potentially `:` on macOS). URL-safe base64 (RFC 4648, no padding) produces a clean, reversible encoding without percent-encoding overhead. Separating the encoded path from the skill name as two route segments allows the route to parse cleanly — `skillName` is already validated as `^[a-z0-9]+(-[a-z0-9]+)*$` (kebab-case), so it fits naturally as a URL segment without encoding.

**Alternatives considered**:
- **Single encoded composite** (e.g., `/skill/<base64(repo>name)>`): Simpler route but loses human readability of the skill name segment. Rejected — the unencoded skill name in the URL makes links more readable and debuggable.
- **Hash-based ID** (e.g., `/skill/<sha256>`): Adds a lookup step (hash → repo+name) and requires storing hashes or computing them on lookup. Rejected — unnecessary indirection.
- **Query params** (`/skill?repo=...&name=...`): Works but produces ugly shared links. Rejected — path segments are cleaner.

## 2. Markdown Rendering & Sanitization

**Decision**: Render markdown server-side using the `marked` library, then sanitize HTML output with `DOMPurify` (via `isomorphic-dompurify` for SSR compatibility).

**Rationale**: The spec requires (a) formatted markdown rendering with syntax-highlighted code blocks and (b) XSS sanitization (strip raw HTML, block unsafe URIs). `marked` is fast, Astro-compatible, and supports custom renderers for the design-system typography hooks (code block styling, `!`command`` pattern highlighting). `DOMPurify` is the industry-standard HTML sanitizer; `isomorphic-dompurify` provides the server-side API via `jsdom`. Both are tree-shakeable and add minimal bundle weight.

**Alternatives considered**:
- **Astro's built-in `.md` rendering**: Astro can import `.md` files, but our skills are dynamic (filesystem paths at request time, not known at build time). The content collection API doesn't fit this use case. Rejected.
- **`rehype` / `remark` pipeline**: More powerful but heavier and more complex to configure than `marked` for this use case. Overkill for rendering a single markdown body.
- **`sanitize-html`**: Lighter than DOMPurify but less actively maintained and has known bypasses in older versions. Rejected.

**Code block syntax highlighting**: Use `highlight.js` server-side. It integrates with `marked` via the `highlight` option, supports dozens of languages, and produces styled `<span>` elements that work with the design system's dark code panel. The design system's code panel already has background/border styles — only need to inject the syntax classes.

## 3. SKILL.md Raw Source Display

**Decision**: Display raw content server-rendered, with client-side YAML frontmatter syntax highlighting via a small (~200 byte) inline regex transform.

**Rationale**: The raw source needs to distinguish YAML frontmatter keys (lime) from values (default). This is a 3-line regex replacement on the frontmatter block before rendering: wrap keys in `<span class="yaml-key">` and the rest in standard code foreground. No library needed — the `---` delimiters are well-defined and the YAML structure is predictable (key: value per line). The markdown body below the closing `---` gets standard markdown syntax highlighting (or no highlighting — spec says "verbatim").

**Alternatives considered**:
- **Full YAML + markdown highlighting library** (e.g., `shiki`, `prism`): Heavy (~50+ KB) for a single code view that only needs two token types. Rejected.
- **Client-side rendering with `highlight.js`**: Would require shipping the library to the client for a single tab. Rejected — server-side is simpler.

## 4. Client-Side Tab Switching

**Decision**: Minimal client-side script using native DOM APIs (no framework). Tabs are server-rendered with both panels in the HTML; the script toggles `hidden` attributes and tab `aria-selected` state.

**Rationale**: The spec requires "minimal client-side behavior — no client-side framework." Both tab panels (Overview and SKILL.md) are server-rendered into the initial HTML. A small inline `<script>` (~500 bytes) manages tab state: click handlers toggle visibility, arrow keys follow WAI-ARIA tabs pattern. This avoids Framework overhead (SolidJS ~7KB gzipped) for a single interaction.

**Alternatives considered**:
- **SolidJS island**: The project already has SolidJS as a dependency for other features. Using a Solid island for tabs would be more maintainable for complex state but adds unnecessary weight for two-toggle visibility. Rejected — the spec explicitly forbids a client-side framework for v1.
- **CSS-only tabs** (`:target` or radio buttons): Works without JS but violates WAI-ARIA tabs pattern (no arrow-key switching). Rejected — accessibility requirement is explicit.

## 5. Skill Lookup via `findByRepositoryAndName`

**Decision**: Add `findByRepositoryAndName(repoPath: string, name: string)` to the `SkillRepository` interface and a corresponding `getSkill(repoPath, name)` use case in `CatalogUseCases`.

**Rationale**: The `SkillRepository` currently scans all indexed repos on every call. Adding a targeted lookup avoids re-scanning all repos when a user navigates to a single skill detail page. The implementation in `FilesystemSkillRepository` scans only the specified repository, validates its existence, and returns the single matching skill (or throws/returns null). This follows the existing pattern — `scanRepository` already knows how to scan a single repo.

**Alternatives considered**:
- **Use existing `findAll` + filter**: Simple but scans every indexed repo for every detail page request. Rejected — wasteful for the most common user flow.
- **Cache parsed skills in memory**: Adds cache invalidation complexity (re-index → invalidate). Rejected — the filesystem read is fast enough for v1 (SC-001: 2 seconds).

## 6. Repository Unavailability Detection on Detail Page

**Decision**: On the detail page, after resolving the encoded URL to `repoPath`, check `pathExists(repoPath)` before calling `findByRepositoryAndName`. If the path doesn't exist, look up the repository in the registry to confirm it was previously indexed, then show the "Repository unavailable" error with removal action.

**Rationale**: The spec requires distinct error states for "skill not found" vs "repository unavailable." The repository registry holds the indexed paths regardless of filesystem state. The flow: decode URL → check filesystem → if missing, check registry → if registered, show "Repository unavailable" with recovery actions; if not registered, show "Skill not found."

## 7. Frontmatter Field Classification

**Decision**: Frontmatter fields are classified at the use-case level into header, sidebar-list, and sidebar-value categories based on the clarified spec. The page template receives a data structure with explicit sections rather than raw Skill data.

**Rationale**: The spec defines a clear split: header (name, description, repository path, invocation badges) vs sidebar (everything else). This classification is business logic, not presentation — it lives in the application layer as a `classifySkillFields(skill: Skill)` function that returns `{ header: HeaderFields, sidebar: SidebarField[] }`. The page template simply renders the sections.

**Field classification**:

| Category | Fields |
|----------|--------|
| Header | `name`, `description`, `sourceRepository` |
| Header badges | `userInvocable`, `disableModelInvocation` |
| Sidebar (scalar) | `license`, `compatibility`, `model`, `effort`, `context`, `agent`, `shell`, `argumentHint`, `whenToUse`, `indexedAt` |
| Sidebar (list) | `allowedTools`, `disallowedTools`, `arguments`, `paths` |
| Sidebar (pill) | `tags` (from `metadata.tags`) |
| Sidebar (entry) | `providers` (from `metadata.providers`) |
| Sidebar (kv) | `metadata.*` (recognized: author, version; rest as raw key-value) |
| Sidebar (object) | `hooks` (rendered as JSON or "present" indicator) |
