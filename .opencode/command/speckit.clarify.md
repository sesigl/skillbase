---
description: Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Stress-tests the feature spec by walking down each branch of the design tree, challenging fuzzy language against the project glossary, and updating documentation (spec, CONTEXT.md, ADRs) inline as decisions crystallise. Use BEFORE `/speckit.plan`.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
---

<load-skill name="ddd-hexagonal-architect" />

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

### Step 1: Load Everything

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root. Parse JSON for `FEATURE_DIR`, `FEATURE_SPEC`.
2. Load the current spec file.
3. Load `CONTEXT.md` (glossary). If `CONTEXT-MAP.md` exists, use it to find the right context's `CONTEXT.md`.
4. Scan `docs/adr/` for relevant ADRs.
5. Load relevant code files that the feature touches — cross-reference stated intentions against actual implementation.

### Step 2: Structured Coverage Scan

Internally scan these categories, assigning **Clear / Partial / Missing**:

- **Functional Scope & Behavior** — Core user goals, out-of-scope, user roles
- **Domain & Data Model** — Entities, identity, lifecycle, scale
- **Interaction & UX Flow** — User journeys, error/empty/loading states
- **Non-Functional Quality Attributes** — Performance, scalability, reliability, observability, security
- **Integration & External Dependencies** — External services, failure modes, formats
- **Edge Cases & Failure Handling** — Negative scenarios, concurrency, conflicts
- **Constraints & Tradeoffs** — Technical constraints, rejected alternatives
- **Terminology & Consistency** — Glossary alignment, vague terms
- **Completion Signals** — Testable acceptance criteria, measurable definition of done

Target the highest-impact Partial/Missing categories first. Keep questioning until every category is Clear or the user signals completion.

### Step 3: Relentless Interview

Present EXACTLY ONE question at a time. For each question, provide your recommended answer with brief reasoning. Wait for feedback before continuing.

**Format:** Simple and direct.

```
## Q[N]: [Topic]

[Context from spec or code — what's unclear and why it matters.]

**Recommended:** [Your answer + 1-2 sentences why.]

Reply with your answer, or "yes"/"recommended" to accept.
```

### Step 4: Apply Clarifications Inline

After each accepted answer:

1. Append Q&A to the `## Clarifications > ### Session YYYY-MM-DD` section in the spec.
2. Update the relevant spec section (Functional Requirements, Key Entities, Success Criteria, Edge Cases, Assumptions) immediately — do not batch.
3. If a clarification invalidates earlier text, replace it. Leave no contradictions.
4. Save the spec after each integration.

### During the Session

**Challenge against the glossary.** When the user uses a term that conflicts with `CONTEXT.md`, call it out: "Your glossary defines X as Y, but you seem to mean Z — which is it?"

**Sharpen fuzzy language.** When the user uses vague terms, propose a precise canonical term: "You're saying 'account' — do you mean the Customer or the User?"

**Discuss concrete scenarios.** Stress-test with specific edge cases: "What happens when two users index the same repo at the same time?" "What if the repo has 500 skills?"

**Cross-reference with code.** When the user states how something works, check whether the code agrees. Surface contradictions immediately.

**Update CONTEXT.md inline.** When a domain term is resolved, add it to the glossary. Be opinionated — pick the best term and list alternatives under `_Avoid_:`. Only include project-specific domain terms.

**Offer ADRs sparingly.** Only when a decision is (1) hard to reverse, (2) surprising without context, AND (3) the result of a real trade-off. Place in `docs/adr/` with sequential numbering.

### Stop Conditions

- User signals completion: "done", "good", "no more", "proceed"
- All taxonomy categories are Clear
- Two consecutive questions yield no new useful information

### Final Report

```
## Clarification Complete

| Metric | Value |
|--------|-------|
| Questions asked | [N] |
| Spec sections touched | [list] |
| Glossary terms added/updated | [list or "none"] |
| ADRs created | [list or "none"] |
```

Coverage summary table with Clear/Deferred per category. Recommend next command: `/speckit.plan`.

## Behavior Rules

- NEVER set an artificial question cap. Keep interviewing until fully aligned.
- NEVER reveal future questions in advance.
- NEVER batch documentation updates — apply each clarification inline immediately.
- ALWAYS challenge fuzzy or conflicting language against the glossary.
- ALWAYS cross-reference stated intentions with actual code.
- Respect early termination: "stop", "done", "proceed".

### Step 5: ADR Sweep

After the interview loop ends and BEFORE producing the final report, review EVERY clarification answer from this session against the three ADR criteria:

1. **Hard to reverse** — changing your mind later carries meaningful cost.
2. **Surprising without context** — a future reader would wonder "why did they do it this way?"
3. **Real trade-off** — there were genuine alternatives and you picked one for specific reasons.

**How to run the sweep:**

Walk through each Q&A in the clarifications section. For each one, ask yourself: does this decision meet all three criteria? If YES, flag it as an ADR candidate.

Present flagged candidates to the user:

```
## ADR Candidates

The following clarifications merit an ADR:

| Decision | Criteria Met | Why |
|----------|-------------|-----|
| [Summary of decision] | Hard to reverse + surprising + trade-off | [1 sentence] |

Create these ADRs?
```

Do NOT present decisions that fail any of the three criteria. Do NOT create ADRs for implementation details, scope boundaries, or minor preferences.

If the user says yes, create each ADR in `docs/adr/` with sequential numbering (`[next-number]-slug.md`). Format:

```markdown
# [Title]

**Context:** [1-2 sentences on the situation before the decision.]

**Decision:** [What we decided — 1 sentence.]

**Why:** [Why this over alternatives — 1-2 sentences.]

**Alternatives considered:**
- **[Alternative]:** [Why rejected — 1 sentence.]
```

If no decisions meet all three criteria, report: "No ADR-worthy decisions in this session."

Then proceed to the Final Report.
