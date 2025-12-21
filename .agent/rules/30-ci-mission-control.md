---
trigger: glob
globs: .github/workflows/**, mission-control/**
---

# CI + Mission Control Rules (Globbed)

Recommended activation: **Glob** 
- `.github/workflows/**`
- `mission-control/**`

## Mission control is the control plane
- `mission-control/flags.md` is the authoritative flag reference.
- `mission-control/rollout-schedule.md` is the authoritative rollout schedule input (Foreman).
- Do not introduce ambiguous schedule formats; keep lists explicit and parseable.

## Foreman invariants
- Foreman scheduling is deterministic and date-based:
  - It parses `mission-control/rollout-schedule.md`
  - It applies capping/throttling rules (e.g., capped collections skip most days)
- If you change schedule semantics, update the schedule parser (`scripts/morning-routine/tasks/production-schedule.ts`) and update docs.

## CI safety
- Preserve `NODE_VERSION` and the `.dev.vars` injection approach in CI.
- Never echo secrets into logs.


