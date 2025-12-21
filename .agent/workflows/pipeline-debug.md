---
description: Triage and fix failures in the daily GitHub Actions pipeline.
---

# pipeline-debug

## Steps
1. Identify where it failed in `.github/workflows/daily-generate-and-optimize.yml`:
   - `setup` (Foreman / Designer / secrets)
   - `generate` (per-collection matrix jobs)
   - `commit` (artifact restore / git commit)
2. Check env/secrets assumptions:
   - Confirm CI writes `.dev.vars` correctly (no missing secret names).
   - Confirm required secrets exist (GEMINI, R2, CF Images).
3. If Foreman scheduling looks wrong:
   - Inspect `mission-control/rollout-schedule.md`
   - Inspect `scripts/morning-routine/tasks/production-schedule.ts`
4. Reproduce locally (when possible):
   - `npm ci`
   - Create `.dev.vars` (copy from `.dev.vars.example` + fill secrets)
   - Run the failing task directly (e.g., `npm run generate:batch` or `npm run seo:batch`)
5. Validate guardrails:
   - Always run `npm run validate:taxonomy` before committing a pipeline fix.
6. Document recurring issues:
   - Add/extend a doc in `.docs/docs/` describing the incident pattern and fix.


