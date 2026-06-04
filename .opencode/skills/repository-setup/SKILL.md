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

- **[nodenv](https://github.com/nodenv/nodenv)** (recommended) or any Node.js version manager.
- **Node.js**: exact version defined in `.node-version`. Install via:
  ```bash
  nodenv install
  ```
- **pnpm**: version pinned in `package.json` under `packageManager`. Node 25+
  no longer ships Corepack; install pnpm globally instead:
  ```bash
  npm install -g pnpm@11.5.1
  ```

## Quick Start

```bash
git clone git@github.com:sesigl/skillbase.git
cd skillbase
nodenv install                        # installs the Node version from .node-version
npm install -g pnpm@11.5.1           # install pinned pnpm version globally
pnpm install
```

The `prepare` script runs `husky` automatically on `pnpm install`, setting up
the following Git hooks:

| Hook           | Purpose                                                       |
|----------------|---------------------------------------------------------------|
| `commit-msg`   | Enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint` |

Pre-commit hooks (formatting, linting) and CI checks are added as tooling is
introduced in later increments.

## Verifying Commitlint

```bash
echo "bad commit message" | npx commitlint --verbose    # should fail
echo "feat: add skill search endpoint" | npx commitlint --verbose  # should pass
```

## Supply-Chain Security

pnpm v11 includes built-in protections configured in `pnpm-workspace.yaml`:

| Setting                    | Value   | Effect                                          |
|----------------------------|---------|-------------------------------------------------|
| `saveExact`                | `true`  | Saves exact versions — no `^` or `~` ranges      |
| `engineStrict`             | `true`  | Fails install if a dependency is incompatible     |
| `minimumReleaseAge`        | `1440`  | 1-day delay before new versions (v11 default)     |
| `blockExoticSubdeps`       | `true`  | Blocks transitive deps from git/tarball (v11 default) |
| Postinstall scripts        | blocked | Only allowed for explicitly trusted packages      |

Verify settings are active:

```bash
pnpm config get save-exact       # true
pnpm config get engine-strict    # true
```

## Troubleshooting

- **Husky hooks not running**: Run `pnpm run prepare` manually, then check
  `.husky/commit-msg` is executable (`chmod +x .husky/commit-msg`).
- **commitlint not found**: Run `pnpm install` to ensure devDependencies are
  installed.
