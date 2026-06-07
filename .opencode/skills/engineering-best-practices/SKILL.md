---
name: engineering-best-practices
description: Defensive engineering patterns for null-safety, immutability, and data integrity. Use when reviewing code, designing APIs, or modeling data to avoid common pitfalls around null/undefined, optional properties, and database constraints.
license: MIT
compatibility: opencode
metadata:
  audience: contributors
  workflow: code-review
---

# Engineering Best Practices

## 1. Null-Safety & Avoiding Optionality

Prefer designs that eliminate null/undefined at the boundary, not propagate it.

### Rule of thumb

If a property is declared optional (or `| null` / `| undefined`), ask: **can the absence case be eliminated by design?**

### Techniques

#### a) Empty list over null

Instead of `items: T[] | null` or `items?: T[]`, always use `items: T[]` and initialize with `[]`. An empty list means "no items" — zero, one, or many are all valid.

```typescript
// BAD
interface Folder {
  files: File[] | null
}

// GOOD
interface Folder {
  files: File[]
}
```

#### b) Null Object pattern

Instead of `user: User | null`, provide a `NullUser` / `AnonymousUser` that satisfies the same contract.

```typescript
// BAD
function getAuthor(): Author | null { ... }

// GOOD
const ANONYMOUS: Author = { name: "Anonymous", avatar: defaultAvatar }
function getAuthor(): Author { ... }
```

#### c) Don't allow it at all

If a value is always one of `A`, `B`, or `C`, model it as a union — never add `null` as a fourth variant.

```typescript
// BAD
type Status = "active" | "inactive" | "suspended" | null

// GOOD
type Status = "active" | "inactive" | "suspended"
```

### Database-level enforcement

- Use `NOT NULL` columns and `CHECK` constraints to guarantee data integrity at the storage layer.
- When migrations add a new required column to an existing table, use a multi-step migration: add nullable, backfill data, then set `NOT NULL`.
- Delete stale data instead of soft-setting to `NULL`. Update records in place — new data replaces old data, it never gaps into null.

### When null IS appropriate

Null is valid when absence carries **domain meaning distinct from emptiness**:
- "not yet set" vs "intentionally empty"
- "loading" vs "loaded with no results"
- An optional callback that truly is optional

In these cases, make the distinction explicit in the type (e.g., a discriminated union, not a bare `| null`).

## 2. Immutability by Default

- Prefer `readonly` arrays and objects in function signatures.
- Use spread/`concat`/`map` instead of `push`/`splice`/`sort` in-place.
- Freeze deeply when crossing trust boundaries.

## 3. Exhaustiveness

- Every `switch` on a discriminated union must cover all variants or have a `default: never` assertion.
- Use TypeScript's `noUncheckedIndexedAccess` where feasible.

## 4. Database Migrations

- Every up migration must have a matching down migration.
- Seed migrations must be idempotent (`ON CONFLICT DO NOTHING`).
- Use database constraints (`NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY`) aggressively — they are the last line of defense.
