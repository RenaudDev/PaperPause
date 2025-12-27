# 3 - Collection UX Overhaul

**Source of truth**:
- PRD: `.docs/prd/collection-ux-overhaul.md`
- Task prompt: `.docs/tasks/content-scaling.md`

## Goal
Deliver a high-performance "Archive/Vault" architecture that handles 75+ items per page while boosting SEO visibility via deep-dive articles (Medium.com style) and advanced schema (Article + FAQ), while preserving the existing teal header design.

## Scope (what's included)
- **Expandable Vault**: Soft pagination (24-item cap), lazy loading, and filter force-expansion.
- **Article Zone**: Medium.com-style content section BELOW the gallery using `<!--more-->`.
- **FAQ Implementation**: Visual accordion for FAQs and `FAQPage` schema generation.
- **Navigation Tree**: Lateral browsing sidebar for 50+ collections.
- **Visual Index**: 1:1 square tile grid for parent collection pages.

## Key product decisions (locked for implementation)

### 1. The "Article Zone" Authority
- **Decision**: Long-form content lives BELOW the gallery to focus the user on the gallery first, while still providing SEO value.
- **Style**: Centered, high-readability typography (Medium.com style).

### 2. Advanced SEO Schema (Article & FAQ)
- **Decision**: Automatically generate `Article` and `FAQPage` nodes in the JSON-LD graph.
- **Trigger**: The presence of content after the `<!--more-->` delimiter.

### 3. FAQ Content Visuals
- **Decision**: FAQs should be styled as accordions within the Article Zone to keep the layout clean for the user while remaining indexable.

## Acceptance criteria (Epic-level)
- [ ] Teal header and gallery grid remain visually identical.
- [ ] 24-item cap functions with "Show All" and filter expansion.
- [ ] Article content renders below gallery with high-readability typography.
- [ ] FAQs render as functional accordions.
- [ ] JSON-LD graph contains `Article` and `FAQPage` nodes when content exists.
- [ ] Collections Tree and Visual Index enable lateral navigation and discovery.

## Story breakdown
- [ ] [3.0.1 - Expandable Vault](.docs/prd/stories/3.0.1%20-%20Expandable%20Vault.md)
- [ ] [3.0.2 - Article Zone and FAQs](.docs/prd/stories/3.0.2%20-%20Article%20Zone%20and%20FAQs.md)
- [ ] [3.0.5 - SEO Schema Enhancement (Article and FAQ)](.docs/prd/stories/3.0.5%20-%20SEO%20Schema%20Enhancement%20(Article%20and%20FAQ).md)
- [ ] [3.0.3 - Sidebar Navigation Tree](.docs/prd/stories/3.0.3%20-%20Sidebar%20Navigation%20Tree.md)
- [ ] [3.0.4 - Visual Index](.docs/prd/stories/3.0.4%20-%20Visual%20Index.md)
