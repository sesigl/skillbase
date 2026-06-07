---
description: Stress-test the current feature spec through relentless questioning. Challenges fuzzy language against the project glossary, sharpens terminology, and updates documentation (spec, CONTEXT.md, ADRs) inline as decisions crystallise. Use BEFORE `/speckit.plan`.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before clarification)**:
- Check if `.specify/extensions.yml` exists in the repo root.
- If it exists, read it and look for entries under `hooks.before_clarify`.
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally.
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable.
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation.
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently.

## Outline

Goal: Grill you relentlessly about every aspect of the current feature spec until we reach a shared, precise understanding. Walk down each branch of the design tree, resolve dependencies between decisions, sharpen fuzzy language, and update documentation inline as decisions crystallise.

This workflow runs BEFORE `/speckit.plan`. If you are skipping clarification (e.g., exploratory spike), you may proceed, but downstream rework risk increases substantially.

### Step 1: Load Everything

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root **once** (combined `--json --paths-only` mode). Parse JSON payload:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Optionally capture `IMPL_PLAN`, `TASKS` for context.)
   - If JSON parsing fails, abort and instruct user to re-run `/speckit.specify` first.
   - For single quotes in args like "I'm Groot", use escape syntax: e.g `'I'\''m Groot'` (or double-quote if possible: "I'm Groot").

2. Load the current spec file into memory.

3. Load or initialise the project glossary:
   - Check if `CONTEXT.md` exists at the repo root. If it does, load it.
   - If not, check for `CONTEXT-MAP.md`. If a context map exists, the repo has multiple bounded contexts. Read the map to:
     - Infer which context the feature belongs to based on the feature spec content. If unclear, ask.
     - Load that context's `CONTEXT.md`.
     - Note inter-context relationships (e.g. "Ordering → Fulfillment: emits `OrderPlaced`") — these are critical for challenging scope boundaries and integration assumptions.
   - If no glossary exists anywhere, create files lazily — only when the first domain term is actually resolved during questioning. Do not pre-create empty files.
   - Scan `docs/adr/` (or context-specific `docs/adr/` when multiple contexts exist) for existing ADRs relevant to the feature domain.

4. Load relevant code for cross-referencing:
   - If the feature touches existing code, explore the relevant files so you can challenge stated intentions against actual implementation.
   - If this is a greenfield feature with no existing code, skip code exploration.

### Step 2: Structured Coverage Scan

Perform an internal coverage scan against this taxonomy. For each category, assign status: **Clear / Partial / Missing**.

**Functional Scope & Behavior:**
- Core user goals & success criteria
- Explicit out-of-scope declarations
- User roles / personas differentiation

**Domain & Data Model:**
- Entities, attributes, relationships
- Identity & uniqueness rules
- Lifecycle/state transitions
- Data volume / scale assumptions

**Interaction & UX Flow:**
- Critical user journeys / sequences
- Error/empty/loading states
- Accessibility or localization notes

**Non-Functional Quality Attributes:**
- Performance (latency, throughput targets)
- Scalability (horizontal/vertical, limits)
- Reliability & availability (uptime, recovery expectations)
- Observability (logging, metrics, tracing signals)
- Security & privacy (authN/Z, data protection, threat assumptions)
- Compliance / regulatory constraints

**Integration & External Dependencies:**
- External services/APIs and failure modes
- Data import/export formats
- Protocol/versioning assumptions

**Edge Cases & Failure Handling:**
- Negative scenarios
- Rate limiting / throttling
- Conflict resolution

**Constraints & Tradeoffs:**
- Technical constraints (language, storage, hosting)
- Explicit tradeoffs or rejected alternatives

**Terminology & Consistency:**
- Canonical glossary terms defined
- Conflicts with existing CONTEXT.md language
- Overloaded or vague terms

**Completion Signals:**
- Acceptance criteria testability
- Measurable Definition of Done

**Misc / Placeholders:**
- TODO markers / unresolved decisions
- Ambiguous adjectives ("robust", "intuitive", "fast") lacking quantification

Use this coverage map to prioritise questions. Target the highest-impact unresolved categories first. Do NOT output the raw map unless zero questions will be asked.

### Step 3: Relentless Interview Loop

This is the core of the workflow. You are grilling the user until we are fully aligned.

**Question rules:**
- Present EXACTLY ONE question at a time.
- Wait for the user's answer before asking the next question.
- Do NOT reveal future questions in advance.
- Do NOT set a hard cap on the number of questions. Keep going until all taxonomy categories with Partial or Missing status that materially impact the design have been addressed, OR the user signals completion.
- Every question MUST materially impact architecture, data model, task decomposition, test design, UX behaviour, operational readiness, or compliance validation.
- Skip trivia: don't ask about stylistic preferences, plan-level execution details, or questions whose answers are already in the spec.
- When possible, answer a question by exploring the codebase instead of asking the user.

**Question format:**

For questions with discrete options:
- Analyse all options and determine the most suitable one based on: best practices for the project type, common patterns in similar implementations, risk reduction, and alignment with explicit project goals.
- Present your **recommended option** with reasoning:

  ```
  ## Q[N]: [Topic]

  [1-2 sentences of context from the spec or existing docs.]

  **Recommended:** Option [X] — [1-2 sentences why this is the best choice.]

  | Option | Description |
  |--------|-------------|
  | A | [Description] |
  | B | [Description] |
  | C | [Description] |
  | Short | Provide a different short answer |

  Reply with the option letter, "yes"/"recommended" to accept, or your own answer.
  ```

For free-form questions (no natural discrete options):
- Provide your **suggested answer**:

  ```
  ## Q[N]: [Topic]

  [1-2 sentences of context.]

  **Suggested:** [your proposed answer] — [brief reasoning.]

  Reply with a short answer, or "yes"/"suggested" to accept.
  ```

**Glossary challenge (during questioning):**
- When the user uses a term that conflicts with existing `CONTEXT.md`, call it out immediately: "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"
- When the user uses vague or overloaded terms, propose a precise canonical term: "You're saying 'account' — do you mean the Customer or the User? Those are different things."
- When both a glossary term and a code entity exist for the same concept, surface the contradiction and ask which one wins.

**Cross-reference with code (during questioning):**
- When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code does X, but you just said Y — which is correct?"

**Stress-test with scenarios:**
- Invent concrete scenarios that probe edge cases and force precision about boundaries between concepts.
- "What happens when two users try to [action] at the same time?"
- "What if [dependency] is unavailable for 30 seconds?"

**After each answer:**
- If the user replies with "yes", "recommended", or "suggested", use your previously stated recommendation/suggestion.
- If the answer is ambiguous, ask a quick disambiguation (same question, doesn't count as a new question).
- Once satisfactory, apply the clarification BEFORE asking the next question (see Step 4).
- Re-evaluate the internal coverage map — a single answer may resolve multiple categories.

**Stop conditions:**
- User signals completion: "done", "good", "no more", "proceed".
- All taxonomy categories that materially impact the design are Clear.
- Two consecutive questions yield no new useful information.

If no meaningful questions exist at all, respond: **"No critical ambiguities detected. The spec is ready for `/speckit.plan`."**

### Step 4: Apply Clarifications Inline

After EACH accepted answer, update documentation immediately — do not batch.

**Update the spec file (`FEATURE_SPEC`):**

1. On the first integration of this session:
   - Ensure a `## Clarifications` section exists. Create it just after the highest-level overview section (after `**Input**: ...`) if missing.
   - Under it, create (if not present) a `### Session YYYY-MM-DD` subheading for today.

2. Append immediately:
   ```
   - Q: [question] → A: [final answer]
   ```

3. Then apply the clarification to the most appropriate spec section:
   - Functional ambiguity → Update or add a bullet in **Functional Requirements**.
   - User interaction / actor distinction → Update **User Stories** with clarified role, constraint, or scenario.
   - Data shape / entities → Update **Key Entities** (add fields, types, relationships).
   - Non-functional constraint → Add/modify measurable criteria in **Success Criteria** (convert vague adjective to metric).
   - Edge case / negative flow → Add a bullet under **Edge Cases**.
   - Terminology conflict → Normalize term across the entire spec; retain original only if necessary via `(formerly "X")`.
   - Scope boundary → Update **Assumptions** or add explicit out-of-scope declarations.

4. If a clarification invalidates an earlier ambiguous statement, REPLACE it. Do not leave contradictory text.

5. Save the spec file after each integration (atomic overwrite).

6. Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.

**Update or create CONTEXT.md (glossary):**

When a domain-specific term is resolved during questioning:

1. If `CONTEXT.md` does not exist, create it at the repo root (or within the relevant context directory when using `CONTEXT-MAP.md`) using the format below. Create lazily — only when you have something to write.
2. Add the term under the `## Language` section with a tight 1-2 sentence definition of what it IS, not what it does.
3. **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_:`. A reader should never wonder "which term should I use?"
4. **Group terms under subheadings** when natural clusters emerge (e.g. `### Ordering`, `### Payment`). If all terms belong to a single cohesive area, a flat list is fine.
5. Keep `CONTEXT.md` purely a glossary — no implementation details, no specs, no scratch notes.
6. Only include terms specific to this project's domain. General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.

**CONTEXT.md format:**

```markdown
# Skillbase

[One or two sentence description of what this project is and why it exists.]

## Language

**Skill**:
A self-contained AI coding capability — a directory with a SKILL.md manifest and optional supporting files.
_Avoid_: Plugin, extension, agent

**Provider**:
An AI coding assistant platform that can load and execute skills (e.g., OpenCode, Claude Code).
_Avoid_: Platform, runtime, environment
```

**Create ADRs (sparingly):**

ONLY offer to create an ADR when ALL THREE are true:

1. **Hard to reverse** — changing your mind later carries meaningful cost.
2. **Surprising without context** — a future reader will wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons.

If any condition is missing, skip the ADR.

**What qualifies (non-exhaustive):**
- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target — not every library, just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.

When creating one, place it in `docs/adr/` with sequential numbering (`0001-slug.md`):

```markdown
# [Short title of the decision]

[1-3 sentences: what's the context, what did we decide, and why.]
```

Optional sections (only when they add genuine value): **Status** frontmatter, **Considered Options**, **Consequences**.

### Step 5: Final Report

When the interview loop ends, produce a summary:

```
## Clarification Complete

| Metric | Value |
|--------|-------|
| Questions asked | [N] |
| Spec sections touched | [list] |
| Glossary terms added/updated | [list or "none"] |
| ADRs created | [list or "none"] |
```

Then output a coverage summary table:

| Category | Status |
|----------|--------|
| Functional Scope & Behavior | Clear |
| Domain & Data Model | Clear |
| Interaction & UX Flow | Clear |
| Non-Functional Quality Attributes | [Clear/Deferred] |
| Integration & External Dependencies | [Clear/Deferred] |
| Edge Cases & Failure Handling | [Clear/Deferred] |
| Constraints & Tradeoffs | [Clear/Deferred] |
| Terminology & Consistency | Clear |
| Completion Signals | Clear |
| Misc / Placeholders | Clear |

If any categories remain Deferred, note them and recommend whether to proceed to `/speckit.plan` or run `/speckit.clarify` again later.

**Suggested next command**: `/speckit.plan`

## Behavior Rules

- If the spec file is missing, instruct the user to run `/speckit.specify` first.
- NEVER set an artificial question cap. Keep interviewing until fully aligned.
- NEVER reveal future questions in advance.
- NEVER batch documentation updates — apply each clarification inline immediately.
- ALWAYS challenge fuzzy or conflicting language against the glossary.
- ALWAYS cross-reference stated intentions with actual code when code exists.
- Offer ADRs sparingly — only when all three criteria are met.
- The glossary (`CONTEXT.md`) lives at the repo root. It is a single source of truth for domain language.
- Respect early termination: "stop", "done", "proceed", "good".

Context for prioritisation: $ARGUMENTS

## Post-Execution Checks

**Check for extension hooks (after clarification)**:
- Check if `.specify/extensions.yml` exists in the repo root.
- If it exists, read it and look for entries under `hooks.after_clarify`.
- If the YAML cannot be parsed or is invalid, skip hook checking silently.
- Filter out hooks where `enabled` is explicitly `false`.
- For each executable hook, do NOT interpret or evaluate `condition` expressions:
  - No condition / null / empty → executable.
  - Non-empty condition → skip, leave to HookExecutor.
- For each executable hook, output:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
- If no hooks are registered, skip silently.
