# Product Requirements Document (PRD): Collection UX Overhaul

**Version:** 1.0

**Date:** December 27, 2025

**Status:** Draft

**Owner:** Product / Front-End

---

## 1) Executive Summary

### Objective
Transform the collection browse experience from an infinite-scroll gallery into a high-performance **"Archive/Vault"** architecture that gracefully handles 50+ collections with 75+ pins each, while maximizing SEO visibility for deep content.

### Non-negotiable constraints
- **Core Web Vitals**: New pagination/vault logic must preserve LCP, CLS, and INP scores.
- **Filter compatibility**: Client-side style filters must continue to work across the full item set.
- **SEO floor**: 2,000-word collection articles must remain indexable and visible to crawlers.
- **Theme-first**: All layout changes live in `themes/visual-sanctuary-theme/layouts/` per repo invariants.

### Why now?
At scale (50+ collections × 75+ items), infinite scroll hides the footer (SEO article, nav links) and degrades mobile UX. This PRD locks in the "Expandable Vault" pattern before content density becomes a problem.

---

## 2) Glossary

| Term | Definition |
|------|------------|
| **Vault** | The complete set of items in a collection, regardless of visible/hidden state |
| **Soft Pagination** | Frontend-only pagination via show/hide; no server-side route changes |
| **Split Content** | Header description + Gallery + Footer article layout pattern |
| **Collections Tree** | Sidebar navigation showing Site Sections and Sub-sections |
| **Visual Index** | Dense 1:1 tile grid for parent collection pages (e.g., `/animals/`) |

---

## 3) Problem Statement

### Current state
- **Infinite scroll** on collection pages loads all items sequentially.
- Footer content (SEO article, site nav) is pushed below 75+ images → never seen.
- Navigation between sibling collections requires returning to parent or home.
- Parent collection pages use large cards → low density, wasted screen real estate.

### Target state
- Initial view is capped to **24 items** (fast LCP, focused attention).
- **"Show All" button** expands the full vault on demand.
- Filters **force-expand** automatically to search the entire vault.
- 2,000-word SEO articles render **below the gallery**, visible without infinite scroll.
- **Sidebar navigation tree** enables lateral collection browsing.
- **Visual Index tiles** maximize density on parent pages.

---

## 4) Key Product Decisions (Locked for Implementation)

### 4.1 The "Expandable Vault" (Soft Pagination)

**Constraint**: Standard server-side pagination breaks client-side filters. Infinite scroll hides the footer.

**Solution**: Load all items (~75 max) but strictly limit the initial view to **24 items**.

**Mechanism**:
1. Render items >24 with the class `hidden`.
2. Hidden images **MUST** have `loading="lazy"` to prevent downloading until revealed (preserving Core Web Vitals).

**Interaction**:
- **"Show All" Button**: Placed after item #24. Clicking removes the `hidden` class from all items and hides the button itself.
- **Filter Override**: If a user selects a filter, the script must automatically **force-expand** the list to search/show *all* matching items in the vault.

### 4.2 Split Content Architecture (SEO & UX)

**Goal**: Display a high-impact header description AND a deep-dive 2,000-word SEO article at the bottom, without burying the gallery.

**Implementation**:
- **Header**: Primary text pulls from the frontmatter `description` field.
- **Intro (Optional)**: Secondary text pulls from markdown content *before* the `<!--more-->` delimiter.
- **Footer (Deep Article)**: The bulk of the content (SEO article) pulls from markdown content *after* the `<!--more-->` delimiter.

**Layout Flow**:
```
Header (description) → Intro (optional) → Sidebar/Gallery → Deep Article (SEO) → Footer
```

### 4.3 Navigation & Density

**Sidebar Collections Tree**:
- Add a collapsible "Collections Tree" to the sidebar listing all Site Sections and Sub-sections.
- Enables lateral navigation (e.g., Cats → Dogs) without returning to Home.

**Visual Index for Parent Pages**:
- For parent collections (e.g., `/animals/`), replace large cards with a dense grid of **Square Tiles (1:1 aspect ratio)** with text overlays.
- Maximizes above-the-fold density and discovery.

---

## 5) Scope

### In scope
- Refactor `themes/visual-sanctuary-theme/layouts/_default/list.html` to implement:
  - Split content layout (Header → Intro → Gallery → Deep Article)
  - Expandable Vault with 24-item initial cap
  - "Show All" button rendering
- Update `themes/visual-sanctuary-theme/static/css/main.css`:
  - Visual Index grid styles (1:1 tiles with text overlay)
  - Hidden/visible transition styles
- Update or create filter JavaScript to handle:
  - "Show All" button click
  - Force-expand on filter selection
- Create sidebar partial for Collections Tree navigation
- Create Visual Index partial for parent collection grids

### Out of scope
- Backend pagination routes or SSR changes
- Changes to single page layout (`single.html`)
- RSS/distribution pipeline changes
- New agent development

---

## 6) Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R1**: DOM size with 500+ items degrades performance | Low | High | Hard cap at 300 items per collection; server-side pagination if ever exceeded (not expected for 5 years) |
| **R2**: Filter JS fails to force-expand vault | Medium | Medium | Clear acceptance criteria; isolated unit tests for filter expansion logic |
| **R3**: `<!--more-->` delimiter missing breaks layout | Medium | Low | Graceful fallback: render all content in footer section if delimiter absent |
| **R4**: Sidebar tree clutters mobile view | Low | Medium | Mobile: collapse tree by default, show only on tap |

---

## 7) Acceptance Criteria (PRD-level)

- [ ] Collection pages load with exactly 24 items visible; remaining items are hidden with `loading="lazy"`.
- [ ] "Show All" button appears after item #24 and reveals all hidden items on click.
- [ ] Selecting a style filter forces the vault to expand and displays all matching items.
- [ ] `description` frontmatter field renders as header; `<!--more-->` delimiter splits intro from deep article.
- [ ] Sidebar displays collapsible Collections Tree with all sections and sub-sections.
- [ ] Parent collection pages (e.g., `/animals/`) render children as 1:1 square tiles with text overlays.
- [ ] Core Web Vitals (LCP, CLS, INP) remain green on PageSpeed Insights for collection pages.

---

## 8) Story Breakdown

| Story | Title | Description |
|-------|-------|-------------|
| 3.0.1 | Layout Skeleton & Split Content Logic | Refactor `list.html` to implement Header → Intro → Gallery → Deep Article layout with `<!--more-->` delimiter support |
| 3.0.2 | The Expandable Vault | Implement 24-item cap, hidden class, lazy loading, "Show All" button, and filter force-expand |
| 3.0.3 | Sidebar Navigation Tree | Create collapsible sidebar partial listing all collections with lateral navigation |
| 3.0.4 | Visual Index (Dense Sub-collection Grid) | Create 1:1 square tile grid for parent collection pages |

Full story files: `.docs/prd/stories/3.0.1 - Layout Skeleton and Split Content Logic.md`, etc.

---

## 9) Dependencies

- No external dependencies.
- **Internal**: Stories must be implemented in order (3.0.1 → 3.0.2 → 3.0.3 → 3.0.4) as each builds on the previous layout structure.

---

## 10) Implementation Notes

### Hugo template patterns
- Use `{{ .Description }}` for header description.
- Use `{{ .Summary }}` for intro (content before `<!--more-->`).
- Use `{{ .Content }}` minus summary for deep article.
- Use `{{ .Site.Sections }}` and `{{ .Sections }}` for Collections Tree.

### JavaScript considerations
- Filter module should export a `forceExpandVault()` function callable from filter handlers.
- Use `IntersectionObserver` if lazy reveal optimizations are needed beyond native `loading="lazy"`.

---

## 11) Related Documents

- Epic: `.docs/prd/epics/3 - Collection UX Overhaul.md`
- Repo invariants: `.ai-rules.md`
- Task prompt: `.docs/tasks/content-scaling.md`
