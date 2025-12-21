---
description: Safely modify Hugo templates/partials in the theme-first architecture.
---

# hugo-template-change

## Steps
1. Confirm the target file lives in the theme:
   - Use `themes/visual-sanctuary-theme/layouts/**`
   - Do NOT modify/create root `layouts/**` overrides.
2. Locate the canonical template/partial:
   - Single page UI: `themes/visual-sanctuary-theme/layouts/_default/single.html`
   - Section lists: `themes/visual-sanctuary-theme/layouts/_default/list.html`
   - Shared meta/SEO: `themes/visual-sanctuary-theme/layouts/partials/head.html`
3. Apply robust Hugo patterns:
   - Use `with` for optional params, and provide defaults when needed.
   - Treat user-controlled text as untrusted if rendering it (escape/sanitize).
4. Verify locally:
   - `npm run dev` and spot-check relevant pages
   - `npm run build` to confirm the production build succeeds
5. Update docs:
   - If behavior changed, update `.docs/docs/IMPLEMENTATION_SUMMARY.md` or add a focused doc in `.docs/docs/`.


