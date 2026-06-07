# Core app — UI kit

High-fidelity recreation of the **Skillbase core application** — the skill
browser with search and analytics. Open `index.html` for the interactive browser.

## What's here
| File | Component |
|---|---|
| `data.js` | `window.SKILLS` sample data (mirrors the 5-skill seed + extras), `ALL_TAGS`, `ALL_AGENTS`, `ALL_LICENSES` |
| `Atoms.jsx` | `Logo`, `Icon`, `Button`, `Tag`, `Badge` |
| `AppBar.jsx` | `AppBar` — sticky top bar with inline search |
| `Browse.jsx` | `FilterRail` (agent / license / tag facets), `SkillCard`, `EmptyState` |
| `SkillDetail.jsx` | `SkillDetail` — header, copyable stats command, Overview / SKILL.md / Files tabs, metadata sidebar |

## Interactive flow
1. Land on **Browse skills** — skill inventory in a responsive card grid.
2. Type a term and submit → results filter (the `applied` query mimics the spec's
   server-side, URL-param search). Heading switches to "Search results".
3. Filter by agent, license, or tag in the rail; sort by invocations / recency.
4. A search with no matches shows the **empty state** with a reset path.
5. Click any card → **skill detail** with install command, manifest preview,
   file tree, and metadata. "Back to skills" returns to the grid.

## Notes
- Loads tokens from `../../colors_and_type.css`. Light theme; dark for code.
- Search/filter is client-side here for the prototype — production runs it
  server-side in Astro SSR against Postgres (per the spec).
- React 18 + Babel (pinned), Lucide icons via CDN.
