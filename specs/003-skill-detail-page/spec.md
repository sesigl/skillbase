# Feature Specification: Skill Detail Page

**Feature Branch**: `003-skill-detail-page`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "create a proper skill detail page. on the search site i want to be able to click on a skill, see the whole skill in well formatted markdonw, habe maybe a tab to see the sources (markdown raw), get nicely dispalyed frontmatter data (load the diesng system and FE skill). think how we dsiplay those, can be very different based on the need , if its optional or mandatory etc..."

## Clarifications

### Session 2026-06-07

- Q: How should the system look up a single skill for the detail page? The current SkillRepository only has `findAll` and `search`. → A: Add a `findByRepositoryAndName(repoPath, name)` method to `SkillRepository` and a corresponding `getSkill(repoPath, name)` use case. The composite key is the repository path + skill directory name — the same two fields already on the `Skill` entity (`sourceRepository` + `name`). The URL encodes this composite into a URL-safe format (exact encoding scheme is a planning-phase detail).
- Q: How many tabs and what are they called? → A: Two tabs: **Overview** (rendered markdown + structured frontmatter at the top + supporting file list as a section) and **SKILL.md** (raw source with syntax-aware highlighting). Frontmatter is displayed inline in the Overview — sidebar or header placement determined at design time. No separate "Files" tab; supporting files are a section within Overview.
- Q: Should rendered markdown be sanitized against XSS? → A: Yes. Raw HTML tags in skill markdown must be escaped or stripped, and unsafe URI schemes (e.g., `javascript:`) in links must be removed. Even though skills come from local files, this is a standard defense-in-depth practice.
- Q: Where do frontmatter fields live on the page — header vs sidebar? → A: **Header**: mandatory identity (name, description, repository path) + invocation badges. **Sidebar** (or inline metadata section): all optional frontmatter fields (license, compatibility, version, author, model, effort, etc.) rendered as labeled key-value rows, tags as pills, providers as entries, unknown metadata keys at the bottom. Exact pixel arrangement deferred to planning.
- Q: Should "skill not found" and "repository unavailable" show different error UX? → A: Yes, distinct states. **Skill not found**: "This skill does not exist or has been removed" + back-to-browse link. **Repository unavailable**: shows the missing repository path, a note that the skill was previously indexed, and two actions — "Remove from index" and "Go to browse".
- Q: How to display list-typed frontmatter fields (e.g., `allowed-tools`, `disallowed-tools`, `arguments`, `paths`)? → A: Adaptive display — compact comma-separated inline when ≤3 items, expandable/collapsed list when >3 items. If the list is empty or undefined, the field is hidden entirely (consistent with the "no empty placeholders" rule).
- Q: What level of keyboard accessibility for tab switching? → A: Full WAI-ARIA tabs pattern: arrow keys navigate between tabs, Enter/Space activates, Tab moves focus into the active panel. This is the standard web pattern and aligns with the design system's existing focus-ring requirement.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate from Search to Skill Detail (Priority: P1)

A user is browsing or searching skills on the core app's main page. They see a skill that interests them and click on its card. The page navigates to a dedicated skill detail page showing everything about that skill. They can return to the search results with a single back action.

**Why this priority**: This is the entry point — without navigation, the detail page is unreachable. It transforms the browse experience from a flat list into an explorable catalog.

**Independent Test**: Index a repository with known skills, open the main page, click a skill card, and verify the detail page loads showing that skill's information. Click the back button and verify return to the search results with the previous context preserved.

**Acceptance Scenarios**:

1. **Given** a user is viewing the main page with search results, **When** they click on a skill card, **Then** the browser navigates to a skill detail page for that specific skill, identified by a unique, URL-safe identifier in the address bar.
2. **Given** the user is on a skill detail page, **When** they click a "Back to skills" or browser back button, **Then** they return to the main page with their previous search query and scroll position preserved.
3. **Given** a user navigates directly to a skill detail URL (bookmark, shared link), **When** the page loads, **Then** the correct skill detail is displayed regardless of whether the user came from the search page.
4. **Given** a user navigates to a skill detail URL that does not correspond to any indexed skill, **When** the page loads, **Then** a clear "Skill not found" message is shown with a link back to the main browse page.

---

### User Story 2 - View Rendered Skill Content with Frontmatter (Priority: P1)

A user lands on a skill detail page. They see the skill's content rendered as formatted, readable markdown and all frontmatter fields presented in a structured, scannable layout. Mandatory fields (present on every skill) are always shown. Optional fields only appear when the skill defines them, so the user never sees empty placeholders. The layout adapts naturally to whatever combination of optional fields the skill author chose to include.

**Why this priority**: This is the core value of the detail page — actually reading and understanding a skill. Without this, the detail page is just a navigation shell.

**Independent Test**: Index a repository with a skill that has many optional fields populated (tags, providers, license, model, effort, hooks, paths, shell, compatibility). Open its detail page. Verify all populated fields are visible and empty fields are absent. Index another skill with only mandatory fields (name, description) and verify the detail page shows a clean, uncluttered view with only those fields.

**Acceptance Scenarios**:

1. **Given** a skill with all standard Claude Code frontmatter fields populated, **When** the user views the detail page, **Then** every non-empty field is displayed with a label and its value in a consistent visual hierarchy — name and description prominently at the top, invocation behavior (user-invocable, model-invocation-disabled) as badges, and supporting metadata (tags, providers, license, compatibility, allowed/disallowed tools) in a structured sidebar or metadata section.
2. **Given** a skill with only the mandatory fields (name, directory-derived identity, description from frontmatter or first paragraph), **When** the user views the detail page, **Then** only those fields are displayed — no empty sections, no "N/A" labels, no placeholder text.
3. **Given** a skill with markdown content containing headings, code blocks, lists, links, and inline commands (`` !`command` `` patterns), **When** the user views the detail page, **Then** all markdown is rendered with proper typography, syntax-highlighted code blocks, and styled links matching the Skillbase design system.
4. **Given** a skill that references supporting files (scripts, templates, references) in its markdown body, **When** the user views the detail page, **Then** those asset references are listed and, if they resolve to files in the skill directory, shown with their filenames and relative paths.
5. **Given** a skill with `metadata` extensions containing Skillbase-specific data (author, version, tags, providers), **When** the user views the detail page, **Then** those metadata values are extracted and displayed alongside standard frontmatter fields in the appropriate visual form (tags as pills, version as a badge, providers as labeled entries).

---

### User Story 3 - View Raw SKILL.md Source (Priority: P2)

A user wants to see the original `SKILL.md` file exactly as written — frontmatter and all. They switch to the "SKILL.md" tab that displays the raw content in a monospace code panel with basic syntax awareness (YAML frontmatter keys highlighted in electric lime, markdown content preserved verbatim).

**Why this priority**: This is a power-user feature. Most users only need the rendered view, but contributors who want to understand or replicate the `SKILL.md` format need the raw source. It is independently valuable but secondary to the rendered content view.

**Independent Test**: Open a skill detail page, switch to the "SKILL.md" tab, and verify the displayed content matches the actual `SKILL.md` file on disk byte-for-byte. Verify frontmatter keys are visually distinct from values and markdown body.

**Acceptance Scenarios**:

1. **Given** a skill detail page is open, **When** the user clicks the "SKILL.md" tab, **Then** the full raw content of the `SKILL.md` file is displayed in a dark code panel with monospace font, preserving all whitespace, line breaks, and original formatting.
2. **Given** the "SKILL.md" tab is active, **When** the user views the displayed content, **Then** YAML frontmatter delimiters (`---`) and keys are visually distinct from values — frontmatter keys use the electric lime accent, values use the standard code foreground color, and the markdown body follows standard syntax highlighting.
3. **Given** the "SKILL.md" tab is active, **When** the user clicks the "Overview" tab, **Then** the view switches back to the formatted markdown rendering with frontmatter and supporting files.

---

### Edge Cases

- **Skill with no description in frontmatter and no markdown body**: The description area shows the skill name as a fallback identifier. The rendered markdown area is empty. No error is shown — this is a valid (if sparse) skill.
- **Skill with only YAML frontmatter and no markdown body**: Only the "Overview" tab shows the structured frontmatter data. The rendered markdown area is empty (or not shown). The "Source" tab shows the raw YAML.
- **Skill with markdown body but empty frontmatter (no `---` delimiters)**: The entire file content is treated as markdown body. Frontmatter-dependent metadata sections (license, compatibility, etc.) are absent. The skill name is derived from the directory name.
- **Very long SKILL.md content**: For files exceeding a reasonable display threshold (~50 KB rendered), the detail page must still load and render correctly without excessive layout shift or browser performance issues.
- **Skill from a repository that is now missing on disk**: If the user navigates directly to a skill detail URL for a skill whose source repository has been deleted or moved, the page shows a "Repository unavailable" error with the repository path and a suggestion to re-index or remove it from the index.
- **Skill with duplicate name across repositories**: If two indexed repositories both have a skill with the same directory name, the URL identifier must distinguish them. Both detail pages are accessible via distinct URLs.
- **Skill with special characters in name**: Skills whose directory names contain characters outside the standard lowercase-alphanumeric-hyphen set (already validated out by the indexing process, but defensive handling) are still reachable and display correctly.
- **Skill with `disable-model-invocation: true` and `user-invocable: false`**: Both invocation restriction badges are shown. The combination is unusual but valid — the page displays what the skill declares without judgment.
- **Skill with external links in markdown**: Links to external URLs open in a new tab. Links to relative paths within the repository are shown but not clickable (since the repository files are not served).
- **Skill with embedded HTML or script content**: Any raw HTML tags or unsafe URI schemes (e.g., `<script>`, `javascript:`) in the markdown body are escaped or stripped during rendering to prevent cross-site scripting. The raw content in the "SKILL.md" tab is unaffected — only the rendered overview is sanitized.

## Requirements *(mandatory)*

### Functional Requirements

#### Navigation & Routing

- **FR-001**: Each indexed skill MUST be reachable via a unique, stable URL on the core app. The URL MUST incorporate a composite identifier that distinguishes skills even when their directory names are duplicated across repositories.
- **FR-002**: Skill cards on the main browse/search page MUST be clickable links that navigate to the skill's detail page.
- **FR-003**: The skill detail page MUST include a "Back to skills" navigation element that returns the user to the main page.
- **FR-004**: Direct navigation to a skill detail URL (via bookmark, shared link, or browser history) MUST render the correct skill without requiring prior interaction with the search page.
- **FR-005**: Navigating to a skill detail URL that does not correspond to any indexed skill MUST display a "Skill not found" error with the message "This skill does not exist or has been removed" and a link back to the main browse page. If the skill exists in the index but its source repository is unavailable (deleted/moved), a distinct "Repository unavailable" error must be shown with the missing repository path and two recovery actions: "Remove from index" and "Go to browse".
- **FR-006**: The system MUST support looking up a single skill by its repository path and skill directory name (`sourceRepository` + `name`) — the composite identity inherent in the existing data model. The URL-safe encoding of this composite into a route parameter is determined at planning time.

#### Rendered Content Display

- **FR-007**: The detail page MUST render the skill's markdown body as formatted content using proper typography (Space Grotesk headings, Geist body) matching the Skillbase design system.
- **FR-008**: Code blocks within the rendered markdown MUST use monospace font (JetBrains Mono) on a dark code-panel background with syntax highlighting that distinguishes comments, keywords, strings, and commands.
- **FR-009**: Headings, lists, links, and other standard markdown elements in the skill body MUST be rendered with appropriate typographic hierarchy consistent with the design system.
- **FR-010**: Inline command patterns (`` !`command` ``) within the rendered markdown MUST be visually distinguished (styled as inline code in a monospace face with accent coloring) to indicate they are dynamic context injections.

#### Frontmatter Display

- **FR-011**: Every non-empty frontmatter field from the Claude Code / Agent Skills specification MUST be displayed in a structured layout on the detail page.
- **FR-012**: Mandatory skill identity fields (name, description, source repository path) MUST always be visible in the page header area at the top of the detail page.
- **FR-013**: Optional frontmatter fields (license, compatibility, version, author, model, effort, context, agent, hooks, paths, shell, argument-hint, arguments, when-to-use) MUST only appear when the skill defines them — rendered in a sidebar or inline metadata section as labeled key-value rows. No empty sections, placeholder text, or "N/A" labels.
- **FR-014**: List-typed frontmatter fields (`allowed-tools`, `disallowed-tools`, `arguments`, `paths`) MUST display inline as comma-separated values when the list has 3 or fewer items, and as a collapsed/expandable list when longer than 3 items. Empty or undefined lists are hidden.
- **FR-015**: Tags and providers (from `metadata.tags` and `metadata.providers`) MUST appear in the same sidebar/metadata section as optional fields, rendered as pills (tags) and labeled entries (providers).
- **FR-016**: Boolean invocation flags (`user-invocable`, `disable-model-invocation`) MUST be displayed as colored badges in the page header alongside the skill name — green for user-invocable, amber for model-invocation-disabled — matching the existing skill card convention.
- **FR-017**: The `metadata` key-value map MUST be displayed in the sidebar/metadata section: Skillbase-recognized keys (author, version) are rendered in structured form, while unknown metadata keys are shown as labeled key-value pairs at the bottom of the section.

#### SKILL.md Tab

- **FR-018**: The detail page MUST include a "SKILL.md" tab that displays the raw, unmodified content of the `SKILL.md` file.
- **FR-019**: The raw source display MUST use a dark code panel background with monospace font and preserve all original whitespace and line breaks.
- **FR-020**: Within the raw source display, YAML frontmatter keys MUST be visually distinct from values — using the electric lime accent for keys and the standard code foreground for values.

#### Supporting Files

- **FR-021**: The detail page MUST list supporting files referenced by the skill (from its `assets` property — files in `scripts/`, `references/`, `assets/` directories relative to the `SKILL.md`).
- **FR-022**: Each listed supporting file MUST show the filename and its relative path within the skill directory.

#### Design System Compliance & Accessibility

- **FR-023**: The skill detail page MUST use the core-app dark theme and design tokens from the Skillbase design system.
- **FR-024**: All interactive elements (tabs, back button, links) MUST follow the design system's state rules: hover darkens borders/elevates, press scales to 0.98, focus shows a lime ring.
- **FR-025**: Typography MUST follow the design system hierarchy: Space Grotesk for headings, Geist for body/UI text, JetBrains Mono for skill names/repository paths/version/code/tags.
- **FR-026**: The tab interface MUST support keyboard navigation following the WAI-ARIA tabs pattern: arrow keys navigate between tab buttons, Enter/Space activates the selected tab, and Tab moves focus from the active tab button into the tab panel's content.

#### Security

- **FR-027**: Rendered markdown output MUST be sanitized to prevent cross-site scripting: raw HTML tags are escaped or stripped, and unsafe URI schemes (e.g., `javascript:`, `data:text/html`) in link `href` attributes are removed.

### Key Entities

- **Skill Detail View**: The composed presentation of a skill on its detail page. Combines the `Skill` entity (from spec 002) with additional rendering concerns: rendered markdown (HTML output of the markdown body), raw source (the original `SKILL.md` text), and a classification of frontmatter fields into mandatory vs optional groups for adaptive display.

- **Skill URL Identifier**: A composite key derived from the skill's source repository path and directory name, encoded into a URL-safe format that uniquely identifies a skill across all indexed repositories. Preserved across page loads and shareable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can click any skill card on the main page and reach its detail page with a single navigation action (page load under 2 seconds for a skill with up to 100 KB of markdown content).
- **SC-002**: Users can distinguish between mandatory and optional frontmatter fields at a glance — all present fields are shown, all absent fields are hidden, and the layout adapts without visual gaps.
- **SC-003**: The rendered markdown on the detail page is visually consistent with the design system: headings, code blocks, lists, and links all use the correct typography, colors, and spacing defined in the design tokens.
- **SC-004**: Switching between the "Overview" and "SKILL.md" tabs completes without a page reload (tab switching feels instant — under 100ms visual transition).
- **SC-005**: Direct navigation to a shared or bookmarked skill detail URL renders the correct skill content without errors, including for skills from repositories that have since been removed from disk (which show a clear error state).
- **SC-006**: A skill detail page for a minimally configured skill (name + description only) looks visually complete and not "broken" — no empty sections, no placeholder text, no layout collapse.

## Assumptions

- Skills are uniquely identified in URLs by a composite of repository path and skill directory name. The exact encoding scheme (e.g., base64 of the composite, or a URL-safe slug) is an implementation detail for the planning phase.
- The "Back to skills" navigation preserves the user's previous search query and scroll position. This is achieved via browser history (back button) or an explicit link — client-side state preservation is not required for v1; the browser's native back behavior is sufficient for query parameter preservation.
- Tab switching (Overview vs Source) is client-side only — all skill data is loaded once at page load. No API calls on tab switch.
- The skill detail page is rendered server-side, matching the existing core app rendering pattern. The raw markdown content and frontmatter are passed as page data, not fetched via client-side API calls.
- Supporting file listings show filenames and paths but do not allow viewing the file contents inline. Viewing supporting file contents is out of scope for v1.
- Skills with markdown exceeding 50 KB in size are considered an edge case — the page must work correctly but is not optimized for editor-like performance.
- The existing `indexedAt` timestamp on `IndexedRepository` serves as the "last updated" date shown in the metadata sidebar.
- The core app remains server-rendered. Tab switching uses minimal client-side behavior — no client-side framework is required for v1.
