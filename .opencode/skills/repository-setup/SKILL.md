---
name: repository-setup
description: Local development environment setup, prerequisites, and pre-commit checks. Use when onboarding a new contributor, setting up the repo from scratch, or troubleshooting local tooling.
license: MIT
compatibility: opencode
metadata:
  audience: contributors
  workflow: setup
---

# Repository Setup

## Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x (Corepack enabled: `corepack enable pnpm`)

## Quick Start

```bash
git clone <repo-url> skillbase
cd skillbase
pnpm install
```

The `prepare` script runs `husky` automatically on `pnpm install`, setting up
the following Git hooks:

| Hook           | Purpose                                                       |
|----------------|---------------------------------------------------------------|
| `commit-msg`   | Enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint` |

Pre-commit hooks (formatting, linting) and CI checks are added as tooling is
introduced in later increments.

## Verifying the Setup

```bash
echo "bad commit message" | npx commitlint --verbose
```

Should exit with a non-zero code and print the violation.

```bash
echo "feat: add skill search endpoint" | npx commitlint --verbose
```

Should pass.

## Troubleshooting

- **Husky hooks not running**: Run `pnpm run prepare` manually, then check
  `.husky/commit-msg` is executable (`chmod +x .husky/commit-msg`).
- **commitlint not found**: Run `pnpm install` to ensure devDependencies are
  installed.
