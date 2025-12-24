# Logs and Manifests (Where to Look)

This system produces logs in multiple places:

## CI (GitHub Actions)
- Workflow logs: GitHub Actions run output
- Workflow summary: `$GITHUB_STEP_SUMMARY`

## Repo-local manifests
- Generation manifest: `scripts/morning-routine/.runs/<runId>.json`

## Issue ledgers
- Rejection ledger (machine-parseable): Issue #4 comment JSON blocks (`trashcan_v1`)

## Notes
- Do not commit secrets or large log dumps to git.


