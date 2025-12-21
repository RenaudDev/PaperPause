# Autonomy PRD Review Log: Issues, Questions, and Assumptions

Scope: `.docs/prd/autonomy-prd.md` (v7.0) — this document tracks **gaps**, **ambiguities**, **mismatches with the current repo**, and **explicit questions** needed to safely execute rollout.

## How to use this log
- Treat this as the **source of truth for open questions** and “things that can break production”.
- Each PRD vNext section should link back here for unresolved items.

---

## Section-by-section inventory (what the PRD currently specifies)

### 1) Executive Summary
- **Stated objective**: scale from **5 → 50 assets/day** with **zero human intervention** in the production loop.
- **Key innovations**: JIT manufacturing, Auto-Genesis (Agent 0), QA **1-strike fail-fast**.

**Assumptions embedded (not yet specified):**
- “Asset” is defined and measurable (PNG only? PNG+PDF? Hugo page+media?).
- A hard budget / daily cost cap exists and is enforced.
- “Zero human intervention” allows human review of false negatives (Issue #4) without blocking the pipeline.

### 2) System Architecture: Agent Fleet (Agent 0–5)
- **Agent 0 (Designer)**: creates missing prompt config + Hugo `_index.md`.
- **Agent 1 (Architect)**: weekly immunization by reading Issue #4 (Trash Can) and editing prompt configs. Issue #2 is not used as an input.
- **Agent 2 (Factory)**: generates raw PNGs with `temp-[timestamp].png`.
- **Agent 3 (Critic / QA)**: vision QA, renames rejected assets, uploads to R2 `rejected/`, comments Issue #4.
- **Agent 4 (SEO Copywriter / Finishing)**: SEO renaming, PDF generation, uploads to R2 `public/`, writes Hugo MD.
- **Agent 5 (Distributor)**: Make.com RSS monitor → Pinterest posting with UTM.

**Assumptions embedded (not yet specified):**
- Where **state** lives for: QA failure history (if any), “maintenance cap” counts.
- What makes a “collection” canonical: folder name, `_index.md`, prompt config, etc.
- How “agents” map to repo modules under `.agents/` (repo convention differs from PRD numbering).

### 3) The “Brain”: Scheduling Logic (Foreman)
- Script reference: `scripts/morning-routine/tasks/production-schedule.ts`
- Rollout schedule: schedule-driven weekly plan (`mission-control/rollout-schedule.md`)
- Ramp-up logic: collections are defined by the weekly rollout schedule file
- Maintenance mode: cap at **75 published posts**; once capped, collection is throttled to **1 publish/week**

**Assumptions embedded (not yet specified):**
- Exact format/schema of the rollout schedule file (and how Foreman parses it deterministically).
- Whether the cap counts drafts, published, or both (answered below).
- How “weeks since LAUNCH_DATE” is computed, including timezone boundary (answered below).

### 4) Workflow Orchestration
- Pipeline reference: `.github/workflows/daily-generate-and-optimize.yml`
- Job 1: Foreman → Designer (Auto-Genesis)
- Job 2: parallel matrix generation + QA → finishing → commit MD
- Job 3: Hugo build + Cloudflare deploy

**Assumptions embedded (not yet specified):**
- Concurrency model: per-collection vs per-asset; how we avoid shared-state races.
- Where “matrix output” is stored between jobs; how artifacts are passed safely.
- Whether “deploy” is part of the same workflow or handled elsewhere.

### 5) Data Models & Logging
- Trash Can: Issue #4 with a REJECTED template, includes R2 rejected URL.
- Issue #2 (Primary SEO Monitoring): external weekly reporting process (GA4 + GSC), not part of the autonomy control loop.

**Assumptions embedded (not yet specified):**
- Exact comment format (must be machine-parseable for Agent 1).
- Deduplication keys (avoid counting the same rejected asset twice).

### 6) Implementation Roadmap
- Tasks 1.1–3.1 listed as checkboxes (Foreman, Designer, workflow refactor, QA, SEO batch PDF generation, Issue integrations, dashboard).
  - Note: QA is now intended as **1-strike fail-fast** (no two-strike counter).

---

## Repo reality check (mismatches and confirmations)

### Confirmed present in repo
- Workflow exists: `.github/workflows/daily-generate-and-optimize.yml`
  - Already has a **matrix** generation job and a separate **commit** job.
- Generation script exists: `scripts/morning-routine/tasks/generate-batch.ts`
- SEO batch script exists: `scripts/morning-routine/tasks/seo-review-batch.ts`
- Content counting/utilities exist: `scripts/morning-routine/lib/content-manager.ts` (includes `countContent`)
- Taxonomy validator exists: `scripts/validate-taxonomy.ts` (but it is *not* a master taxonomy)
- Agent packaging convention exists: `.agents/README.md`
- SEO agent exists: `.agents/seo-copywriter/` (vision metadata optimizer, deterministic frontmatter merge)

### Referenced by PRD but **missing** in repo (as of now)
- `scripts/morning-routine/tasks/production-schedule.ts` (Foreman)
- `scripts/morning-routine/tasks/design-collection.ts` (Designer)
- Any explicit “Critic QA” script/module (Agent 3) matching PRD description

### Key workflow mismatches to resolve in PRD vNext
- **Matrix source**: workflow currently hardcodes `collection: [cats, dogs, ...]` rather than a Foreman-produced matrix.
- **Issue tracking number**: workflow posts summary to `TRACKING_ISSUE_NUMBER: 1` (PRD expects Issue #4 for rejections). Issue #2 is external reporting, not part of autonomy.
- **JIT finishing**: current “SEO batch” renames markdown and updates SEO fields; it does **not** (yet) generate PDFs or rename/upload images as described in PRD Agent 4.
- **Validation**: `validate-taxonomy.ts` enforces “no deprecated tags” but does not define/validate the master taxonomy ranking used by ramp-up.

---

## Required artifacts and state (must be made explicit in PRD vNext)

### Artifacts
- **Content source of truth**: `content/<category>/<collection>/...` (Hugo content)
- **Collection index**: `content/<category>/<collection>/_index.md` (collection metadata like batch size/templates)
- **Prompt config**: PRD mentions `config/prompts/[category]-[collection].json` (must be confirmed/standardized)
- **Run manifests**: current workflow expects `scripts/morning-routine/.runs/<runId>.json`
- **R2 layout**: `public/` vs `rejected/` (exact prefixes and URL base must be standardized)
- **Issue templates**: machine-parseable schema for Issue #4 comments (Issue #2 is external reporting, not part of autonomy)

### State & persistence (critical to avoid “stateless CI” pitfalls)
- **Fail-fast semantics**: how to avoid waste when multiple candidates are in-flight (sequential vs limited concurrency).
- **Maintenance cap counts**: computed each run from repo content, or cached?
- **Weekly immunization history**: how to avoid repeated edits and config drift?
- **Budget/cost caps**: limits per collection/day; where enforced and logged?

---

## Open questions (must be answered or explicitly deferred)

### Definitions
Q: What exactly is an **asset** for “5→50 assets/day”? (PNG? PNG+PDF? page+media?)
A: An Approved PNG ready to be turned into a PDF

Q: What is the canonical definition of **collection** vs **category**? (folder? prompt config key? taxonomy node?)
A: A **category** is *genus* while a **collection** is a *specie*

Q: Are “survivors” defined as “passes QA” or “successfully published”?
A: Passed QA

### Scheduling & capacity
Q: Where does **LAUNCH_DATE** live, and what is “week 1” anchored to (UTC day boundary)?

A: It should be a new file created. Week 1 would start on Monday at 12:01 AM Eastern standard time

Q: Which **rollout schedule file** defines the collections for a given week (and what format/schema should it use)?

A: Canonical file: `mission-control/rollout-schedule.md` (human-edited and machine-parseable; can later migrate to JSON/YAML once stable).

Q: Does the **cap of 75** count drafts, published, or both?

A: Published only (non-draft), excluding `_index.md`.

Q: Once a collection hits the cap, do we **remove it**, or **throttle it**?

A: Throttle: keep it active, but schedule/publish **1 asset per week** (Maintenance Mode).

### Quality assurance (1-strike fail-fast)
Q: What is the precise QA rubric (thresholds) and what is considered “fail” vs “warn”?

A: The main components are: Technical Integrity, Colorability, and Aesthetic Logic.
- What is Technical integrity? 
- - Line Crispness: Are the lines sharp vectors or high-resolution rasters? I look for "fuzzy" or pixelated edges. The lines must be solid black (#000000) against pure white (#FFFFFF).
- - Closed Paths: This is critical. Are the shapes enclosed? If a child tries to use a "fill" tool (on an app) or a marker, will the color "leak" into the background?
- - No Grayscale/Shading: A coloring page should generally avoid pre-shaded areas (greys). Shading is the user's job.
- What is Colorability?
- - Canvas Occupancy (The "Bang for Buck"): Does the subject fill 70-85% of the frame? If the subject is too small, standard details become "micro" details that are impossible to color with standard markers.
- - Margin Safety (The "Gutter" Rule): Are crucial details (faces, text) at least 0.5 to 0.75 inches away from the binding edge? Users should not have to break the book's spine or jam their pencil into the crack to color a face.
- - The "Pinky Finger" Rule: Are there spaces so tiny that even a sharp colored pencil can't fill them without crossing the lines?
- - Differentiation: Is it clear what is skin, what is clothing, and what is background?
- - Line Weight Hierarchy: Good designs use thicker lines for the main outline/silhouette and thinner lines for interior details. This guides the eye and helps the user stay inside the main shape.
- What is "Anatomy & Logic (The "AI Hallucination" Check)"?
- - Hand/Extremity Count: Does the subject have 5 fingers? Are the feet facing the right way?
- - Object Permanence: If a sword goes behind a shield, does it come out the other side in the correct alignment?
- - Structural Nonsense: Are there random lines floating in the sky that represent nothing?

Q: When QA fails once in a collection (1-strike fail-fast), do we stop **only that collection** and continue other collections?
A: Yes — halt the failing collection for the remainder of the run; other collections continue. Log the failure reason to Issue #4.

### Finishing (JIT)
Q: When/how do we generate PDFs (DPI, page size, watermark/footer), and where do we store them?

A: At the SEO Copywriter / Finisher agent, since he knows how the PDF should be named.

Q: What is the canonical “SEO rename” source: model output vs deterministic slug rules?

A: The SEO Copywriter agent outputs a `slug`, which is then normalized and collision-handled deterministically by the task runner (see current `seo-review-batch.ts` behavior). The model proposes; the runner enforces deterministic constraints.

Q: How do we ensure idempotency for retries (no duplicate uploads, no duplicate markdown files)?

A: Make retries idempotent by introducing a stable “asset identity” and treating every step as an upsert.

- Define a deterministic AssetID for each output slot, e.g.:
  - AssetID = {run_week_key}/{category}/{collection}/{slot_index}
  - (slot_index = 1..N for that day/collection)
- Generation step writes/updates a run manifest (ledger) keyed by AssetID:
  - records: temp source URLs, QA result, final slug, final R2 keys, final markdown path
  - if AssetID already exists in the manifest with final outputs present → skip generation/finishing
- Finisher uses the manifest to compute deterministic final names:
  - markdown filename and slug derived from the SEO agent + AssetID
  - PDF/PNG final keys derived from that slug + AssetID
- Storage writes are “upsert”:
  - upload with the *same* final key overwrites safely OR checks existence and no-ops (choose one policy and be consistent)
  - never “rename” by generating a new key unless AssetID changes
- SEO renaming avoids duplicates:
  - if final markdown path already exists for AssetID → update frontmatter in place, do not create “-1”, “-2” collisions
- Logging dedupe:
  - include AssetID + run_id in Issue #4 comments so retried runs don’t create duplicate failure logs for the same asset.

### Logging & feedback loops
Q: Exact formats for Issue #4 (Trash Can)?

Answer:
#### Issue #4 (Trash Can) — per rejected asset (or per collection fail-fast)
Human section (free text):
- Title line: REJECTED — {category}/{collection} — {reason}
- 1–3 bullets summarizing what failed and what the reviewer should check

Machine section (required, JSON only, fenced):

```json
{
  "schema_version": "trashcan_v1",
  "timestamp_utc": "2025-12-21T10:05:00Z",
  "run_id": "2025-12-21T10-00-00Z-cats",
  "asset_id": "week_2025-12-22/animals/cats/slot_1",
  "category": "animals",
  "collection": "cats",
  "qa_mode": "enforce_failfast",
  "qa_result": "fail",
  "reason": "CANVAS_OCCUPANCY_LOW",
  "reason_details": "Subject fills ~40% of frame; micro details",
  "prompt": "A cute cat reading a book...",
  "image_url": "https://.../rejected/....png",
  "r2_original": "https://.../cats/temp-....png",
  "cf_image_id": "optional",
  "notes": "optional"
}
```

Q: How does Agent 1 decide which config field to mutate (negative_prompt only, or others)?
A: Agent 1 may only mutate **one field** in the prompt config: `negative_prompt`.
- It must NOT edit: the base prompt template, subjects/variants lists, style presets, or any “positive” prompt text.
- Rationale: negative prompts are the safest lever for quality control without changing the creative direction.
- Implementation detail: Agent 1 maintains an `immunization_terms` set (deduped) that is merged into `negative_prompt` at runtime or persisted as a comma-separated list (but still only affects `negative_prompt` behavior).

A: Self-healing is allowed only under strict guards to prevent drift and infinite prompt growth.

1) Evidence threshold (no knee-jerk edits)
- A new immunization term can be added only if the same `reason` appears ≥ N times for the same collection within the last W days (e.g., N=5, W=14).

2) Bounded change size
- Max additions per collection per week: 2 terms
- Max edits per weekly run (global): 10 collections
- Terms are deduped (set semantics). No repeats.

3) Cooldown / no thrashing
- After a config is immunized for a `reason`, don’t change it again for that same `reason` for 2 weeks unless the failure rate continues to rise.

4) Prompt length hard cap (500 characters total input)
- Hard requirement: the final prompt input sent to the model (positive prompt + negative prompt combined, including separators) must be ≤ 500 characters.
- Enforcement rule:
  - “Pinned” base negative terms stay (hand-curated essentials).
  - `immunization_terms` are lowest priority and are pruned first.
  - If length > 500, remove immunization terms in this order until compliant:
    - oldest added → newest (or lowest-impact → highest-impact, if you track impact)
- Never shorten the positive prompt by adding “more words”; Agent 1 does not touch it.

5) Rollback and audit
- Every immunization edit must be committed with a clear message (collection + reason + terms added/removed) and logged in an issue comment.
- If a change causes worse outcomes, revert by git commit (single-step rollback) and add the reverted terms to a “do-not-add” list.

Q: What is the **safety policy** for self-healing edits (max edits/week, require N confirmations, rollback)?

A: Self-healing edits are allowed only under strict guardrails to prevent drift, runaway prompt growth, and accidental regressions.

**Scope (what can change)**
- Agent 1 may only mutate `negative_prompt` (or a dedicated `immunization_terms` list that is merged into `negative_prompt`).
- It must never modify positive prompt text, subject/action lists, style presets, or templates.

**Evidence threshold (confirmations)**
- A change is permitted only if the same failure `reason` is observed ≥ 5 times for the same collection within the last 14 days (Issue #4 ledger).
- Optional escalation: if the reason is “severe/costly” you may allow ≥ 3 in 7 days, but only for a predefined allowlist of reasons.

**Bounded change size**
- Max 2 new terms per collection per week.
- Max 10 collections edited per weekly run.
- Terms are deduped (set semantics). No repeated additions.

**Cooldown / no thrash**
- After a collection is immunized for a reason, do not edit it again for that same reason for 14 days unless the failure rate continues to rise.

**Hard prompt-length cap (500 chars)**
- Absolute constraint: total model input prompt (positive + negative + separators) ≤ 500 characters.
- If the cap is exceeded:
  - keep pinned base negative terms
  - prune immunization terms first (oldest-first or lowest-impact-first) until ≤ 500
- If still > 500, abort immunization and log a warning (do not force-truncate the positive prompt).

**Audit + rollback**
- Every immunization edit must:
  - be committed to git with a clear message: `{collection} {reason} +{terms} -{terms}`
  - be logged to Issue #4 (or a dedicated “Immunization Log” issue) with schema_version and the before/after negative prompt
- Rollback is a single revert commit. Reverted terms are added to a `do_not_add_terms` list for that collection/reason.

### Operational constraints
- Expected daily budget ceilings and per-model quotas (Gemini image vs vision).
- Q: Secrets and environment: what must exist in `.dev.vars` vs CI secrets?
  - A: Every required secret must exist in both places with the same key name (local `.dev.vars` mirrors CI secrets). The system should fail fast with a clear error if any required key is missing.
- Concurrency/rate limiting: current scripts throttle locally; does that align with desired parallelism?

---

## Logical impossibilities & risk register (things that can break rollout)

### R1) Fail-fast under concurrency can still waste budget if multiple candidates are in-flight
- Even with 1-strike fail-fast, if generation/QA runs concurrently, more than one candidate may already be in progress when the first failure is detected.
- **Mitigation**: define cancellation behavior explicitly:\n  - Preferred: run generation/QA sequentially when `QA_MODE=enforce_failfast`.\n  - Acceptable: allow limited in-flight work but ignore/discard results after the first failure; log that additional work was in-flight.

### R2) CI jobs are stateless; “weekly” and “maintenance” logic must avoid hidden state
- Avoid designs that require “already ran this week” persistence unless explicitly stored.
- **Mitigation**: use deterministic rules (e.g., schedule capped collections on the first run of the week) or persist state explicitly (git, issues ledger, or R2 state objects).

### R3) R2/“rename” semantics are not a true rename
- Object stores typically require **copy + delete** to “rename” a key; this impacts cost, time, and failure modes.
- PRD vNext should specify whether asset renaming is required at the storage layer, or if we accept stable temp keys and only rename markdown slugs.

### R4) “JIT PDF generation” is currently violated by existing code
- Today, `uploadImage()` generates and uploads a PDF immediately (best-effort) during generation.
- If PRD insists on JIT (PDF only after QA), rollout must either:\n  - accept a **transitional period** where PDFs exist for rejected items, or\n  - refactor finishing to generate PDFs post-QA and disable PDF generation during generation.

### R5) GitHub Actions artifact staging can miss modifications
- Current workflow stages **only untracked files** under `content/animals/<collection>/` for each matrix job.\n  - If a step modifies an existing tracked file (e.g., rewriting `_index.md` or editing configs under `config/`), it may not be included in artifacts and thus not committed.
- **Mitigation**: define which files each job is allowed to modify and ensure the artifact/commit strategy captures them (or run those edits in the commit job).

### R6) “Master taxonomy” is not currently defined where PRD points
- `scripts/validate-taxonomy.ts` intentionally does not validate taxonomy values; it enforces lightweight invariants.
- Ramp-up logic requires an explicit weekly **rollout schedule** (which collections are active for the current week).
- **Mitigation**: define a canonical schedule source (v1 can be a repo-tracked schedule file, later upgraded to strict JSON/YAML).

### R7) Issue parsing must be machine-stable
- Agent 1 depends on parsing Issue #4 rejection reasons; free-form text is brittle.
- **Mitigation**: require a strict schema (YAML frontmatter-like block or JSON block) inside each Issue comment, with versioning.

### R8) False positives in QA can silently freeze growth
- With fail-fast, an overly aggressive rubric can halt entire collections quickly.
- **Mitigation**: staged rollout (observe → enforce_failfast), plus a temporary allowlist override for known-good collections and a sampling-based audit loop via Issue #4.

### R9) Idempotency and collision handling must be defined end-to-end
- Current SEO batch renames markdown files with collision handling; generation writes temp md names.
- If we add asset renaming (R2/CF) plus markdown renaming plus retries, we must define stable deduplication keys:\n  - per-run asset ID, per-variant prompt hash, or a manifest ledger.\n- **Mitigation**: PRD vNext must define the canonical “asset identity” and how retries behave.



