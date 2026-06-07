# Implementation Plan: Skill Detail Page

**Branch**: `003-skill-detail-page` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-skill-detail-page/spec.md`

## Summary

Add a dedicated skill detail page to the core app. Skills currently display as non-clickable cards on the main browse/search page. This feature makes each card a link to a dedicated page where the full skill is shown: rendered markdown content with design-system typography, structured frontmatter metadata (header identity + sidebar optional fields), a raw SKILL.md source tab, and supporting file listing. Tab switching is client-side with WAI-ARIA keyboard navigation. Error states distinguish "skill not found" from "repository unavailable" with recovery actions.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Astro 5.x SSR, Tailwind CSS 3.x, `marked` (markdown rendering), `isomorphic-dompurify` (XSS sanitization), `highlight.js` (code syntax highlighting)
**Storage**: PostgreSQL (repository registry — existing), local filesystem (skill source — existing)
**Testing**: Vitest
**Target Platform**: Server-rendered web application (Node.js), desktop browsers
**Project Type**: Web application (Astro SSR frontend within existing core app)
**Performance Goals**: Skill detail page load < 2 seconds for up to 100 KB markdown, tab switch < 100ms visual transition
**Constraints**: No client-side framework for v1 tab switching, server-rendered, zero page reloads on tab switch
**Scale/Scope**: 1 new Astro page route, 1 new component, 1 new repository method, 1 new use case, modifications to 2 existing components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Open-Source First & Self-Hostable | PASS | No new external dependencies — everything runs locally. `marked` and `isomorphic-dompurify` are open-source (MIT/Apache 2.0). |
| II. Monorepo Discipline | PASS | All changes confined to `apps/core/`. No new packages, no cross-app dependencies. |
| III. AI-Native Development | PASS | Spec and plan follow Spec Kit templates. Research decisions documented. Deterministic checks via `pnpm run verify`. |
| IV. TypeScript Everywhere | PASS | All new code in TypeScript (Astro `.astro` + `.ts`). Existing `strict: true` tsconfig applies. |
| V. Git-Native Skill Source | PASS | Skills read from filesystem repositories — no change to source model. Uses existing `FilesystemSkillRepository`. |
| VI. Usage Transparency | PASS | No impact — this is a read-only display feature. No invocation tracking changes. |
| VII. Deterministic Quality Gates | PASS | `pnpm run verify` covers all new code (Biome format/lint, `astro check`, Vitest tests). |
| VIII. DDD with Hexagonal Architecture | PASS | New `getSkill` use case in `application/`, `findByRepositoryAndName` on `SkillRepository` interface in `domain/`, implementation in `infrastructure/filesystem/`. Layer discipline preserved. |

**Gate result**: All principles pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-skill-detail-page/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── SkillDetailRoute.ts  # Route contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/core/
├── src/
│   ├── pages/
│   │   ├── index.astro                    # [MODIFY] Make SkillCard clickable
│   │   └── skill/
│   │       └── [repoEncoded]/
│   │           └── [skillName].astro      # [NEW] Skill detail page
│   ├── components/
│   │   ├── SkillCard.astro                # [MODIFY] Wrap in <a> link
│   │   ├── SkillDetailHeader.astro        # [NEW] Header section (name, desc, badges, repo)
│   │   ├── SkillDetailSidebar.astro       # [NEW] Sidebar (optional field key-value rows)
│   │   ├── SkillDetailTabs.astro          # [NEW] Tab container with WAI-ARIA
│   │   ├── SkillDetailOverview.astro      # [NEW] Rendered markdown + supporting files
│   │   ├── SkillDetailSource.astro        # [NEW] Raw SKILL.md code panel
│   │   ├── SkillNotFound.astro            # [NEW] 404/error states
│   │   └── RepositoryUnavailable.astro    # [NEW] Missing repo error state
│   └── lib/
│       └── catalog/
│           ├── domain/
│           │   └── skill/
│           │       └── SkillRepository.ts  # [MODIFY] Add findByRepositoryAndName()
│           ├── application/
│           │   ├── CatalogUseCases.ts      # [MODIFY] Add getSkill()
│           │   └── classifySkillFields.ts  # [NEW] Frontmatter classification logic
│           └── infrastructure/
│               ├── di.ts                   # [MODIFY] Update factory if needed
│               ├── adapters/
│               │   └── url-encoding.ts     # [NEW] Base64 encode/decode for URLs
│               └── filesystem/
│                   ├── FilesystemSkillRepository.ts  # [MODIFY] Implement findByRepositoryAndName()
└── tests/
    ├── catalog/
    │   ├── CatalogUseCases.test.ts         # [MODIFY] Add getSkill tests
    │   ├── FilesystemSkillRepository.test.ts  # [MODIFY] Add findByRepositoryAndName tests
    │   └── classifySkillFields.test.ts     # [NEW] Classification logic tests
    └── pages/
        └── skill-detail.test.ts            # [NEW] Page-level integration tests
```

**Structure Decision**: Single app (`apps/core/`). All changes follow the existing hexagonal architecture: domain interface → infrastructure implementation → application use cases → pages/components. No new packages or apps.

## Complexity Tracking

> No violations to justify.
