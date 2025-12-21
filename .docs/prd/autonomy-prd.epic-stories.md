# Epic: PaperPause Autonomy System (PRD vNext → Implementation Stories)

Source PRD: `.docs/prd/autonomy-prd.md`  
Companions: `.docs/prd/autonomy-prd.rollout.md`, `.docs/prd/autonomy-prd.issues.md`, `.docs/prd/autonomy-prd.agent-mapping.md`

## Epic goal
Ship the autonomy system in **phases** that preserve daily production stability while adding:
- dynamic scheduling (Foreman)
- auto-genesis (Designer)
- QA (Critic, **1-strike fail-fast**)
- post-QA finishing (SEO/packaging)
- feedback loops (Architect)
- syndication integration (Distributor)

## Epic success metrics (Definition of Done)
- **Reliability**: daily workflow completes successfully for scheduled collections with clear reporting.
- **Safety**: every new step has a disable switch; rollback is documented and tested by toggling off.
- **Output**: produces the target number of assets/day (per ramp-up week) with stable URLs and consistent frontmatter.
- **Control**: budget/cost ceilings are enforced and visible.
- **Auditability**: rejections and self-healing edits are traceable via logs + issue-ledger records.

## Global constraints (apply to every story)
- **Idempotency**: reruns do not duplicate content/assets or corrupt unrelated fields.
- **Bounded edits**: any automated edits must be scoped to explicit files/fields.
- **Concurrency safety**: behavior under GitHub Actions matrix parallelism is defined.

---

## Phase 0 (Baseline): lock in current behavior as “known good”

### Story 0.1 — Baseline contract + invariants
- **Description**: Document and codify what the current workflow does and what it must keep doing as phases are added.
- **Targets**: `.github/workflows/daily-generate-and-optimize.yml`, `scripts/morning-routine/tasks/generate-batch.ts`, `scripts/morning-routine/tasks/seo-review-batch.ts`
- **Acceptance criteria**:
  - A written “baseline contract” exists (what steps run, what artifacts are produced, what is allowed to fail best-effort).
  - The baseline contract explicitly names current tracking issue behavior (Issue #1) and where it will diverge (Issue #4 for rejections). Issue #2 remains external reporting.

### Story 0.2 — Add global disable switches (no behavior change when off)
- **Description**: Introduce environment/workflow toggles for new capabilities, defaulting to “off”.
- **Acceptance criteria**:
  - Workflow can be run with all new toggles set “off” and behaves identically to baseline.
  - Toggles are documented in the PRD/rollout map and visible in workflow summary output.

---

## Phase A (Foundations): Foreman + Designer as preflight (dry-run first)

### Story A.1 — Finalize rollout schedule schema + Week 1 anchor
- **Description**: Finalize the rollout schedule schema and set a concrete Week 1 anchor date so Foreman scheduling is deterministic.
- **Acceptance criteria**:
  - `mission-control/rollout-schedule.md` includes the `rollout_schedule_v1` schema header.
  - Week 1 has a concrete `starts_at_et` Monday date and a concrete `collections` list.
  - Foreman can deterministically select the correct week from the schedule file based on the ET week boundary.

### Story A.2 — Implement Foreman: `production-schedule.ts`
- **Description**: Foreman computes the daily matrix using the rollout schedule + maintenance throttling rules.
- **Targets**: `scripts/morning-routine/tasks/production-schedule.ts` (new), `scripts/morning-routine/lib/content-manager.ts` (existing count helpers)
- **Acceptance criteria**:
  - Given a date key, Foreman outputs the same matrix deterministically.
  - Capped collections (>= 75 published pages) are throttled to weekly (first run of week).
  - Uncapped collections are scheduled daily (for scheduled days).

### Story A.3 — Implement Designer (Auto-Genesis) dry-run
- **Description**: Designer inspects scheduled matrix items and reports what it would create/update (prompt config + `_index.md`) without writing changes.
- **Targets**: `scripts/morning-routine/tasks/design-collection.ts` (new)
- **Acceptance criteria**:
  - In dry-run, Designer produces a clear diff-like report per collection with bounded scope.
  - No repo files are modified when dry-run is enabled.

### Story A.4 — Implement Designer write-mode (bounded, non-destructive)
- **Description**: Enable Designer to actually create missing prompt configs and `_index.md` scaffolding.
- **Acceptance criteria**:
  - Only missing files are created by default; updates are limited to explicit fields.
  - Re-running Designer is idempotent (no repeated churn, no widening scope).

### Story A.5 — Workflow integration: Setup & Genesis job
- **Description**: Add a workflow stage that runs Foreman then Designer before production.
- **Acceptance criteria**:
  - When enabled, the matrix used by production is sourced from Foreman output.
  - When disabled, workflow falls back to the existing hardcoded matrix unchanged.
  - Any files modified/created by this stage are included in the commit strategy (artifact/commit fix if needed).

---

## Phase B (Production safety): Critic QA (observe → enforce fail-fast)

### Story B.1 — Create Art Critic agent module (structured QA output)
- **Description**: Create a new `.agents/art-critic/` with a rubric and structured output schema.
- **Acceptance criteria**:
  - Agent returns a validated JSON structure (pass/fail + reasons + confidence).
  - Output is deterministic enough for logging and aggregation (bounded enums for reasons).

### Story B.2 — QA observe mode (no rejects, no halts)
- **Description**: Integrate QA into the pipeline in observe-only mode and emit metrics.
- **Acceptance criteria**:
  - QA runs on generated candidates and produces logs/summary metrics.
  - No assets are rejected; production output remains baseline-equivalent.

### Story B.3 — Rejection sink: route rejected assets + Trash Can logging
- **Description**: Implement rejected routing to R2 + machine-parseable Issue #4 comments.
- **Acceptance criteria**:
  - Rejected assets land under a deterministic rejected prefix (PRD-defined).
  - Issue #4 comment format is stable, versioned, and machine-parseable.
  - Survivors and rejected are clearly separated in reporting.

### Story B.4 — Enforce reject-only mode
- **Description**: Turn QA decisions into gating with **1-strike fail-fast**: on first QA failure, reject+log and halt the collection for the run.
- **Acceptance criteria**:
  - A failing QA candidate does not proceed to finishing/publishing.
  - The failure is logged to Issue #4 with the reason (machine-parseable format).
  - The collection stops generating further candidates for the remainder of the run.
  - The workflow continues processing other collections.

---

## Phase C (JIT finishing): post-QA packaging and naming

### Story C.1 — Define naming/identity policy (markdown + optional asset rename)
- **Description**: Define canonical slugging rules and deduplication keys across retries.
- **Acceptance criteria**:
  - A stable “asset identity” definition exists (what constitutes “the same” output).
  - Retry behavior is defined and demonstrably idempotent.

### Story C.2 — Finisher: bounded SEO updates + deterministic renaming
- **Description**: Ensure post-QA finishing updates only allowed fields and handles collisions predictably.
- **Targets**: `.agents/seo-copywriter/` (existing), `scripts/morning-routine/tasks/seo-review-batch.ts` (existing)
- **Acceptance criteria**:
  - Finisher does not remove or corrupt critical URLs (`image_url`, `download_url`, `r2_original`).
  - Finisher is best-effort by policy and does not block the daily run.

### Story C.3 — JIT PDF policy decision and implementation
- **Description**: Align implementation with PRD: decide whether PDFs are created at generation time or post-QA only.
- **Acceptance criteria**:
  - PRD vNext stance is enforced by code: either transitional (allow PDFs pre-QA) or true JIT (PDF only for survivors).
  - If true JIT: PDF generation is gated post-QA and is retry-safe.

---

## Phase D (Feedback loops): Architect immunization

### Story D.1 — Versioned issue schemas + parsers
- **Description**: Standardize Issue #4 (Trash Can) comment schemas and implement robust parsing with schema versioning.
- **Acceptance criteria**:
  - Parser tolerates noise outside the structured block but reliably extracts schema fields.
  - Schema changes require explicit version bumps.
  - **Note**: Issue #2 is not part of this story; it remains external reporting.

### Story D.2 — Immunization rules (bounded edits, safe rollout)
- **Description**: Implement weekly self-healing with strict caps and rollback friendliness.
- **Acceptance criteria**:
  - Edits per run are capped and logged.
  - The system can be disabled without side effects.
  - Edits demonstrably reduce targeted rejection reasons over time.

---

## Phase E (Syndication): Distributor (Make.com)

### Story E.1 — RSS contract for distribution (fields + UTM schema)
- **Description**: Define the exact RSS fields needed for Make.com posting and the UTM schema.
- **Acceptance criteria**:
  - A stable RSS “contract” exists and is testable (sample item meets requirements).

### Story E.2 — Make.com scenario configuration + monitoring
- **Description**: Configure the Make.com RSS monitor → Pinterest posting, with failure visibility.
- **Acceptance criteria**:
  - New content results in posts with correct URLs + UTM parameters.
  - Failure alerts exist and do not affect production generation.

---

## Phase F (Optional): Dashboarding

### Story F.1 — Local dashboard: status and caps visibility
- **Description**: Provide a local dashboard view: active vs capped collections, recent rejects, fail-fast halts.
- **Acceptance criteria**:
  - Dashboard reflects current repo and issue-ledger state accurately.
  - No secrets are exposed; read-only by default.


