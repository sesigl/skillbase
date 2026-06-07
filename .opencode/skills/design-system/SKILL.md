---
name: skillbase-design
description: Use this skill to generate well-branded interfaces and assets for Skillbase — a governance and analytics tool for AI coding skills — either for production or throwaway prototypes/mocks. Contains essential design guidelines, color & type tokens, fonts, logo assets, iconography rules, and UI-kit components for the product site and the core skill-browser app.
user-invocable: true
---

# Skillbase Design

Read `README.md` in this skill for the full system: brand overview, content
fundamentals (voice, casing, no-emoji rule), visual foundations (paper + ink +
electric-lime accent, Space Grotesk / Geist / JetBrains Mono, spacing, radii,
shadows, motion, states), and iconography (Lucide).

## Files
- `README.md` — the design system guide and index.
- `colors_and_type.css` — all design tokens. Import this in every artifact.
- `assets/` — `logomark.svg` (three-block mark, adapts via `currentColor`) and `wordmark.svg`.
- `preview/` — specimen cards (color, type, spacing, components).
- `ui_kits/landing-page/` — marketing-site components + interactive `index.html`.
- `ui_kits/core-app/` — skill-browser components + interactive `index.html`.

## How to use
- **Visual artifacts** (slides, mocks, throwaway prototypes): copy the assets and
  tokens out, link `colors_and_type.css`, and build static HTML the user can view.
  Reuse the UI-kit JSX components — they already encode the brand.
- **Production code**: read the rules here and treat them as the source of truth.
  Copy `assets/` and the token file into the codebase; match the documented
  voice, type, color, and component patterns.

If invoked with no other guidance, ask the user what they want to build or
design, ask a few focused questions, then act as an expert Skillbase designer —
outputting HTML artifacts or production code depending on the need.

## Non-negotiables
- Paper canvas, deep ink text, **one** electric-lime accent used sparingly.
- Sentence case everywhere; the wordmark is always lowercase `skillbase`.
- **No emoji.** Lucide stroke icons only.
- Monospace (JetBrains Mono) for `name@author`, tags, commands, versions, counts.
- Avoid: bluish-purple gradients, floaty drop-shadow UI, Inter/Roboto/Arial,
  neon semantic colors, exclamation-mark marketing.
