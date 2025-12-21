---
trigger: always_on
---

# PaperPause Repo Invariants (Always On)

Recommended activation: **Always On** 

## Canonical architecture rules
- **Theme-first layouts are mandatory**:
  - All Hugo templates/partials MUST be edited/created under `themes/visual-sanctuary-theme/layouts/`.
  - DO NOT create or modify Hugo layout overrides under the repo root `layouts/` directory.
  - Rationale: root layouts shadow the theme, causing split-brain behavior.
  - Reference: `@.ai-rules.md`

- **Document behavioral changes**:
  - Any change that impacts rendering, SEO, automation behavior, or pipeline invariants MUST be documented in `.docs/` (add/update a relevant doc in `.docs/docs/` or `.docs/prd/`).

## Safety & secrets
- **Never commit secrets** (API keys, tokens, account IDs, etc.).
- Local secrets belong in `.dev.vars` (loaded by `scripts/morning-routine/config/env.ts`).
- CI secrets belong in GitHub Actions secrets (written into `.dev.vars` by `.github/workflows/daily-generate-and-optimize.yml`).

## Preserve baseline pipeline invariants
- Baseline contract is the rollback target: `@.docs/prd/baseline-contract.md`
- Do not break:
  - Daily schedule timing (5 AM ET / 10 AM UTC)
  - Generate → SEO (best-effort) → Commit flow
  - Manifests and logs conventions

## Quick repo map
Reference: `@.docs/docs/REPO_KNOWLEDGE_MAP.md`


