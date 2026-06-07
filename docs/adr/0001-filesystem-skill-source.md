# Read skills from filesystem, not PostgreSQL

**Context:** Skillbase originally stored parsed skills in a PostgreSQL `skills` table (migrations, seed data, `PostgresSkillRepository`). This required syncing from source repositories into the database — a separate step that could drift from the actual skill files on disk.

**Decision:** Remove the `skills` database table entirely. Skills are read directly from the filesystem on every list/search request, scanning all indexed repositories' `.claude/skills/` directories at query time. Only repository configuration (which paths to scan, when they were last indexed) is persisted in PostgreSQL.

**Why:** Skills already live as `SKILL.md` files on disk inside git repositories. Storing a copy in the database creates two sources of truth that must stay in sync. Reading from the filesystem means the data is always current — no sync step, no drift. The trade-off is losing SQL query capabilities (JOINs, aggregations, sorting by arbitrary fields) in exchange for zero-sync freshness. If query performance or cross-repo analytics become requirements later, a cache layer (in-memory or read-model projection) can be added without reintroducing a primary store.

**Alternatives considered:**
- **PostgreSQL as primary store with sync:** Every indexing would write parsed skills to the database. This enables rich queries but requires maintaining sync logic and risks stale data.
- **JSON file persistence:** Store both repo paths AND parsed skills in a plain file. Simpler than a database but doesn't scale for the config side (concurrent writes, querying).
