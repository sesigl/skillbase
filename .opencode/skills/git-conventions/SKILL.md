---
name: git-conventions
description: Conventional Commits enforcement via commitlint + Husky. Use when creating commits, writing commit messages, or setting up git hooks. Ensures commits follow the Conventional Commits spec with skillbase-specific types and commit message conventions.
license: MIT
compatibility: opencode
metadata:
  audience: contributors
  workflow: git
---

# Git Conventions

## Conventional Commits

All commits in this repository MUST follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification.

A `commit-msg` Husky hook runs `commitlint --edit $1` on every commit and
rejects non-conforming messages.

### Format

```
<type>[(optional scope)]: <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type       | Purpose                                      |
|------------|----------------------------------------------|
| `feat`     | New feature or user-facing change            |
| `fix`      | Bug fix                                      |
| `docs`     | Documentation only                           |
| `style`    | Formatting, whitespace, missing semicolons   |
| `refactor` | Code change that neither fixes nor adds feat |
| `perf`     | Performance improvement                      |
| `test`     | Adding or correcting tests                   |
| `build`    | Build system or external dependencies        |
| `ci`       | CI/CD pipeline changes                       |
| `chore`    | Other maintenance tasks                      |
| `content`  | Content changes (landing page, blog, etc.)   |
| `revert`   | Reverts a previous commit                    |

### Examples

```
feat: add skill search endpoint
fix(core): handle empty skill directory
docs: amend constitution to v1.0.0
ci: add GitHub Actions workflow
content(landing): update hero copy
```

### Commit Message Conventions

- When the changeset improves the repo for future AI usage (AGENTS.md,
  skills, `.opencode/` config, spec templates), use `chore(ai):` as the type.
- For bug fixes, use `fix` as the type.
- For new features, use `feat` as the type.
- For breaking changes, add `!` after the type (e.g. `feat!:` or
  `fix(scope)!:`) and provide a clear description of the breaking change
  in the commit message body.
- Always provide a clear and concise description of the changes made in
  the commit message body.

### Enforcement

Configured in `commitlint.config.js` (root). The `commit-msg` hook at
`.husky/commit-msg` invokes `commitlint` on every commit. The hook runs
in CI as well (see `.ci/` workflows).

### Setup for New Contributors

The `prepare` script in `package.json` runs `husky` on `npm install`,
so hooks are automatically set up. No manual steps needed.
