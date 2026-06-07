# Deterministic Checks — Authoring Guide

Skillbase uses a layered toolchain for deterministic checks. Each check
runs on every `pnpm run verify` and `pnpm run review`. Pick the right
tool for the job.

## Tool Comparison

| Concern | Biome rules | ast-grep | TypeScript script | ls-lint | knip |
|---------|-------------|----------|-------------------|---------|------|
| Code patterns (single file) | ★★★ if rule exists | ★★★ | ★★ | — | — |
| Cross-file / multi-file checks | — | ★★ | ★★★ | — | — |
| File/directory naming | — | — | ★★ | ★★★ | — |
| Dead code detection | — | — | ★ | — | ★★★ |
| Domain-specific invariants | — | ★★ | ★★★ | — | — |
| Speed | ★★★ | ★★★ | ★★ | ★★★ | ★★ |
| Expressiveness | ★ (built-ins only) | ★★ (AST only) | ★★★ (full Node.js) | ★ (paths only) | ★★ |
| Learning curve | ★★★ easy | ★★ moderate | ★ harder | ★★★ easy | ★★ moderate |

## Decision Flow

```
Does a Biome built-in rule cover this?
  → Yes: Configure it in biome.json. Done.
  → No:  Is it a structural code pattern within a single file?
           → Yes: Write an ast-grep YAML rule. Done.
           → No:  Is it a file/directory naming convention?
                    → Yes: Configure ls-lint. Done.
                    → No:  Is it about unused exports/deps?
                             → Yes: Run knip (configure knip.json if needed). Done.
                             → No:  Write a TypeScript check script.
```

## Biome Lint Rules

Biome's lint rules are the **first choice**. They're fast, AST-aware, and
auto-fixable.

**When to use:**
- Unused variables, unreachable code, duplicate code
- Unsafe expressions (assignments in conditions)
- Complexity limits (`noExcessiveCognitiveComplexity`)
- Deprecated APIs, type narrowing issues
- Style rules that need auto-fix

**How to configure:** Edit `biome.json` → `linter.rules`. Example:

```json
{
  "linter": {
    "rules": {
      "complexity": {
        "noExcessiveCognitiveComplexity": { "level": "error", "options": { "max": 15 } }
      }
    }
  }
}
```

**Pros:** No code to write, auto-fix, fast.  
**Cons:** Can't express domain-specific logic, no cross-file analysis.

## ast-grep

ast-grep matches **AST patterns** across files. Use it for structural
code patterns that Biome can't express — forbidden function calls, import
restrictions, decorator requirements, AST-level constraints.

**When to use:**
- Ban specific API calls in certain directories (e.g., `pool.query()` in
  use case tests)
- Enforce decorator usage (e.g., `@Transactional` on use case methods)
- Forbid import patterns (e.g., no `getTestPool` in use case tests)
- Enforce naming conventions on code structures (e.g., no underscore
  property names)

**How to create:**
1. Create a `.yml` rule in `ast-grep-rules/`
2. Reference it in `sgconfig.yml` (already configured: `ruleDirs: [ast-grep-rules]`)
3. Run `ast-grep scan` to test

**Template:**

```yaml
id: my-rule-name
language: TypeScript
severity: error
message: Short description of the violation.
note: |
  Longer explanation of WHY this is banned.
  Multi-line notes explain the reasoning and alternatives.
files:
  - "scope/**/*.ts"
ignores:
  - "scope/**/exception.test.ts"
rule:
  pattern: forbiddenCall($$$ARGS)
```

**For complex rules** (matching AST nodes with conditions):

```yaml
id: requires-decorator
language: TypeScript
severity: error
message: Method must be decorated.
files:
  - "src/**/*.ts"
rule:
  kind: method_definition
  not:
    follows:
      kind: decorator
  has:
    kind: call_expression
    has:
      kind: identifier
      regex: "^repositoryMethod$"
    stopBy: end
```

**Pros:** AST-aware (not regex), YAML declarative, fast batch scanning.  
**Cons:** AST mental model takes practice, limited to single-file analysis,
no file system operations.

## TypeScript Check Scripts

Write a custom script when you need file system traversal, cross-file
analysis, or complex conditional logic.

**When to use:**
- Folder structure conventions (e.g., tests must mirror `src/lib/...`)
- Cross-file relationships (e.g., migration JS must match SQL files)
- Custom linting with multiple conditions (e.g., architecture check,
  design system check)
- Checks that combine file content + file path logic

**Script conventions** (follow existing patterns in `scripts/checks/`):

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  file: string;
  message: string;
}

const APP_DIR = path.resolve(import.meta.dirname, '..', '..');
const violations: Violation[] = [];

function rel(filePath: string): string {
  return path.relative(APP_DIR, filePath);
}

// ... check logic pushing to violations ...

if (violations.length > 0) {
  console.error(`\nMy Check: ${violations.length} violation(s) found:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    ${v.message}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('My Check PASSED');
}
```

**Multiple checks in one script** — group violations by check type:

```typescript
const allViolations = [
  ...checkA(),
  ...checkB(),
];

const grouped = new Map<string, Violation[]>();
for (const v of allViolations) {
  const list = grouped.get(v.check) ?? [];
  list.push(v);
  grouped.set(v.check, list);
}

for (const [check, violations] of grouped) {
  console.error(`--- ${check} (${violations.length}) ---\n`);
  for (const v of violations) {
    console.error(`  ${v.message}\n`);
  }
}
```

**Pros:** Full Node.js power, cross-file analysis, any logic.  
**Cons:** Slower than declarative tools, regex can be fragile, must
handle edge cases manually.

## ls-lint

Declarative file and directory naming rules.

**When to use:**
- Enforce kebab-case for all file names
- Ban specific directory names or nesting patterns
- Enforce file extension conventions per directory

**How to configure:** Edit `.ls-lint.yml`. Example:

```yaml
ls:
  .ts: kebab-case
  .astro: kebab-case
ignore:
  - node_modules
  - dist
```

**Pros:** Declarative, fast, zero code.  
**Cons:** Only checks names, not content or structure.

## knip

Finds unused files, exports, and dependencies.

**When to use:** It's always on. Configure `knip.json` to:
- Add entry points that aren't auto-detected (e.g., test helpers)
- Ignore false positives (dev-only dependencies)
- Suppress specific unused exports

```json
{
  "entry": ["src/pages/**/*.{ts,astro}", "tests/helpers/testDatabase.ts"],
  "ignoreExportsUsedInFile": true
}
```

**Pros:** Purpose-built, catches real dead code.  
**Cons:** Can false-positive on dynamically resolved imports, needs
careful entry point configuration.

## Wiring a New Check

1. Create the check (Biome config, ast-grep rule, or TypeScript script)
2. Add a `check:*` script in `package.json`:

```json
{
  "scripts": {
    "check:my-check": "tsx scripts/checks/my-check.ts"
  }
}
```

3. Add to BOTH `review` and `verify` task sets in `scripts/verify.ts`:

```typescript
const TASK_SETS: Record<string, string[]> = {
  review: [
    // ... existing checks ...
    'check:my-check',
  ],
  verify: [
    // ... existing checks ...
    'check:my-check',
  ],
};
```

4. Run `pnpm run verify` from the repo root to confirm it passes (all
   green) and fails correctly (introduce a violation temporarily).

## Checklist

- [ ] Picked the right tool (Biome → ast-grep → TypeScript → ls-lint/knip)
- [ ] Check exits with code 1 on violations, code 0 on pass
- [ ] Error messages reference file paths with `path.relative()`
- [ ] Added to both `review` and `verify` task sets
- [ ] No regex for code structure (use ast-grep instead)
- [ ] No unnecessary I/O in check loops
- [ ] Passed `pnpm run verify` with zero failures
