# Repo Knowledge Map (PaperPause)

This document is a **concise map of the repo**: what each area does, what must never be violated, and the shortest set of commands and “how things work” facts you need to make safe changes.

## Architecture snapshot
- **Site**: Hugo static site (theme = `visual-sanctuary-theme`).
- **Frontend**: Tailwind CSS + Alpine.js.
- **Automation**: TypeScript scripts under `scripts/` (daily generation + SEO + publishing).
- **Hosting**: Cloudflare Pages (build output is `public/`), with Cloudflare R2 + Cloudflare Images for assets (`wrangler.toml`).
- **Ops control plane**: `mission-control/` (flags, schedules, schemas, logs pointers).

## Repo topology (where things live)
- **Hugo content**: `content/`
  - Collections are directories like `content/animals/cats/`
  - Collection metadata is `content/<category>/<collection>/_index.md`
  - Generated pages are `content/<category>/<collection>/*.md` (excluding `_index.md`)
- **Hugo theme (canonical layouts)**: `themes/visual-sanctuary-theme/layouts/`
  - Page templates: `themes/visual-sanctuary-theme/layouts/_default/*`
  - Shared partials: `themes/visual-sanctuary-theme/layouts/partials/*`
- **Hugo root layouts**: `layouts/`
  - Exists, but **must not be used for new/changed layouts** (see invariants).
- **Theme assets**: `themes/visual-sanctuary-theme/assets/`
  - Tailwind input CSS lives here: `themes/visual-sanctuary-theme/assets/css/main.css`
- **Built assets / generated build output**:
  - Tailwind output: `assets/css/main.css` (built from theme input)
  - Hugo output: `public/`
  - Hugo resources cache: `resources/`
- **Automation scripts**: `scripts/`
  - Daily pipeline: `scripts/morning-routine/`
    - Tasks: `scripts/morning-routine/tasks/*`
    - Shared libs: `scripts/morning-routine/lib/*`
    - Config/prompts: `scripts/morning-routine/config/*`
- **CI**: `.github/workflows/daily-generate-and-optimize.yml`
- **Ops “control plane”**: `mission-control/`
  - Flags reference: `mission-control/flags.md`
  - Rollout schedule (Foreman input): `mission-control/rollout-schedule.md`
  - Logs (artifact in CI): `mission-control/logs/`
  - Schemas: `mission-control/schemas/*`
- **Internal docs**: `.docs/` (PRD, tasks, guides, implementation summaries)
- **Mini AI baseline**: `.ai-rules.md`

## Non-negotiable invariants (must preserve)
### Theme-first Hugo layouts
- **Single source of truth** for layouts is `themes/visual-sanctuary-theme/layouts/`.
- Do **not** create/modify root `layouts/` overrides that shadow the theme.
- Rationale: prevents “split-brain” layout logic. (See `.ai-rules.md`.)

### Secrets never committed
- No API keys in git.
- Local secrets: `.dev.vars` (loaded by `scripts/morning-routine/config/env.ts`).
- CI secrets: GitHub Actions secrets → written into `.dev.vars` inside the workflow.

### Baseline daily pipeline invariants
From `.docs/prd/baseline-contract.md`:
- Daily cron: **5:00 AM ET / 10:00 UTC**.
- Steps: Generate → SEO (best-effort) → Commit.
- Artifacts: manifests in `scripts/morning-routine/.runs/`, content in `content/**`.

### Taxonomy guardrails
From `scripts/validate-taxonomy.ts`:
- Content frontmatter **must not** include deprecated `tags`.

## How the daily pipeline works (mental model)
### GitHub Actions flow
`.github/workflows/daily-generate-and-optimize.yml`:
- **setup job**: installs deps, builds `.dev.vars`, runs Foreman scheduling (`production-schedule.ts`), optionally runs Designer.
- **generate job** (matrix): runs `generate-batch.ts` per `category/collection`, then runs SEO (`seo-review-batch.ts`) best-effort, then validates taxonomy.
- **commit job**: downloads artifacts and commits `content/` changes.

### Foreman scheduling (matrix)
`scripts/morning-routine/tasks/production-schedule.ts`:
- Parses `mission-control/rollout-schedule.md`
- Applies “capped collection” throttling (skip most days if >= 75 items; include on Monday).
- Emits **production matrix** + **designer matrix** (includes dry-run collections).

## Local commands (canonical)
From `package.json`:
- **Dev**: `npm run dev`
- **Build**: `npm run build` (CSS → Hugo → Pagefind)
- **Preview**: `npm run preview` (Wrangler Pages dev)
- **Dashboard**: `npm run dashboard`
- **Generate**: `npm run generate:batch` (alias: `npm run generate`)
- **SEO**: `npm run seo:one`, `npm run seo:batch`
- **Publish drafts**: `npm run publish:drafts`
- **Validate**: `npm run validate` (`validate:env` + `validate:taxonomy`)

## “Where should I make this change?”
- **SEO/meta/open graph**: `themes/visual-sanctuary-theme/layouts/partials/head.html`
- **Single page UI**: `themes/visual-sanctuary-theme/layouts/_default/single.html`
- **Section list UI**: `themes/visual-sanctuary-theme/layouts/_default/list.html`
- **CSS/theme styling**: `themes/visual-sanctuary-theme/assets/css/main.css` (then run `npm run build:css`)
- **Generation behavior**: `scripts/morning-routine/tasks/generate-batch.ts` and `scripts/morning-routine/lib/*`
- **Scheduling / rollout**: `mission-control/rollout-schedule.md` + `scripts/morning-routine/tasks/production-schedule.ts`

## Source-of-truth docs to consult before risky changes
- `.ai-rules.md` (architecture mini-baseline)
- `.docs/prd/baseline-contract.md` (rollback target)
- `mission-control/flags.md` and `mission-control/rollout-schedule.md` (autonomy knobs)
- `.docs/docs/DAILY_WORKFLOW_SETUP.md` (current operational workflow)


