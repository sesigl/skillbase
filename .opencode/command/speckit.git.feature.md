---
description: Create a git worktree for a new feature with sequential or timestamp numbering
---

<!-- Extension: git -->
<!-- Config: .specify/extensions/git/ -->
# Create Feature Worktree

Create a new git worktree (branch + isolated directory) for the given specification. This command handles **worktree creation only** — the spec directory and files are created by the core `/speckit.specify` workflow.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Environment Variable Override

If the user explicitly provided `GIT_BRANCH_NAME` (e.g., via environment variable, argument, or in their request), use it as the worktree/branch name, bypassing all prefix/suffix generation. When `GIT_BRANCH_NAME` is set:

- Use the exact value as `BRANCH_NAME`
- `FEATURE_NUM` is extracted from the name if it starts with a numeric prefix, otherwise set to the full branch name

## Prerequisites

Run `git rev-parse --is-inside-work-tree 2>/dev/null`. If it fails, warn the user and skip worktree creation.

## Branch Numbering Mode

Determine numbering strategy:

1. Check `.specify/extensions/git/git-config.yml` for `branch_numbering` value
2. Default to `sequential` if not found

## Execution

### 1. Generate short name

Generate a concise short name (2-4 words) from the feature description:
- Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
- Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
- Lowercase, hyphen-separated

### 2. Determine full branch name

**If `GIT_BRANCH_NAME` is set:**
- `BRANCH_NAME` = the provided value
- Extract `FEATURE_NUM` from it (first numeric segment before `-`, or the full name if no numeric prefix)

**Otherwise:**

| Mode | How to determine `FEATURE_NUM` |
|------|-------------------------------|
| `sequential` | Run `ls specs/ 2>/dev/null \| grep -E '^[0-9]{3,}-' \| grep -vE '^[0-9]{8}-[0-9]{6}-' \| sed 's/-.*//' \| sort -n \| tail -1`. If empty, use `0`. Then `FEATURE_NUM` = `$(printf "%03d" $((<highest> + 1)))` |
| `timestamp` | Run `date +%Y%m%d-%H%M%S` |

`BRANCH_NAME` = `FEATURE_NUM`-`<short-name>`

### 3. Create the worktree

```bash
./scripts/create-worktree.sh <BRANCH_NAME>
```

The script:
- Creates a git worktree branched off `main` at `$REPO_ROOT-<BRANCH_NAME>`
- Copies `apps/core/.env` from the main tree
- Runs `pnpm install` in the worktree

### 4. Output

Emit JSON with these keys so downstream commands can reference the branch:

```json
{"BRANCH_NAME": "<name>", "FEATURE_NUM": "<num>", "WORKTREE_DIR": "<absolute path to worktree>"}
```

After creation, tell the user:
- The worktree directory path
- To open the worktree in their editor/terminal
- To merge back with `./scripts/merge-worktree.sh <BRANCH_NAME>` when done

## Graceful Degradation

If Git is not installed or the current directory is not a Git repository:
- Worktree creation is skipped with a warning: `[specify] Warning: Git repository not detected; skipped worktree creation`
- Still output `BRANCH_NAME` and `FEATURE_NUM` so downstream commands can reference them
