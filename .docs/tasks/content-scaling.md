# Content Scaling
## Task Prompt for AI Agent

**Role:** Product Manager / Technical Lead
**Project:** PaperPause
**Context:** We are scaling to 50+ collections with 75+ pins each. The current "infinite scroll" layout degrades UX and hides valuable SEO content. We are shifting to an "Archive/Vault" architecture.

**Objective:**
Create a new Product Requirements Document (PRD) file named:
`.docs/prd/collection-ux-overhaul.md`

**Input Data (Key Decisions Locked for Implementation):**
You must incorporate the following technical strategies into the PRD:

1. **The "Expandable Vault" (Soft Pagination)**
* **Constraint:** Standard pagination breaks client-side filters. Infinite scroll hides the footer.
* **Solution:** Load all items (~75 max) but strictly limit the initial view to **24 items**.
* **Mechanism:** Render items >24 with the class `hidden`. Crucially, these hidden images **MUST have `loading="lazy"**` to prevent downloading until revealed (preserving Core Web Vitals).
* **Interaction:**
* **"Show All" Button:** Placed after item #24. Clicking it removes the `hidden` class from all items and hides the button.
* **Filter Override:** If a user selects a filter, the script must automatically **force-expand** the list to search/show *all* matching items in the vault.

2. **Split Content Architecture (SEO & UX)**
* **Goal:** Display a high-impact header description AND a deep-dive 2,000-word SEO article at the bottom, without burying the gallery.
* **Implementation:**
* **Header:** Primary text pulls from the frontmatter `description` field.
* **Intro (Optional):** Secondary text pulls from markdown content *before* the `` delimiter.
* **Footer (Deep Article):** The bulk of the content (SEO article) pulls from markdown content *after* the `` delimiter.


* **Layout:** Header -> Sidebar/Gallery -> Article.


3. **Navigation & Density**
* **Sidebar Tree:** Add a collapsible "Collections Tree" to the sidebar listing all Site Sections and Sub-sections. This allows lateral navigation (e.g., Cats -> Dogs) without returning to Home.
* **Visual Index:** For parent collections (e.g., `/animals/`), replace large cards with a dense grid of **Square Tiles (1:1 aspect ratio)** with text overlays.



**Documentation Standards:**

* **Format:** Follow the structure defined in `.agent/rules/epics-stories-rules.md`.
* **Reference:** Use `.docs/prd/autonomy-prd.md` as the style guide for tone and depth.

**Required PRD Sections:**

1. **Header:** Title, Status (Draft), Owner.
2. **Goal:** Deliver a high-performance "Archive" layout that handles 75+ items per page while boosting SEO visibility for deep content.
3. **Scope:**
* Refactor `layouts/_default/list.html`.
* Update `main.css` for the "Visual Index" grid.
* Update Filter JS to handle the "Expandable Vault" logic.


4. **Key Product Decisions (Locked):** Detail the 3 strategies listed above (Soft Pagination, Split Content, Nav Tree).
5. **Risks & Mitigations:**
* *Risk:* DOM size with 500+ items. *Mitigation:* Hard cap or server-side pagination if a collection ever exceeds 300 items (not expected for 5 years).


6. **Story Breakdown (High Level):**
* Story 1: Layout Skeleton & Split Content Logic.
* Story 2: The "Expandable Vault" (Grid + JS + Lazy Loading).
* Story 3: Sidebar Navigation Tree.
* Story 4: Visual Index (Dense Sub-collection Grid).



**Output:**
Generate the full markdown content for `.docs/prd/collection-ux-overhaul.md`.