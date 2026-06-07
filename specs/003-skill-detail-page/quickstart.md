# Quickstart: Skill Detail Page

**Feature**: 003-skill-detail-page
**Date**: 2026-06-07

## Prerequisites

- The core app is running (`pnpm --filter @skillbase/core dev`)
- At least one repository has been indexed via the main page (`/`)
- The indexed repository contains at least one valid skill (`.claude/skills/<skill-name>/SKILL.md`)

## Testing the Feature

### Manual verification

1. Open `http://localhost:4321/` (core app)
2. Index a repository if none are listed: enter a path like `/path/to/my-claude-skills-repo` and click "Index"
3. Click on any skill card → should navigate to `/skill/<encoded-repo>/<skill-name>`
4. Verify the detail page shows:
   - **Header**: skill name (monospace, lime accent), description, repository path, invocation badges
   - **Sidebar**: tags as pills, license, providers, and any other populated optional fields
   - **Overview tab**: rendered markdown with design-system typography
   - **SKILL.md tab**: raw source with lime-highlighted YAML keys
5. Click "Back to skills" → returns to main page with search preserved
6. Navigate to a non-existent skill URL → shows "Skill not found"
7. Navigate to a skill from a deleted repository → shows "Repository unavailable"

### Automated tests

```bash
# Run all tests
pnpm run verify

# Run only skill detail page tests
pnpm --filter @skillbase/core exec vitest run tests/catalog/classifySkillFields.test.ts
pnpm --filter @skillbase/core exec vitest run tests/pages/skill-detail.test.ts

# Run existing catalog tests (regression check)
pnpm --filter @skillbase/core exec vitest run tests/catalog/
```

### Key test scenarios

| Test | What it verifies |
|------|-----------------|
| `classifySkillFields.test.ts` | Correct classification into header/sidebar for various skill configs |
| `FilesystemSkillRepository.test.ts` (findByRepositoryAndName) | Lookup by repo+name returns correct skill, null for missing |
| `CatalogUseCases.test.ts` (getSkill) | Use case delegates correctly, handles missing repo |
| `skill-detail.test.ts` | Page renders with both tabs, error states, WAI-ARIA markup |

### URL encoding quick check

```typescript
import { toBase64Url, fromBase64Url } from './url-encoding';

const repoPath = '/Users/alice/my-skills';
const encoded = toBase64Url(repoPath);
// encoded: "L1VzZXJzL2FsaWNlL215LXNraWxscw"
const decoded = fromBase64Url(encoded);
// decoded === repoPath
```

## File Checklist

### New files
- [ ] `apps/core/src/pages/skill/[repoEncoded]/[skillName].astro`
- [ ] `apps/core/src/components/SkillDetailHeader.astro`
- [ ] `apps/core/src/components/SkillDetailSidebar.astro`
- [ ] `apps/core/src/components/SkillDetailTabs.astro`
- [ ] `apps/core/src/components/SkillDetailOverview.astro`
- [ ] `apps/core/src/components/SkillDetailSource.astro`
- [ ] `apps/core/src/components/SkillNotFound.astro`
- [ ] `apps/core/src/components/RepositoryUnavailable.astro`
- [ ] `apps/core/src/lib/catalog/application/classifySkillFields.ts`
- [ ] `apps/core/src/lib/catalog/infrastructure/adapters/url-encoding.ts`
- [ ] `apps/core/tests/catalog/classifySkillFields.test.ts`
- [ ] `apps/core/tests/pages/skill-detail.test.ts`

### Modified files
- [ ] `apps/core/src/pages/index.astro` — SkillCard links
- [ ] `apps/core/src/components/SkillCard.astro` — wrap in `<a>`
- [ ] `apps/core/src/lib/catalog/domain/skill/SkillRepository.ts` — add `findByRepositoryAndName()`
- [ ] `apps/core/src/lib/catalog/application/CatalogUseCases.ts` — add `getSkill()`
- [ ] `apps/core/src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository.ts` — implement `findByRepositoryAndName()`
- [ ] `apps/core/tests/catalog/CatalogUseCases.test.ts` — add `getSkill` tests
- [ ] `apps/core/tests/catalog/FilesystemSkillRepository.test.ts` — add `findByRepositoryAndName` tests

## Dependencies to add

```bash
pnpm --filter @skillbase/core add marked isomorphic-dompurify highlight.js
pnpm --filter @skillbase/core add -D @types/dompurify
```
