---
description: Troubleshoot and remediate media asset issues (R2 uploads, R2 delivery, Cloudflare Images upload/delivery, PDFs).
---

# media-asset-workflow

## Context (how the pipeline works today)
- Generation uploads **PNG → R2**, then attempts **PDF → R2** (best-effort), then attempts **Cloudflare Images** (best-effort).
- Frontmatter fields written during generation:
  - `r2_original` (R2 PNG URL)
  - `image_url` (CF Images desktop variant if available; otherwise falls back to `r2_original`)
  - `cf_image_id` (empty string if CF Images upload failed / not configured)
  - `download_url` (R2 PDF URL or empty string if PDF generation failed)

## Quick triage (pick the symptom)
- A) Upload failures during generation (job logs show `[R2] Upload Failed` or `[CF Images] ❌ Upload failed`)
- B) Delivery broken after upload (URLs 404/403/time out)
- C) Wrong folder/case issues (e.g., `/Dogs/` vs `/dogs/`)
- D) Missing PDFs (`download_url` empty or `has_pdf` missing/false)
- E) Markdown/frontmatter drift (URLs don’t match where the file actually lives)

## Step 0 — Validate environment (local or CI)
- Run: `npm run validate:env`
- Required for R2:
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Optional for CF Images:
  - `CF_IMAGES_ACCOUNT_ID`, `CF_IMAGES_API_TOKEN`, `CF_IMAGES_ACCOUNT_HASH`
  - If missing, CF Images is expected to be disabled and `image_url` should fall back to `r2_original`.

## Step 1 — Identify a single “known bad” asset
Pick one markdown file and capture:
- `cf_image_id`, `image_url`, `r2_original`, `download_url`
- Expected collection folder (derived from generation call: `uploadImage(..., collection)`)

## Step 2 — Determine which system is failing
- If `r2_original` fails but `image_url` succeeds:
  - likely frontmatter drift (pointing at the wrong R2 path) OR R2 public delivery issues.
- If `image_url` fails but `r2_original` works:
  - Cloudflare Images delivery issue (variant, account hash, deleted image, propagation delay).
- If both fail:
  - likely key mismatch/case mismatch, object missing in R2, or `R2_PUBLIC_URL` misconfigured.

## Step 3 — Remediation playbooks

### A) Cloudflare Images is missing / broken
Use when:
- `cf_image_id` is empty, OR `image_url` is an `imagedelivery.net/...` URL that 404s.

Actions:
- Confirm CF Images vars exist (`CF_IMAGES_*`).
- If a batch of pages are missing `cf_image_id`, backfill them:
  - Run: `npx ts-node scripts/morning-routine/tasks/reinitialize-cf-images.ts`
  - Notes:
    - This script uploads PNGs from R2 to CF Images and updates `cf_image_id` + `image_url` in markdown.
    - Verify it’s targeting the right content location and correct R2 key conventions for your collections (it currently assumes an R2 key under `cats/`).

Operational checks:
- Confirm CF Images variants exist in the Cloudflare dashboard for:
  - `desktop`, `mobile`, `thumbnail`, `rss`, `pinterest`
  - A missing variant commonly presents as delivery 404 even when the image exists.

### B) R2 object exists but delivery behavior is wrong (inline vs download, bad headers)
Use when:
- URLs load but content-type/disposition behavior is wrong.

Actions:
- If this is isolated to a handful of keys, run the metadata fixer:
  - Run: `npx ts-node scripts/morning-routine/tasks/fix-r2-metadata.ts`
  - Notes:
    - This script is currently hardcoded to a small list; expand it if you want it as a general tool.

### C) Case-mismatch problems (R2 keys / URLs)
Use when:
- Older assets live under capitalized folders in R2 (`Dogs/`, `Horses/`, etc.)
- Frontmatter URLs contain capitalized paths.

Actions:
- Migrate R2 keys to lowercase:
  - Dry run: `npx ts-node scripts/morning-routine/tasks/migrate-r2-case.ts --dry-run`
  - Apply: `npx ts-node scripts/morning-routine/tasks/migrate-r2-case.ts`
- Fix markdown URLs:
  - Dry run: `npx ts-node scripts/morning-routine/tasks/fix-frontmatter-case.ts --dry-run`
  - Apply: `npx ts-node scripts/morning-routine/tasks/fix-frontmatter-case.ts`

### D) Missing PDFs / broken `download_url`
Use when:
- `download_url` is empty or PDFs are missing for older content.

Actions:
- Backfill PDFs:
  - Run: `npx ts-node scripts/morning-routine/tasks/backfill-pdfs.ts`
  - This downloads PNG via `r2_original`, converts to PDF, uploads to R2, and updates frontmatter (`download_url`, `has_pdf: true`).

## Step 4 — Verify and close the loop
- Re-check the single “known bad” asset:
  - `r2_original` loads
  - `image_url` loads (or is correctly falling back to R2)
  - `download_url` loads (if expected)
- If a systemic fix was applied (migration/backfill), run:
  - `npm run validate:taxonomy`

## Optional hardening follow-ups (non-incident)
- Add npm scripts for the remediation tools (reinit CF images, migrate R2 case, fix frontmatter case, backfill PDFs).
- Add better “key exists” checks + retries around network operations (R2/CF) and emit a concise per-asset summary in logs.