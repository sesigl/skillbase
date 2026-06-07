---
description: Generate a new git worktree for a feature branch, copying environment files and installing dependencies.
---

## User Input

```text
$ARGUMENTS
```

## Objective

Create an isolated git worktree branched off `main` (or a specified base branch) for working on a feature independently. Copies `apps/core/.env` from the main tree so the new worktree is ready to run immediately.

## Execution

1. Parse `$ARGUMENTS` — the worktree name. Optionally a base branch as a second argument.
2. Run the script:

```bash
./scripts/create-worktree.sh $ARGUMENTS
```

3. Confirm success — the script will output the worktree directory path.

## Post-Creation

If the worktree was created successfully:

1. Open the worktree in a new OpenCode session or IDE window — most editors detect the new directory.
2. Verify the app starts:

```bash
cd <worktree-dir> && pnpm --filter @skillbase/core dev
```

3. When done, merge back with `/merge-worktree <branch-name>` or manually:

```bash
./scripts/merge-worktree.sh <branch-name>
```

## Speckit Integration

The `/speckit.specify` workflow automatically creates a worktree via its `before_specify` hook (which calls `/speckit.git.feature`). The worktree is branched off `main` with sequential or timestamp numbering. Use this manual `/worktree` command when you need a worktree outside the speckit flow.

## Example

```
/worktree add-skill-filtering
/worktree dev add-skill-filtering
```

First form branches off `main`. Second form branches off `dev`.
