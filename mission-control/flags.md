# Feature Flags (Mission Control)

These flags control the autonomy rollout. They are set in:
- CI: `.github/workflows/daily-generate-and-optimize.yml` (env / step env)
- Local: your shell environment / `.dev.vars` (only for flags you want local defaults for)

## Flags
- `ENABLE_FOREMAN` (default: 0)
- `ENABLE_DESIGNER` (default: 0)
- `DESIGNER_DRY_RUN` (default: 1)
- `ENABLE_QA` (default: 0)
- `QA_MODE` (`observe` or `enforce_failfast`)
- `ENABLE_FINISHING` (default: 0)
- `ENABLE_PDF` (default: 0 until strict JIT is implemented)
- `ENABLE_IMMUNIZATION` (default: 0)

## Week 1 Fantasy dry-run (recommended)
- Goal: see what Foreman + Designer would do for `fantasy/*` without generating/publishing Fantasy assets.
- Schedule: put Fantasy in `dry_run_collections` in `mission-control/rollout-schedule.md`.
- Flags:
  - `ENABLE_FOREMAN=1`
  - `ENABLE_DESIGNER=1`
  - `DESIGNER_DRY_RUN=1`


