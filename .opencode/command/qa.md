---
description: Execute after /review to test the full application end-to-end, catch regressions, and verify correctness.
---

**Role:** Lead QA & Implementation Engineer.
**Objective:** Verify all features implemented in the current tasks.md, fix detected issues via TDD, and produce a final summary. Do not stop until a full verification pass completes with zero issues.

---

## Phase 0: Environment Setup & Pre-Check

This phase must complete fully before any feature testing begins.

### Step 1 — Ensure PostgreSQL is running

```bash
docker compose up -d
```

Verify the database is reachable:

```bash
docker compose exec postgres pg_isready -U skillbase
```

Should return `accepting connections`. If not, wait and retry.

### Step 2 — Run migrations

```bash
pnpm --filter @skillbase/core migrate
```

### Step 3 — Start dev servers

```bash
./scripts/qa-start.sh
```

This single command:
1. Frees ports 4321 (core) and 4322 (landing-page) — aborts if it cannot
2. Starts both Astro dev servers in the background (logs → `apps/core/dev-server.log`, `apps/landing-page/dev-server.log`)
3. Polls until each server responds
4. Prints the last 15 log lines and flags any startup errors
5. Opens `http://localhost:4321` (core) and `http://localhost:4322` (landing-page) in your browser

### Step 4 — Verify servers loaded

Navigate to `http://localhost:4321` and confirm:
- The core app renders (not blank, no connection refused)
- The "skillbase" header is visible
- The search bar is present
- No dev server errors in console or log

Navigate to `http://localhost:4322` and confirm:
- The landing page renders
- Hero, features, and footer sections are visible
- No broken layouts or missing assets

Check for errors in server logs:

```bash
tail -20 apps/core/dev-server.log
tail -20 apps/landing-page/dev-server.log
```

> **Pre-check complete when:** docker is running, migrations applied, both servers respond, pages render cleanly.

---

## Phase 1: Automated Tests

Run all tests to catch regressions:

```bash
pnpm run qa
```

If any tests fail:
1. Read the failure output carefully.
2. Determine if the failure is a real regression or a test that needs updating.
3. If regression, proceed to Phase 3 (TDD Fix Protocol).
4. If test update needed, fix the test and re-run.

> **CRITICAL RULE: Every feature MUST be verified through the running app in the browser, even if it is a "backend-only" change.** Automated tests are not a substitute for manual QA. You must exercise the feature through the UI and observe actual behavior.

---

## Phase 2: Manual Testing (Recursive)

If *any* issue is found and fixed, restart testing of **all** features to catch regressions.

### For each feature/use case:

1. **In-App Functional Verification** — navigate to the relevant page and interact:
   - Core app (`http://localhost:4321`): test search (try "git", "frontend", "zzz"), verify results render correctly, verify empty state shows appropriate message.
   - Landing page (`http://localhost:4322`): verify all sections render, no broken links, responsive layout works.
2. **Database Validation** — after interactions that change state, query the DB:
   ```bash
   docker compose exec postgres psql -U skillbase -d skillbase -c "SELECT COUNT(*) FROM skills;"
   ```
3. **Visual Check** — verify the UI reflects expected state. No error messages, no broken layouts.
4. **Backend Monitoring** — check server logs for silent errors after each interaction:
   ```bash
   tail -20 apps/core/dev-server.log
   ```
5. **Issue Tracking** — after each use case, log findings:
   - **PASS** — what was tested, what you observed.
   - **ISSUE** — expected vs actual, error logs, severity.

### B. Issue Management

Anything that fails, behaves unexpectedly, or cannot be fully verified MUST be logged:

1. Create or update `issues.md` in the project root on the **first observation** — do not defer.
2. Log: Use Case, Expected vs Actual, Error Log snippet, severity (**ISSUE** / **OBSERVATION**).
3. **Do not fix immediately.** Finish the full manual pass to collect all issues first.

---

## Phase 3: TDD Fix Protocol

For each issue in `issues.md`:

1. **Write a failing test** at the use case or component level. Confirm it **fails** before proceeding.
2. **Implement the fix** following project conventions (DDD, no comments, simplicity).
3. **Run the test again.** Confirm it is **green** before proceeding.
4. Mark the issue as resolved in `issues.md`.

> **CRITICAL:** After all fixes, return to Phase 1 and re-run all tests, then Phase 2 for all features.

---

## Phase 4: Final Deliverable

Done only when all features pass in a single run with zero issues.

**Output a Final Summary Report:**
- **Verified Features** — checklist of what was tested.
- **Issue Log** — what broke, the regression test created, and how it was fixed.
- **Final Status** — confirmation that every feature is functional and verified.

---

## Quick Reference

| Task | Command |
|------|---------|
| Start PostgreSQL | `docker compose up -d` |
| Run migrations | `pnpm --filter @skillbase/core migrate` |
| Start servers | `./scripts/qa-start.sh` |
| Run tests | `pnpm run qa` |
| Check DB | `docker compose exec postgres psql -U skillbase -d skillbase` |
| Core logs | `tail -f apps/core/dev-server.log` |
| Landing logs | `tail -f apps/landing-page/dev-server.log` |
| Core URL | `http://localhost:4321` |
| Landing URL | `http://localhost:4322` |

---

## Pipeline Complete

This is the final step in the implementation pipeline: `/speckit.implement` → `/review` → `/qa`. All stages have passed.
