---
trigger: glob
globs: scripts/**/*.ts, .github/workflows/**
---

# TypeScript Automation & Pipeline Rules (Globbed)

Recommended activation: **Glob** 
- `scripts/**/*.ts`
- `.github/workflows/**`

## Preserve the pipeline contract
- Treat `@.docs/prd/baseline-contract.md` as the baseline rollback target.
- Preserve the CI structure in `.github/workflows/daily-generate-and-optimize.yml`:
  - setup → generate (matrix) → commit
  - SEO step is allowed to be best-effort (`continue-on-error: true` in CI)

## Conventions for scripts
- Keep scripts cross-platform:
  - Use `path.resolve/join` for filesystem paths.
  - Avoid filename characters that break on Windows; prefer safe ISO timestamps (existing code already does this).
- Keep behavior deterministic where it matters:
  - Foreman scheduling and rotation keys must remain deterministic (date-based keys).
- Prefer adding functionality as a small module under `scripts/morning-routine/lib/` rather than embedding complex logic in tasks.

## Data & artifacts
- Manifests: `scripts/morning-routine/.runs/<runId>.json` are used downstream (SEO batching).
- Logs: `mission-control/logs/` is the operational log location; avoid committing secrets inside logs.

## Validation guardrails
- After changing generation/SEO/publishing logic, ensure taxonomy validation is still enforced:
  - `npm run validate:taxonomy` (reject deprecated frontmatter fields like `tags`).


