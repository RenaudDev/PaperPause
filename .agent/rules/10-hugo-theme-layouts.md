---
trigger: glob
globs: themes/visual-sanctuary-theme/layouts/**, hugo.toml
---

# Hugo Theme Layout Rules (Globbed)

Recommended activation: **Glob** 
- `themes/visual-sanctuary-theme/layouts/**`
- `hugo.toml`

## Where to edit
- Layouts and partials: `themes/visual-sanctuary-theme/layouts/**`
- Do not edit `layouts/**` (root) for new/changed templates.

## Template safety & robustness
- Treat frontmatter as optional. Use nil-safe patterns:
  - Prefer `{{ with .Params.someField }}` over direct access.
  - Provide sensible defaults where UX/SEO requires a value.
- Treat user-controlled fields as untrusted when rendering:
  - If surfacing `prompt` or similar text, escape/sanitize (e.g., `plainify`, `htmlEscape`).

## SEO & output formats
- `themes/visual-sanctuary-theme/layouts/partials/head.html` is the canonical place for meta/OG/Twitter tags.
- The site supports Markdown output format (`MARKDOWN`) and advertises it with `<link rel=\"alternate\">` when available.
  - Avoid breaking `.OutputFormats.Get \"MARKDOWN\"` usage.

## Styling conventions
- Prefer Tailwind utility classes.
- Inline styles are allowed only when necessary for a small, localized UI behavior (keep them minimal).


