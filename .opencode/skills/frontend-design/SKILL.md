---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces for Skillbase. Use this skill when building web components, pages, or applications (landing page, core app UI, dashboards, Astro components, HTML/CSS layouts, or when styling any web UI). Generates creative, polished code that avoids generic AI aesthetics while strictly following the Skillbase design system.
license: Complete terms in LICENSE.txt
---

<design-system-rule>
The Skillbase design system at `/.opencode/skills/design-system/` is the single source of truth for all visual output. When touching ANY frontend code, load `.opencode/skills/design-system/README.md` and `.opencode/skills/design-system/colors_and_type.css` first. Every component, page, or interface MUST use the design tokens, color palette, typography scale, spacing grid, shape rules, and component patterns defined there.

Non-negotiable Skillbase brand rules:
- Paper canvas (`--paper`), deep ink text (`--ink`), one electric-lime accent (`--lime-400`) used sparingly.
- Space Grotesk (headings), Geist (body), JetBrains Mono (code, `name@author`, tags, commands).
- Sentence case everywhere. The wordmark is always lowercase `skillbase`.
- **No emoji.** Lucide stroke icons only.
- Monospace identity for `name@author`, tags, commands, versions, counts.
- Hairline borders (`--stone-200`) define structure; shadows are soft, low, cool-tinted.
- Avoid: bluish-purple gradients, floaty drop-shadow UI, Inter/Roboto/Arial, neon semantic colors, exclamation-mark marketing.
- Reuse components from `.opencode/skills/design-system/ui_kits/` (Atoms, Nav, Hero, Sections, Footer for landing-page; Atoms, AppBar, Browse, SkillDetail for core-app).
</design-system-rule>

<what-to-do>
This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics — adapted for Skillbase's specific brand and design language. Implement real working code with exceptional attention to aesthetic details and creative choices that work WITHIN the design system, not against it.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.
</what-to-do>

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction WITHIN the Skillbase design system:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: The Skillbase brand is paper + ink + one electric accent — technical and precise, like a confident developer tool (think Astro, Biome, Linear). Creative choices must amplify this tone, not fight it.
- **Constraints**: Technical requirements (framework, performance, accessibility). Skillbase uses Astro SSR, Tailwind CSS, Biome.
- **Differentiation**: What makes this UNFORGETTABLE within the design system's vocabulary? The modular/blocky composition, the monospace identity (`name@author`), the electric lime signal — these are your palette for distinctiveness.

Then implement working code (Astro `.astro` components, Tailwind CSS) that is:
- Production-grade and functional
- Strictly aligned with the Skillbase design tokens and brand rules
- Cohesive with the paper + ink + lime aesthetic
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines (adapted for Skillbase)

Focus on:
- **Typography**: Space Grotesk for headings (tight tracking -0.02em at large sizes), Geist for body (15px default), JetBrains Mono for all code, commands, skill IDs, tags, and counts. Never use Inter, Roboto, Arial, or system fonts.
- **Color & Theme**: Paper canvas (`--paper`), ink text (`--ink`), electric lime accent (`--lime-400`) used sparingly on CTAs, focus rings, eyebrows, active states. Dark panels for code and terminals. Use CSS variables from `colors_and_type.css` exclusively. No gradient meshes, no purple, no neon overload.
- **Motion**: Quick and confident — `--ease-out` (`cubic-bezier(.22,1,.36,1)`), durations 120–340ms. Fades + small translations. Hover: darker/lighter scale step + border strengthen. Press: `scale(0.98)`. Focus: always visible `0 0 0 3px var(--ring)` lime ring.
- **Spatial Composition**: Modular blocky layouts — skill cards, feature blocks, and the logo echo stacked-module patterns. Grids over free-floating. Generous whitespace. 4px base grid.
- **Borders & Structure**: 1px hairline borders (`--stone-200`) define cards. This is a "drawn", technical look — not floaty material. Radii: 12px cards, 8px buttons/inputs, pill tags.
- **Backgrounds & Texture**: Faint dot or line grids on hero panels. Syntax-highlighted code blocks on dark. No stock photos, no 3D blobs. Code, terminals, and diagrams as imagery.

NEVER use generic AI-generated aesthetics like Inter/Roboto/Arial font families, purple gradients on white backgrounds, emoji, drop-shadow-heavy "floaty" UI, exclamation-mark marketing, or cookie-cutter design that ignores the design system.

Interpret creatively and make unexpected choices that feel genuinely designed for Skillbase. The design system is your foundation — not your ceiling. Push within its constraints.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

## Skillbase-Specific Rules

### When building landing page components
Load `.opencode/skills/design-system/README.md`, `.opencode/skills/design-system/colors_and_type.css`, and `.opencode/skills/design-system/ui_kits/landing-page/` for reference components. Use the Atoms (Logo, Icon, Eyebrow, Button), Nav, Hero, Sections (TrustBar, Features, HowItWorks, CTABand), and Footer patterns. Dark hero/code panels, light body.

### When building core app components
Load `.opencode/skills/design-system/README.md`, `.opencode/skills/design-system/colors_and_type.css`, and `.opencode/skills/design-system/ui_kits/core-app/` for reference components. Use the Atoms (Logo, Icon, Button, Tag, Badge), AppBar, Browse (FilterRail, SkillCard, EmptyState), and SkillDetail patterns.
### When importing the design system

Copy `colors_and_type.css` into the app's `src/styles/design-tokens.css`. Import it from `global.css` via `@import './design-tokens.css'`. This file holds CSS custom properties (design tokens) and semantic type role classes (`.t-h1`, `.t-body`, etc.) **only**. Never add component pattern classes (`.btn-primary`, `.card`, `.tag`, etc.) here — those live in the Tailwind layer.

Map design tokens into Tailwind via `theme.extend` in `tailwind.config.mjs` (colors, fontFamily, fontSize, spacing, borderRadius, boxShadow, maxWidth).

### When building components — extracting shared patterns

After implementing or modifying multiple components, check for repeated Tailwind class combinations. Extract them into **`@layer components` in `global.css` using Tailwind's `@apply` directive** — not raw CSS:

```css
@layer components {
  .card {
    @apply bg-surface border border-border rounded-xl shadow-sm transition-all ease-[var(--ease-out)] duration-200;
  }
  .card:hover {
    @apply border-border-strong shadow-md;
  }

  .btn-primary {
    @apply inline-flex items-center gap-2 font-sans text-sm font-semibold text-fg-onaccent bg-accent border-none rounded-lg cursor-pointer transition-all ease-[var(--ease-out)] duration-200 shadow-accent;
  }
}
```

This keeps `design-tokens.css` clean (tokens only), uses Tailwind-native composition, and makes component patterns reusable across both apps.

Never use raw CSS properties in `design-tokens.css` for component patterns. Never duplicate the same Tailwind class string across 3+ components without extracting it.

### Content voice
Follow the design system's content fundamentals: sentence case everywhere, verb-first buttons, monospace for technical terms, no emoji, no exclamation marks in product copy, short declarative sentences.

Remember: Skillbase's design is paper + ink + one electric accent. Restraint is the point.
