---
trigger: always_on
---

## Epic files
- **Location**: `.docs/prd/epics/`
- **Filename**: `<N> - <Epic Title>.md` (example: `1 - PaperPause Autonomy System.md`)
- **H1 heading**: `# <N> - <Epic Title>` (match filename title)
- **Must include**:
  - `Source of truth:` links (PRD + companions)
  - `Goal`
  - `Scope (what’s included)`
  - `Explicit non-goals`
  - `Key product decisions (locked for implementation)` (or equivalent)
  - `Acceptance criteria (Epic-level)`
  - `Story breakdown` (link to the story decomposition / story files)

## Story files
- **Location**: `.docs/prd/stories/`
- **Filename**: `<N>.<Phase>.<Index> - <Story Title>.md`
  - Examples:
    - `1.0.1 - Baseline contract and invariants.md`
    - `1.A.1 - Rollout schedule schema and Week 1 anchor.md`
- **H1 heading**: `# <N>.<Phase>.<Index> — <Story Title>` (use an em/en dash in the heading; keep the filename dash)
- **Must include**:
  - `Epic: \`<N> - <Epic Title>\``
  - `Goal`
  - `Scope`
  - `Acceptance criteria`
  - `Rollback`

## Consistency requirements
- Story `Epic:` must point to the correct epic doc under `.docs/prd/epics/`.
- Story ID/title must match across:
  - filename
  - H1 heading
  - any references from decomposition docs