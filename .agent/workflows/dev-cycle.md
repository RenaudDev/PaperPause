---
description: Run the fastest safe local loop for PaperPause changes.
---

# dev-cycle

## Steps
1. Validate local environment:
   - Run `npm run validate:env`
2. Pick the right local mode:
   - For template/UI work: `npm run dev`
   - For pipeline/TS work: run the specific script via `npm run <script>`
3. Run the relevant validators:
   - Always run `npm run validate:taxonomy` after changes that generate/edit `content/**`
4. Full build gate (when ready):
   - Run `npm run build`
5. If working on Cloudflare Pages behavior:
   - Run `npm run preview`


