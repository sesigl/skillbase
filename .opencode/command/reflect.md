---
description: Reflect on the current session to surface missed preferences, evaluate config quality, and recommend improvements to AGENTS.md, skills, or commands so the assistant catches intent earlier next time.
---

## User Input

```text
$ARGUMENTS
```

## Objective

Review the current conversation to identify moments where the assistant misunderstood or missed user preferences. Diagnose *why* the miss happened — was it a missing instruction in AGENTS.md, a skill that didn't fire, or a preference never encoded? Then recommend concrete config changes ranked by cost/benefit, following the OpenCode token-cost model:

- 🔴 **AGENTS.md** — every token costs on every turn. Keep minimal: principles, not recipe.
- 🟡 **Rules (.opencode/rules)** — zero cost until a file glob matches. Use for language/framework conventions.
- 🟢 **Skills** — content stays out of context until triggered by description match. Use for detailed runbooks.

When proposing skills, follow Anthropic's skill creation best practices: benchmark before/after, keep the description front-loaded with trigger keywords, gate with "Use ONLY when…" to prevent false fires.

---

## Phase 1: Session Reconstruction

Read the current conversation from the beginning. Build a timeline:

1. **What the user asked for** — each distinct request or redirection.
2. **What the assistant did** — the implementation path taken.
3. **Correction points** — moments the user steered, restated, or pushed back.
4. **Final outcome** — what was delivered and the remaining state.

Output a short timeline (5-10 items) in chronological order. Focus on *interactions where the assistant's first attempt didn't match the user's intent*.

---

## Phase 2: Miss Analysis

For each correction point identified in Phase 1, diagnose the root cause:

| Miss | Root Cause | Could have been prevented by… |
|---|---|---|
| (describe) | Missing instruction / Skill didn't fire / Preference never stated | (specific config change) |

Categorize each miss into one of:

- **A: Missing instruction.** The user's preference was stated somewhere (spec, design system, prior session) but NOT in the config the assistant reads at task time.
- **B: Skill didn't fire.** A skill exists with the right instruction, but it wasn't loaded because the description didn't trigger, or the assistant didn't auto-load it.
- **C: Preference never stated.** No existing artifact encodes this preference. The assistant correctly followed instructions but the user had a latent preference.
- **D: Assistant error.** The instruction was present and loaded, but the assistant chose a different (wrong) approach.

---

## Phase 3: Config Audit

Read ALL config artifacts that influence assistant behavior for this project:

1. `AGENTS.md`
2. `.opencode/skills/*/SKILL.md` (every skill's frontmatter + body)
3. `.opencode/command/*.md` (every command)
4. `opencode.json`
5. Any `.opencode/rules/` directory (if it exists)

For each artifact, answer:

- What does it encode well? (Precision, actionable triggers)
- What is **missing** that could have prevented the misses in Phase 2?
- What is **redundant** — content that could move to a lower-cost tier (sp:
  skill instead of AGENTS.md)?
- What is **wrongly scoped** — a skill that fires too broadly or a trigger
  that matches unintended file types?

---

## Phase 4: Options & Recommendations

Propose specific config changes to prevent the misses. For each option:

- State what changes (which file, what content).
- Rate the cost (🔴🟡🟢) — AGENTS.md is expensive, skills are cheap, rules are zero-until-triggered.
- List pros and cons.
- State how you'd benchmark: "After this change, when I say X, the assistant should Y."

Present at least 3 options spanning the cost spectrum.

**IMPORTANT: Before recommending,** present the options as a table and ask:

```
Which of these options should we implement? Pick any combination.
```

Supply a question prompt with these as choices (use the `||` "Other" fallback pattern from the `question` tool — but embedded in the markdown so the command can be read interactively).

---

## Phase 5: Implementation

Once the user selects options, implement them:

1. **For AGENTS.md updates:** Be surgical. Add only the minimum principle. Move recipe/checklist content to skills or rules.
2. **For rule creation:** Place files in `.opencode/rules/` with glob frontmatter. Each rule fires once when a matching file is touched.
3. **For skill creation/update:** Create `SKILL.md` in `.opencode/skills/<name>/`. Frontmatter MUST: name the skill, write a third-person description that front-loads trigger keywords, gate with "Use ONLY when…" if narrow scope. Body: short, concrete, testable.
4. **For command creation:** Create `.opencode/command/<name>.md` with YAML frontmatter (description field) and markdown body.

After implementing, run the benchmark: open a new session (or simulate with the spec) and verify the assistant now catches the preference without prompting.

### Deliverable

Output a summary of:
- What was changed and why
- The benchmark scenario and expected behavior
- Token-cost impact (what moved from 🔴 to 🟡/🟢)

---

## Quick Reference

| Asset | Path | Cost | When loaded |
|---|---|---|---|
| AGENTS.md | `AGENTS.md` | 🔴 | Every turn |
| Rules | `.opencode/rules/*.md` | 🟡 | When glob matches a file in worktree |
| Skills | `.opencode/skills/<name>/SKILL.md` | 🟢 | Description match; content on demand |
| Commands | `.opencode/command/<name>.md` | 🟢 | User types `/<name>` |
| Config | `opencode.json` | 🔴 | Every turn (lightweight) |

Principle: **AGENTS.md encodes HOW to think. Rules encode WHEN to check. Skills encode WHAT to do.** Don't put recipes in AGENTS.md. Don't put principles in skills.
