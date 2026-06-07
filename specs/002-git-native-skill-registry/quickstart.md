# Quickstart: Git-Native Skill Registry

**Feature**: 002-git-native-skill-registry

## Index a Repository

```typescript
import { createCatalogUseCases } from '@lib/catalog/infrastructure/di';

const catalog = createCatalogUseCases();

const result = await catalog.indexRepository('/Users/you/team-skills');

if (result.status === 'valid') {
  console.log(`Indexed ${result.skills.length} skills`);
  for (const skill of result.skills) {
    console.log(`  - ${skill.name}: ${skill.description}`);
  }
} else {
  console.error('Validation failed:');
  for (const err of result.validationErrors) {
    console.error(`  ${err.file}: ${err.message}`);
  }
}
```

## Browse Skills

```typescript
const skills = await catalog.browseSkills();
for (const skill of skills) {
  console.log(`${skill.name} (${skill.sourceRepository})`);
}
```

## Search Skills

```typescript
const results = await catalog.searchSkills('deploy');
console.log(`${results.length} skills match "deploy"`);
```

## Manage Indexed Repositories

```typescript
// List all indexed repos
const repos = await catalog.listRepositories();
for (const repo of repos) {
  console.log(`${repo.path} — ${repo.lastStatus}`);
}

// Remove one
await catalog.removeRepository('/Users/you/old-repo');

// Clear all
await catalog.clearAll();
```

## Database Setup

```bash
cd apps/core
pnpm run migrate
```

This creates the `indexed_repositories` table. The old `skills` table migration is removed.

## Running Tests

```bash
# All catalog tests (filesystem + database)
pnpm --filter @skillbase/core test -- tests/catalog/

# Use case tests (integration)
pnpm --filter @skillbase/core test -- tests/lib/catalog/application/

# Schema tests (unit)
pnpm --filter @skillbase/core test -- tests/lib/shared/skill.test.ts
```
