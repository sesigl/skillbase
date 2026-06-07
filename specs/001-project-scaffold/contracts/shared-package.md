# Contracts: Skillbase Project Scaffold

**Feature**: 001-project-scaffold
**Date**: 2026-06-04

## Package: `@skillbase/shared`

### Exports

The shared package exposes its contract via `package.json` `exports`:

```json
{
  "name": "@skillbase/shared",
  "exports": {
    ".": {
      "types": "./src/skill.ts",
      "import": "./src/skill.ts"
    },
    "./skill-format": {
      "types": "./src/skill-format.ts",
      "import": "./src/skill-format.ts"
    }
  }
}
```

### Contract: Skill Type & Schema

```typescript
import { z } from 'zod';

export const SkillSchema = z.object({
  name: z.string().min(1).max(100),
  author: z.string().min(1),
  description: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  tags: z.array(z.string().min(1)).min(1),
  providers: z.array(z.string().min(1)).min(1),
  license: z.string().min(1),
  homepage: z.string().url().optional(),
});

export type Skill = z.infer<typeof SkillSchema>;
```

### Contract: SkillFormat Type

```typescript
export interface SkillFormat {
  name: string;
  manifest: string;
  files: string[];
}
```

### Contract: Repository Interface (domain)

```typescript
import type { Skill } from '@skillbase/shared';

export interface SkillRepository {
  findAll(): Promise<Skill[]>;
  search(query: string): Promise<Skill[]>;
}
```

### Contract: CatalogUseCases (application)

```typescript
import type { Skill } from '@skillbase/shared';

export interface CatalogUseCases {
  browseSkills(): Promise<Skill[]>;
  searchSkills(query: string): Promise<Skill[]>;
}
```

### Consumers

| Consumer | Import | Usage |
|----------|--------|-------|
| `apps/core` | `import { type Skill, SkillSchema } from '@skillbase/shared'` | Domain entity type, validation |
| `apps/core` | `import { type SkillFormat } from '@skillbase/shared/skill-format'` | Skill format type |
| `apps/landing-page` | `import { type Skill } from '@skillbase/shared'` | Display featured skills (future) |

### Dependency Direction

```
apps/core ──→ @skillbase/shared
apps/landing-page ──→ @skillbase/shared
apps/core ←×→ apps/landing-page  (no direct dependency)
```

### Test Contracts

```typescript
// packages/shared/src/skill.test.ts
import { describe, it, expect } from 'vitest';
import { SkillSchema } from './skill';

describe('SkillSchema', () => {
  it('validates a complete skill', () => {
    const result = SkillSchema.safeParse(validSkill);
    expect(result.success).toBe(true);
  });

  it('rejects skill with empty name', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects skill with invalid version', () => {
    const result = SkillSchema.safeParse({ ...validSkill, version: 'not-semver' });
    expect(result.success).toBe(false);
  });

  it('rejects skill with empty tags array', () => {
    const result = SkillSchema.safeParse({ ...validSkill, tags: [] });
    expect(result.success).toBe(false);
  });

  it('accepts skill without homepage', () => {
    const { homepage, ...rest } = validSkill;
    const result = SkillSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });
});
```

### Architecture Boundary Contract (dependency-cruiser)

```javascript
// apps/core/.dependency-cruiser.cjs (key rules)
module.exports = {
  forbidden: [
    {
      name: 'pages-cannot-import-infrastructure',
      from: { path: '^src/pages/' },
      to: { path: '^src/lib/.*/infrastructure/' },
    },
    {
      name: 'only-transaction-can-import-database',
      from: { pathNot: '^src/lib/shared/infrastructure/persistence/(TransactionContext|Transactional)' },
      to: { path: '^src/lib/shared/database' },
    },
    {
      name: 'domain-cannot-import-infrastructure',
      from: { path: '^src/lib/.*/domain/' },
      to: { path: '^src/lib/' },
      from: { path: '^src/lib/.*/domain/' },
      to: { pathNot: '^src/lib/.*/domain/|^src/lib/shared/database|@skillbase/shared' },
    },
  ],
};
```
