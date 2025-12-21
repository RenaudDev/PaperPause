---
description: Add a new collection end-to-end (prompts, content structure, rollout, validation).
---

# add-new-collection

## Steps
1. Decide the path:
   - Collection path must be `category/collection` (e.g., `animals/rabbits`).
2. Create collection content structure:
   - Ensure `content/<category>/<collection>/_index.md` exists.
   - Add any collection-level metadata needed by scripts (e.g., batch size, templates).
3. Add prompt config:
   - Add prompt JSON under `scripts/morning-routine/config/prompts/`.
   - Ensure it’s wired so `loadPrompt(category, collection)` can find it.
4. Update rollout schedule (Foreman input):
   - Add `category/collection` under the appropriate week in `mission-control/rollout-schedule.md`.
   - If it’s a dry run only, put it under `dry_run_collections`.
5. (If needed) update CI behavior:
   - Prefer letting Foreman determine the matrix rather than hardcoding lists.
6. Validate + smoke test:
   - `npm run validate`
   - Run a small generation batch locally for the new collection.
7. Document:
   - Update `.docs/docs/IMPLEMENTATION_SUMMARY.md` and/or add a focused doc in `.docs/docs/`.


