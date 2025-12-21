# Mission Control

This folder is the **operational control plane** for PaperPause autonomy.

## What belongs here
- **Schedules**: what collections are active by week (Foreman input)
- **Agent settings**: knobs/constraints for agents (e.g., prompt budgets, QA modes)
- **Schemas**: machine-parseable formats for ledgers (Issue #4 Trash Can)
- **Log pointers**: where runtime logs/manifests live (without committing secrets)

## What does NOT belong here
- Secrets (no API keys). Use `.dev.vars` locally and GitHub Secrets in CI.

## Canonical files
- Rollout schedule: `mission-control/rollout-schedule.md`
- Flags reference: `mission-control/flags.md`
- Issue #4 schema: `mission-control/schemas/trashcan_v1.json`


