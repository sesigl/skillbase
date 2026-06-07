# Landing page — UI kit

High-fidelity recreation of the **Skillbase marketing site**. Open `index.html`
for the assembled, interactive page.

## What's here
| File | Component |
|---|---|
| `Atoms.jsx` | `Logo`, `Icon` (Lucide), `Eyebrow`, `Button` (primary / secondary / ghost / inkfill) |
| `Nav.jsx` | `Nav` — sticky header with blur-on-scroll, GitHub star count, dual CTAs |
| `Hero.jsx` | `Hero`, `HeroVisual` (skill-list product shot), `CommandPill` (copyable install command) |
| `Sections.jsx` | `TrustBar` (stats), `Features` + `FeatureCard` (mini-products grid), `HowItWorks` (steps + terminal), `CTABand` (dark) |
| `Footer.jsx` | `Footer` — link columns, social, license, sponsor |

## Content structure
Follows the proven dev-tool landing pattern: a specific, centered hero
("what it does + who it's for") with a code/product visual, a trust bar of
GitHub-style numbers, feature mini-products, a how-it-works terminal, a dark
CTA band, and a link-rich footer. Copy is sentence-case, verb-first, no emoji,
monospace for all commands and `name@author` identity.

## Notes
- Loads tokens from `../../colors_and_type.css`.
- React 18 + Babel standalone (pinned). Icons via Lucide CDN.
- Light theme throughout; dark only for code/terminal panels and the CTA band.
- Responsive: grids collapse to one column under 860px; nav hides under 720px.

> Pending: matching the exact section copy/tone of en.dev (referenced by the
> user) — awaiting a screenshot since the live site is JS-rendered.
