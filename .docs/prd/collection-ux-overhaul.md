# Product Requirements Document (PRD): Collection UX Overhaul

**Version:** 1.2

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
- **Schema support**: Automatically inject Article and FAQ schema when substantive content is present.
- **Theme-first**: All layout changes live in `themes/visual-sanctuary-theme/layouts/` per repo invariants.

---

## 2) Glossary

| Term | Definition |
|------|------------|
| **Vault** | The complete set of items in a collection, regardless of visible/hidden state |
| **Soft Pagination** | Frontend-only pagination via show/hide; no server-side route changes |
| **Article Zone** | Medium.com-style content area below the gallery for long-form SEO articles |
| **Collections Tree** | Sidebar navigation showing Site Sections and Sub-sections |
| **Visual Index** | Dense 1:1 tile grid for parent collection pages (e.g., `/animals/`) |
| **FAQ Schema** | JSON-LD schema (FAQPage) that allows Google to display "Rich Results" in search |

---

## 3) Problem Statement

### Current state
- **Infinite scroll** on collection pages loads all items sequentially.
- Footer content (SEO article, site nav) is pushed below 75+ images → never seen.
- Navigation between sibling collections requires returning to parent or home.
- Parent collection pages use large cards → low density, wasted screen real estate.
- SEO content is present but lack formal semantic markup (`Article`, `FAQPage`).

### Target state
- **Existing teal header + gallery preserved** — only soft pagination added.
- Initial view is capped to **24 items** (fast LCP, focused attention).
- **"Show All" button** expands the full vault on demand.
- Filters **force-expand** automatically to search the entire vault.
- **Medium.com-style Article Zone** renders BELOW the gallery for 2,000-word SEO articles.
- **FAQ Support**: Dedicated section/rendering for FAQs within the Article Zone.
- **SEO Schema**: Dynamic `Article` and `FAQPage` JSON-LD generation.
- **Sidebar navigation tree** enables lateral collection browsing.

---

## 4) Key Product Decisions (Locked for Implementation)

### 4.1 Preserve Existing Layout
- **Decision**: The teal header (`bg-teal-700`) with breadcrumbs, H1, description, and the sidebar + gallery layout remain unchanged.
- **What changes**: Only additive modifications — soft pagination in gallery, Article Zone below gallery.

### 4.2 The "Expandable Vault" (Soft Pagination)
- **Decision**: Load all items but strictly limit the initial view to **24 items**.
- **Mechanism**: Render items >24 with the class `hidden` and `loading="lazy"`.
- **Interaction**: "Show All" button reveals all; filters force-expand the vault.

### 4.3 Medium.com-Style Article Zone & FAQs
- **Decision**: Add a new content section BELOW the gallery.
- **Implementation**:
  - Content before `<!--more-->`: stays in teal header.
  - Content after `<!--more-->`: renders in Article Zone below gallery.
- **FAQ Handling**:
  - Detection: Identify Q&A pairs in the article text (using a clear pattern like `**Q: ...**` and `A: ...` or a dedicated partial).
  - Rendering: Style FAQs with an accordion or clear separation for UX.

### 4.4 Advanced SEO Schema
- **Decision**: Dynamically generate `Article` and `FAQPage` schema.
- **Article Schema**: Injected when content exists after the `<!--more-->` delimiter.
- **FAQ Schema**: Injected when the system detects FAQs in the content or dedicated frontmatter.

### 4.5 Navigation & Density
- **Sidebar Collections Tree**: Optional enhancement for lateral navigation.
- **Visual Index**: Dense 1:1 squares for parent pages.

---

## 5) Scope

### In scope
- **Modify `list.html`** for Expandable Vault and Article Zone.
- **Update `schema.html`** to support `Article` and `FAQPage` types.
- **Add CSS/Styles** for Article Zone typography and FAQ accordions.
- **Create partials** for Navigation Tree and Visual Index.

### Out of scope
- Changes to the teal header structure.
- Changes to single page layout (`single.html`).
- Backend pagination or SSR changes.

---

## 7) Acceptance Criteria (PRD-level)

- [ ] **Existing UI preserved**: Teal header and gallery grid remain visually consistent.
- [ ] **Soft Pagination**: 24-item cap functions with "Show All" and filter expansion.
- [ ] **Article Zone**: Content after `<!--more-->` renders in Medium.com style below gallery.
- [ ] **FAQ Rendering**: FAQs in the Article Zone are styled clearly (e.g., accordions).
- [ ] **Rich Schema**: JSON-LD includes `Article` and `FAQPage` nodes when content is present.
- [ ] **Visual Index**: Parent pages use 1:1 square tiles.
- [ ] **Performance**: PageSpeed Insights scores remain green.

---

## 8) Story Breakdown

| Story | Title | Description |
|-------|-------|-------------|
| 3.0.1 | Expandable Vault | Implement 24-item cap, hidden class, lazy loading, and "Show All" button. |
| 3.0.2 | Article Zone & FAQs | Add Article section below gallery; implement FAQ visual styling. |
| 3.0.5 | SEO Schema (Article + FAQ) | Update JSON-LD graph to include Article and FAQPage nodes. |
| 3.0.3 | Sidebar Navigation Tree | Create lateral navigation tree in sidebar. |
| 3.0.4 | Visual Index | Create 1:1 square tile grid for parent collection pages. |
