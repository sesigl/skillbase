# Skillbase — Design System

> Governance and analytics for AI coding skills.
> This repository is a **design system**: brand foundations, tokens, assets, and
> high-fidelity UI kits that let agents and designers build Skillbase surfaces
> that look and feel consistent — for production or throwaway mocks.

---

## What is Skillbase?

**Skillbase** is a governance and analytics tool for AI coding skills. Point it
at your team's GitHub plugin repository and it shows which skills exist, who
uses them, how often, and whether they measurably improve outcomes. A *skill* is
a self-contained AI coding capability — a directory with a `SKILL.md` manifest
plus optional scripts, templates, and references inside a Claude Code or OpenCode
plugin repo. Skills are uniquely identified by **name + author** (`name@author`),
which is why monospace identity runs through the whole brand.

The product fills a documented gap: Anthropic's issue #35319 notes that teams
"went from 67 to 183 skills in under a month" with no way to track which are
actually invoked or whether they help. Skillbase makes this data visible.

The product ships as a monorepo with two public-facing surfaces:

| Surface | What it is | Audience |
|---|---|---|
| **Landing page** (`apps/landing-page`) | Product site — what Skillbase is, why it exists, how to contribute / self-host. Astro SSR, no DB. | Prospective users, contributors, sponsors |
| **Core app** (`apps/core`) | The product — a skill browser with search, governance dashboards, and usage analytics. Astro SSR + Postgres. | Teams managing AI coding skills |

Supporting packages: `packages/shared` (canonical skill type + Zod schema),
`specs/`, `scripts/`, `.ci/`. Tooling is **Biome** (format + lint), **Vitest**
(tests), **Tailwind** (styling), **pnpm** workspaces.

### Audience & positioning
Skillbase talks to **engineering teams and open-source contributors** living in
the 2026 AI-coding world. The tone is that of a confident, modern developer tool
(think Astro, Biome, Neon, Linear) — technical and precise, never corporate or
hypey. It is a *governance and analytics* tool, not a registry or marketplace:
the visual language leans into data dashboards, terminal-adjacent monospace, and
a single electric signal color rather than decorative gradients.

### Sources
This design system was created **from a written feature specification only**
(`001-project-scaffold`, the Skillbase Project Scaffold spec, dated 2026-06-04).
There was **no existing codebase, Figma file, or screenshot** to reference, so
the brand — name treatment, logo, color, type, and all UI — is an original
system designed to fit the product and audience described in the spec. If a
real codebase or Figma exists, re-attach it and this system can be reconciled
against it.

---

## Content Fundamentals

How Skillbase writes. The voice is a **knowledgeable peer** — a fellow developer
who respects your time.

- **Person.** Address the reader as **"you"**; the project refers to itself as
  **"Skillbase"** or **"we"** sparingly. Never "the user."
- **Casing.** **Sentence case everywhere** — headings, buttons, nav, labels.
  Title Case is reserved for proper nouns (Claude Code, OpenCode, Neon, Astro).
  The wordmark itself is always lowercase: **skillbase**.
- **Length & density.** Short, declarative sentences. Lead with the verb or the
  value. Cut hedging ("simply", "just", "powerful", "seamless", "revolutionary").
- **Technical precision.** Use exact names: `SKILL.md`, `name@author`,
  `pnpm run verify`, `DATABASE_URL`. Code, commands, skill IDs, and tags are
  **always monospace**.
- **Emoji.** **None.** No emoji in product UI, marketing, or docs. Status and
  meaning come from color + icon, not emoji.
- **Punctuation.** No exclamation marks in product copy. Em dashes for asides.
  Oxford comma. Numerals for counts ("5 example skills", not "five").

**Voice examples**

| Do | Don't |
|---|---|
| "Browse and manage AI coding skills in one place." | "The Ultimate Platform to Supercharge Your AI Workflow! 🚀" |
| "Self-host it. It's open source." | "Leverage our powerful, seamless enterprise solution." |
| "No skills match `image-gen`. Try a broader term." | "Oops! We couldn't find anything 😢" |
| "Track skill usage across your team with `skillbase stats`." | "Getting started is super easy and fun!" |

**Microcopy patterns**
- Eyebrows / overlines: monospace, uppercase, lime — e.g. `// OPEN SOURCE`, `GOVERNANCE`, `ANALYTICS`.
- Buttons: verb-first, sentence case — "Browse skills", "Star on GitHub", "Read the docs".
- Empty states: state the fact, then a path forward — never apologize twice.
- Counts & metadata: monospace — `1,284 skills`, `v0.4.2`, `MIT`.

---

## Visual Foundations

The system is **paper + ink + one electric accent**. Restraint is the point: a
calm warm-neutral canvas so that skills, code, and the single lime signal do the
talking.

### Color
- **Paper** (`--paper`, warm off-white) is the primary canvas. **Ink**
  (`--ink`, a deep cool near-black) is text and dark surfaces.
- **Signature accent: electric lime** (`--lime-400`, `oklch(0.855 0.205 127)`).
  Used *sparingly* — primary CTAs, focus rings, the logo's skill block, eyebrows,
  active states. Ink text reads on top of it (never white). It deliberately
  avoids the over-used AI bluish-purple gradient.
- **Lime as text** uses the darker `--lime-700` / `--accent-text` so it passes
  contrast on paper.
- **Stone scale** (50→950) is a cool-leaning neutral for borders, muted text,
  and dark surfaces. Hairline borders are `--stone-200`.
- **Dark context** (`[data-theme="dark"]`) flips the canvas to `--stone-950`;
  used for the core-app shell and hero/code panels. Code panels are always dark
  (`--code-bg`) even in light mode — a recurring motif.
- **Semantic**: info = blue, success = green, warning = amber, danger = red,
  each with a soft `-wash` background. Quiet, never neon.

### Typography
- **Display / headings: Space Grotesk** — geometric, slightly technical, tight
  tracking (`-0.02em`) at large sizes. Carries brand personality.
- **Body / UI: Geist** — neutral, legible, modern. Default `--text-base` 15px.
- **Mono: JetBrains Mono** — skill IDs, tags, commands, counts, eyebrows. Mono
  is *identity*, not just code.
- Scale runs 11px → fluid hero. Body line-height 1.55; headings 1.08–1.22.

### Spacing & layout
- **4px base grid.** Generous vertical rhythm; sections breathe (`--space-16`→`32`).
- Content max-widths: prose `68ch`, content `1080px`, wide `1280px`.
- **Modular / blocky composition** — skill cards, feature blocks, and the logo
  echo the same stacked-module idea. Grids over free-floating layouts.

### Shape, border & elevation
- **Corner radii are calm and slightly squared**: cards `--radius-lg` (12px),
  buttons/inputs `--radius-md` (8px), tags/pills `--radius-pill`. Nothing blobby.
- **Borders carry the structure.** 1px hairline borders (`--stone-200`) define
  most cards; elevation is secondary. This is a "drawn", technical look — not a
  floaty material one.
- **Shadows are soft, low, cool-tinted** and used lightly — `--shadow-sm` for
  resting cards, `--shadow-md`/`lg` only for menus, popovers, and modals.
  `--shadow-accent` (lime glow) is reserved for the primary CTA on dark.

### Motion
- **Quick and confident, no bounce.** `--ease-out` (`cubic-bezier(.22,1,.36,1)`),
  durations 120–340ms. Fades + small (2–4px) translations; never springy.
- Hover/press are the primary interactive feedback (below). Decorative looping
  animation is avoided.

### States
- **Hover.** Buttons: shift to a darker/lighter sibling token (e.g. accent →
  `--accent-hover`); cards: border darkens to `--border-strong` + `--shadow-md`
  + 1px lift. No color invention — only adjacent scale steps.
- **Press.** Subtle `scale(0.98)` + remove lift. Fast (`--dur-fast`).
- **Focus.** Always visible: `0 0 0 3px var(--ring)` lime ring, never removed.
- **Disabled.** `--stone-400` fg, reduced opacity, no shadow, `cursor: not-allowed`.

### Imagery & texture
- Skillbase is **type-, code-, and token-led** — there is little photography.
  Where surface texture appears it's a faint **dot or line grid** on hero
  panels, or syntax-highlighted code blocks on dark.
- No stock photos, no 3D blobs, no gradient meshes. If imagery is needed, prefer
  **code, terminals, and diagrams** rendered in-brand.
- Transparency & blur: used only for sticky-header scrims (`backdrop-filter`) and
  overlay scrims behind modals — never decoratively.

### Things to avoid
Bluish-purple gradients · emoji · cards with a colored left-border-only accent ·
drop-shadow-heavy "floaty" UI · Inter/Roboto/Arial · neon semantic colors ·
exclamation-mark marketing.

---

## Iconography

- **Library: [Lucide](https://lucide.dev)** — clean 1.5–2px stroke, rounded
  joins, 24px grid. It matches Skillbase's technical-but-friendly tone and is the
  de-facto choice across the modern dev-tool ecosystem. Loaded from CDN
  (`lucide@latest`); see any UI-kit `index.html` for the include.
- **Style rules.** Stroke icons only (no filled/duotone mixing). Default stroke
  `1.75`, size 16–20px inline / 24px standalone. Icons inherit `currentColor`
  and sit at `--fg-muted` until active.
- **No emoji, ever** — neither in UI nor as iconography.
- **Brand mark.** The Skillbase logomark (`assets/logomark.svg`) is three modular
  blocks — two forming the *base*, one *skill* block resting on top in lime. It
  uses `currentColor` for the base blocks so it adapts to light/dark; the skill
  block is always lime. Wordmark lockup: `assets/wordmark.svg`.
- **Substitution flag.** Lucide is a substitution chosen for this greenfield
  brand (there was no existing icon set). Swap freely if the project adopts one.

---

## Index — what's in this system

| Path | What |
|---|---|
| `README.md` | This file — overview, content & visual foundations, iconography. |
| `colors_and_type.css` | All design tokens: color, type, spacing, radius, shadow, motion. Import this everywhere. |
| `SKILL.md` | Agent-Skill manifest so this system can be used inside Claude Code / OpenCode. |
| `assets/logomark.svg` | Logomark (three-block mark, adapts via `currentColor`). |
| `assets/wordmark.svg` | Horizontal `skillbase` lockup. |
| `preview/` | Design-system specimen cards (color, type, spacing, components) shown in the Design System tab. |
| `ui_kits/landing-page/` | High-fidelity marketing-site UI kit (components + interactive `index.html`). |
| `ui_kits/core-app/` | High-fidelity skill-browser UI kit (components + interactive `index.html`). |

### Fonts — substitution flag
Space Grotesk, Geist, and JetBrains Mono are loaded from **Google Fonts** via the
`@import` in `colors_and_type.css`. No `.ttf`/`.woff` files are vendored. If you
need fully offline / self-hosted fonts, drop them in `fonts/` and swap the import.
These were chosen for this greenfield brand — flag if you'd prefer different
families.

---

*Built 2026-06-04 from the Skillbase Project Scaffold spec. No prior brand
assets existed; everything here is original and open to iteration.*
