---
description: Run SEO metadata generation/cleanup safely and consistently.
---

# seo-metadata-pass

## Steps
1. Decide scope:
   - Single page/collection: use `npm run seo:one`
   - Batch/collection: use `npm run seo:batch`
2. Prefer manifest-driven SEO when available:
   - In CI, SEO uses a manifest from `scripts/morning-routine/.runs/<runId>.json` when present.
3. Treat SEO as best-effort in CI:
   - Local runs should still be reviewed; CI is allowed to continue-on-error.
4. Validate taxonomy after SEO changes:
   - Run `npm run validate:taxonomy`
5. Spot-check output:
   - Verify titles/descriptions look reasonable and slugs/renames match expectations.
6. Document meaningful behavior changes:
   - Update `.docs/docs/IMPLEMENTATION_SUMMARY.md` or add a targeted doc under `.docs/docs/`.


