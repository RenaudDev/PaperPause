# Product Requirements Document (PRD): Collection UX Overhaul

**Version:** 1.1

**Date:** December 27, 2025

**Status:** Draft

**Owner:** Product / Front-End

---

## 1) Executive Summary

### Objective
Transform the collection browse experience from an infinite-scroll gallery into a high-performance **"Archive/Vault"** architecture that gracefully handles 50+ collections with 75+ pins each, while maximizing SEO visibility for deep content.

### Non-negotiable constraints
- **Preserve existing UI**: The teal header and gallery grid must remain fundamentally unchanged.
- **Core Web Vitals**: Soft pagination must preserve LCP, CLS, and INP scores.
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
| **Article Zone** | Medium.com-style content area below the gallery for long-form SEO articles |
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
- **Existing teal header + gallery preserved** — only soft pagination added.
- Initial view is capped to **24 items** (fast LCP, focused attention).
- **"Show All" button** expands the full vault on demand.
- Filters **force-expand** automatically to search the entire vault.
- **Medium.com-style Article Zone** renders BELOW the gallery for 2,000-word SEO articles.
- **Sidebar navigation tree** enables lateral collection browsing.
- **Visual Index tiles** maximize density on parent pages.

---

## 4) Key Product Decisions (Locked for Implementation)

### 4.1 Preserve Existing Layout

**Constraint**: The current teal header (`bg-teal-700`) with breadcrumbs, H1, description, and the sidebar + gallery layout is already well-designed and should NOT fundamentally change.

**Decision**: All modifications are additive:
1. Add soft pagination to the gallery (Expandable Vault).
2. Add a new Article Zone BELOW the gallery.
3. Optionally add a Collections Tree to the sidebar.

**What stays the same**:
- Teal header section structure
- Description in the teal header
- Sidebar filters (left side)
- Masonry gallery grid

### 4.2 The "Expandable Vault" (Soft Pagination)

**Constraint**: Standard server-side pagination breaks client-side filters. Infinite scroll hides the footer.

**Solution**: Load all items (~75 max) but strictly limit the initial view to **24 items**.

**Mechanism**:
1. Render items >24 with the class `hidden`.
2. Hidden images **MUST** have `loading="lazy"` to prevent downloading until revealed (preserving Core Web Vitals).

**Interaction**:
- **"Show All" Button**: Placed after item #24. Clicking removes the `hidden` class from all items and hides the button itself.
- **Filter Override**: If a user selects a filter, the script must automatically **force-expand** the list to search/show *all* matching items in the vault.

### 4.3 Medium.com-Style Article Zone

**Goal**: Display a deep-dive 2,000-word SEO article below the gallery without interfering with the browsing experience.

**Implementation**:
- Add a new **Article Zone** section AFTER the gallery container (outside the `flex` wrapper).
- Article content pulls from markdown content using the `<!--more-->` delimiter:
  - Content **before** `<!--more-->`: remains in the teal header (current behavior with `.Content`).
  - Content **after** `<!--more-->`: renders in the Article Zone below the gallery.
- If no `<!--more-->` delimiter exists, no Article Zone is rendered (graceful fallback).

**Layout Flow**:
```
[Teal Header: Breadcrumbs, H1, Description, Intro Content]
         ↓
[Sidebar Filters | Gallery Grid (24 items + "Show All")]
         ↓
[Article Zone: Long-form SEO content in Medium.com style]
         ↓
[Footer]
```

**Medium.com Style Elements**:
- Centered max-width container (e.g., `max-w-3xl mx-auto`)
- Large, readable typography (18-20px body)
- Generous line height and paragraph spacing
- Subtle typographic hierarchy (H2, H3 subheadings)
- Optional: drop caps, pull quotes, horizontal rules

### 4.4 Navigation & Density

**Sidebar Collections Tree** (Optional Enhancement):
- Add a collapsible "Collections Tree" to the sidebar listing all Site Sections and Sub-sections.
- Enables lateral navigation (e.g., Cats → Dogs) without returning to Home.
- Placed ABOVE or BELOW the existing filter panel.

**Visual Index for Parent Pages**:
- For parent collections (e.g., `/animals/`), replace large cards with a dense grid of **Square Tiles (1:1 aspect ratio)** with text overlays.
- Maximizes above-the-fold density and discovery.

---

## 5) Scope

### In scope
- **Modify `list.html`** to implement:
  - Expandable Vault with 24-item initial cap and hidden overflow
  - "Show All" button rendering after item #24
  - Article Zone section below gallery (using `<!--more-->` delimiter)
- **Update filter JavaScript** to handle:
  - "Show All" button click
  - Force-expand on filter selection
- **Add CSS** for:
  - `.hidden` utility class
  - "Show All" button styling
  - Medium.com-style Article Zone typography
- **Create Visual Index partial** for parent collection grids (1:1 tiles)
- **Optional**: Sidebar Collections Tree partial

### Out of scope
- Changes to the teal header structure
- Changes to filter panel design
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
| **R3**: `<!--more-->` delimiter missing breaks layout | Low | Low | Graceful fallback: no Article Zone rendered if delimiter absent |
| **R4**: Sidebar tree clutters mobile view | Low | Medium | Mobile: collapse tree by default, show only on tap |
| **R5**: Article Zone typography clashes with site design | Low | Low | Use existing prose styles extended with Medium.com refinements |

---

## 7) Acceptance Criteria (PRD-level)

- [ ] **Existing UI preserved**: Teal header, filters sidebar, and gallery grid remain visually unchanged.
- [ ] Collection pages load with exactly 24 items visible; remaining items are hidden with `loading="lazy"`.
- [ ] "Show All" button appears after item #24 and reveals all hidden items on click.
- [ ] Selecting a style filter forces the vault to expand and displays all matching items.
- [ ] Content after `<!--more-->` delimiter renders in Medium.com-style Article Zone below gallery.
- [ ] Article Zone uses centered layout, large typography, and generous spacing.
- [ ] Parent collection pages (e.g., `/animals/`) render children as 1:1 square tiles with text overlays.
- [ ] Core Web Vitals (LCP, CLS, INP) remain green on PageSpeed Insights for collection pages.

---

## 8) Story Breakdown

| Story | Title | Description |
|-------|-------|-------------|
| 3.0.1 | Expandable Vault | Implement 24-item cap, hidden class, lazy loading, "Show All" button, and filter force-expand |
| 3.0.2 | Article Zone | Add Medium.com-style content section below gallery using `<!--more-->` delimiter |
| 3.0.3 | Sidebar Navigation Tree | Create collapsible sidebar partial listing all collections with lateral navigation |
| 3.0.4 | Visual Index | Create 1:1 square tile grid for parent collection pages |

Full story files: `.docs/prd/stories/3.0.1 - Expandable Vault.md`, etc.

---

## 9) Dependencies

- No external dependencies.
- **Internal**: Stories 3.0.1 and 3.0.2 can be implemented in parallel. Stories 3.0.3 and 3.0.4 can follow independently.

---

## 10) Implementation Notes

### Hugo template patterns
- Use Hugo's `.Summary` / `.Content` split with `<!--more-->` for Article Zone content.
- Existing `.Content` in teal header shows content before the delimiter.
- New Article Zone shows content after the delimiter using Hugo truncation.

### JavaScript considerations
- Filter module should export a `forceExpandVault()` function callable from filter handlers.
- Integration point: modify existing `updateFilters()` to call vault expansion.

### CSS patterns
- Article Zone: `prose prose-lg max-w-3xl mx-auto py-16 px-4`
- Typography: larger font size, tighter max-width, generous `leading-relaxed`

---

## 11) Related Documents

- Epic: `.docs/prd/epics/3 - Collection UX Overhaul.md`
- Repo invariants: `.ai-rules.md`
- Task prompt: `.docs/tasks/content-scaling.md`
