# 3 - Collection UX Overhaul

**Source of truth**:
- PRD: `.docs/prd/collection-ux-overhaul.md`
- Task prompt: `.docs/tasks/content-scaling.md`

## Goal
Deliver a high-performance "Archive/Vault" layout that handles 75+ items per page while boosting SEO visibility for deep content and enabling efficient lateral navigation across 50+ collections.

## Scope (what's included)
- **Layout Refactor**: Restructure `list.html` to implement the Split Content pattern (Header → Intro → Gallery → Deep Article).
- **Expandable Vault**: Implement soft pagination with 24-item initial cap, hidden overflow with lazy loading, and "Show All" button.
- **Filter Integration**: Update client-side filter JS to force-expand the vault when filters are applied.
- **Navigation Tree**: Create a collapsible sidebar Collections Tree partial for lateral collection browsing.
- **Visual Index**: Create a dense 1:1 square tile grid for parent collection pages.

## Explicit non-goals
- Backend pagination routes or SSR changes.
- Changes to single page layout (`single.html`).
- RSS/distribution pipeline modifications.
- New agent creation or AI workflow changes.
- Mobile app or PDF viewer changes.

## Key product decisions (locked for implementation)

### 1. The "Expandable Vault" (Soft Pagination)
- **Decision**: Load all items (~75 max) but strictly limit the initial view to **24 items**.
- **Mechanism**: Render items >24 with class `hidden` and `loading="lazy"` to prevent downloading until revealed.
- **Interaction**:
  - "Show All" button after item #24 removes `hidden` class from all items.
  - Filter selection automatically force-expands the vault.

### 2. Split Content Architecture
- **Decision**: Display header description AND deep SEO article without burying the gallery.
- **Implementation**:
  - Header: `description` frontmatter field
  - Intro: Markdown content before `<!--more-->` delimiter
  - Deep Article: Markdown content after `<!--more-->` delimiter
- **Layout**: Header → Intro → Sidebar/Gallery → Deep Article → Footer

### 3. Collections Tree Navigation
- **Decision**: Add collapsible sidebar tree listing all Site Sections and Sub-sections.
- **Benefit**: Enables lateral navigation (Cats → Dogs) without returning to Home.
- **Mobile**: Collapsed by default to preserve screen real estate.

### 4. Visual Index Density
- **Decision**: Replace large cards on parent collection pages with **Square Tiles (1:1 aspect ratio)** with text overlays.
- **Benefit**: Maximizes above-the-fold density and discovery.

## Acceptance criteria (Epic-level)
- [ ] Collection pages load with exactly 24 items visible; remaining items hidden with `loading="lazy"`.
- [ ] "Show All" button reveals all hidden items on click.
- [ ] Selecting a style filter force-expands vault and displays all matching items.
- [ ] `description` frontmatter renders as header; `<!--more-->` delimiter splits intro from deep article.
- [ ] Sidebar displays collapsible Collections Tree with all sections and sub-sections.
- [ ] Parent collection pages render children as 1:1 square tiles with text overlays.
- [ ] Core Web Vitals (LCP, CLS, INP) remain green on PageSpeed Insights.

## Story breakdown
- [ ] [3.0.1 - Layout Skeleton and Split Content Logic](.docs/prd/stories/3.0.1%20-%20Layout%20Skeleton%20and%20Split%20Content%20Logic.md)
- [ ] [3.0.2 - The Expandable Vault](.docs/prd/stories/3.0.2%20-%20The%20Expandable%20Vault.md)
- [ ] [3.0.3 - Sidebar Navigation Tree](.docs/prd/stories/3.0.3%20-%20Sidebar%20Navigation%20Tree.md)
- [ ] [3.0.4 - Visual Index](.docs/prd/stories/3.0.4%20-%20Visual%20Index.md)
