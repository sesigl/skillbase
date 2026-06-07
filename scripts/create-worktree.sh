#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
DEFAULT_BASE="main"
BASE_BRANCH="${1:-$DEFAULT_BASE}"
WORKTREE_NAME="${2:-}"

if [[ -z "$WORKTREE_NAME" ]]; then
  echo "Usage: $0 [base-branch] <worktree-name>"
  echo ""
  echo "  base-branch   Branch to base the worktree on (default: main)"
  echo "  worktree-name Name for the new branch and worktree folder"
  echo ""
  echo "Examples:"
  echo "  $0 my-feature              # worktree from main"
  echo "  $0 some-branch my-feature  # worktree from some-branch"
  exit 1
fi

if [[ $# -eq 1 ]]; then
  WORKTREE_NAME="$1"
  BASE_BRANCH="$DEFAULT_BASE"
fi

WORKTREE_DIR="${REPO_ROOT}-${WORKTREE_NAME}"

if [[ -d "$WORKTREE_DIR" ]]; then
  echo "ERROR: Directory already exists: $WORKTREE_DIR"
  exit 1
fi

echo "Creating worktree..."
echo "  Base branch : $BASE_BRANCH"
echo "  New branch  : $WORKTREE_NAME"
echo "  Directory   : $WORKTREE_DIR"
echo ""

git worktree add -b "$WORKTREE_NAME" "$WORKTREE_DIR" "$BASE_BRANCH"

UNTRACKED_FILES=(
  "apps/core/.env"
)

echo ""
echo "Copying untracked files..."
for file in "${UNTRACKED_FILES[@]}"; do
  src="$REPO_ROOT/$file"
  dest="$WORKTREE_DIR/$file"
  if [[ -f "$src" ]]; then
    cp "$src" "$dest"
    echo "  copied $file"
  else
    echo "  skipped $file (not found in source)"
  fi
done

echo ""
echo "Installing dependencies..."
(cd "$WORKTREE_DIR" && pnpm install)

echo ""
echo "Worktree ready at: $WORKTREE_DIR"
echo "To remove later:   git worktree remove $WORKTREE_DIR"
