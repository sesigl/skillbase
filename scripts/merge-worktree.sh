#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
BRANCH="${1:-}"

if [[ -z "$BRANCH" ]]; then
  echo "Usage: $0 <branch-name>"
  echo ""
  echo "  branch-name   The feature branch / worktree name to merge into main"
  echo ""
  echo "Examples:"
  echo "  $0 039-landing-page-revamp"
  exit 1
fi

WORKTREE_DIR="${REPO_ROOT}-${BRANCH}"
CURRENT_BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Switching to main..."
  git -C "$REPO_ROOT" checkout main
fi

echo "Merging $BRANCH into main..."
git -C "$REPO_ROOT" merge "$BRANCH" --no-ff -m "feat: merge $BRANCH into main"

echo "Removing worktree..."
if git -C "$REPO_ROOT" worktree list | grep -q "$WORKTREE_DIR"; then
  git -C "$REPO_ROOT" worktree remove --force "$WORKTREE_DIR" || true
fi

if [[ -d "$WORKTREE_DIR" ]]; then
  rm -rf "$WORKTREE_DIR"
  echo "  removed directory: $WORKTREE_DIR"
fi

echo "Deleting branch $BRANCH..."
git -C "$REPO_ROOT" branch -d "$BRANCH"

echo ""
echo "Done. $BRANCH merged into main and worktree removed."
