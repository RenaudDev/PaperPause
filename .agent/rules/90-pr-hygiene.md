---
trigger: manual
---

# PR Hygiene (Manual)

Recommended activation: **Manual** (use when preparing changes for PR / review)

## Make changes reviewable
- Prefer small, focused diffs (one feature or fix per PR). 
- Avoid mixing “refactor” with “behavior change” unless necessary.

## Always include
- **What changed**: 1–3 bullets.
- **Why**: rationale and any alternatives considered.
- **How to verify**: exact commands or pages to check.

## Documentation updates
- If behavior changes, update at least one relevant doc:
  - `.docs/docs/IMPLEMENTATION_SUMMARY.md` (high-level rollup)
  - or a dedicated doc in `.docs/docs/` for the change

## Safety checklist (quick)
- No secrets committed.
- Theme-first layouts preserved.
- Taxonomy validator still passes (no `tags` frontmatter).


