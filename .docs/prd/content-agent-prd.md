# Collection UX & Content Engine Overhaul (Phase 2)

**Status**: Ready for Implementation (v3)
**Phase 1 (UX/Vault)**: ✅ Deployed
**Phase 2 (Content Engine)**: 🚧 Pending
**Owner**: Product Engineering
**Source of Truth**: `.docs/prd/collection-ux-overhaul.md`

---

## 1. Executive Summary

With the "Expandable Vault" UX successfully deployed, we are building the **Automated Content Engine ("The Sweeper")**.

This is not a simple description generator. It is a **Programmatic SEO Engine** designed to produce deep, "Coach-level" guides (min. 2,000 words) for every collection. It runs as a daily cron job, detects valid collections lacking deep content, and orchestrates a multi-step writing process. It concludes with a dedicated SEO Optimization pass to ensure semantic richness and LSI keyword density.

---

## 2. Goals (Phase 2)

-   **Authority Depth (2k+ Words)**: Articles must cover tools, techniques, paper types, and psychological benefits to signal topical authority to Google.
-   **Visual Evidence**: The engine must identify distinct artistic styles (e.g., "Totem" vs "Kawaii") within the collection and render them using the `{{< style-showcase >}}` component.
-   **Sectional Assembly**: To ensure length and quality, the content is generated in chunks (Introduction, Body, Technical Guide, FAQs) and stitched together.
-   **Semantic Optimization**: A dedicated "Refiner" step analyzes the final draft to inject LSI keywords and fix reading levels before publishing.
-   **Decoupled Operation**: The engine runs on a separate workflow (`daily-content-sweep.yml`) to avoid blocking or being blocked by the image generation factory.

---

## 3. Scope

### In Scope (The Work Ahead)

1.  **Component Architecture**:
    -   `themes/visual-sanctuary-theme/layouts/shortcodes/style-showcase.html`: The visual container for AI-selected images (Vanilla CSS, no Tailwind).
2.  **Text Generation Infrastructure**:
    -   `scripts/morning-routine/lib/gemini-text.ts`: A text-optimized client using `gemini-2.0-flash`.
3.  **The "Sweeper" Agent**:
    -   `scripts/morning-routine/tasks/write-collection-content.ts`: The orchestrator that scans, plans, writes sections, and saves.
4.  **The "Refiner" Agent**:
    -   `scripts/morning-routine/tasks/refine-content-seo.ts`: The post-processor for LSI and semantic density.

### Out of Scope

-   **Image Generation**: Handled by the existing Autonomy PRD.
-   **UX Refactor**: Already completed.

---

## 4. Technical Specifications

### 4.1 Shortcode Contracts

#### 4.1.1 Style Showcase (`style-showcase.html`)
The Agent must output the following Shortcode for visual sections:

**Syntax:**
```markdown
{{< style-showcase 
    src="https://imagedelivery.net/<HASH>/<ID>/public" 
    title="Totem Style" 
    description="Notice the intricate line-work suited for fine-liners."
>}}
```

#### 4.1.2 FAQ (`faq.html`)
The Agent must wrap each question in the existing FAQ shortcode:

**Syntax:**
```markdown
{{< faq question="Is this suitable for markers?" >}}
Yes, but we recommend placing a protective sheet behind the page to prevent bleed-through.
{{< /faq >}}
```

### 4.2 The "Sweeper" Orchestrator (`write-collection-content.ts`)

The script uses **Sectional Chaining**.

**The Loop:**

1. **Scan**: Identify `content/<category>/<collection>/_index.md`. 
   - **Gate**: If `word_count < 2000` OR `content_generated: false` in frontmatter.
2. **Visual Audit**: Scan sibling `.md` files. 
   - Group by `style` frontmatter (Fallback: "Classic"). 
   - Extract `cf_images_id` to build `imagedelivery.net` URLs.
   - Select 1 representative image per style for the "Showcase".
3. **Section Generation**: Loop through the **Deterministic Outline** (see 4.3), passing the previous section's summary as context.
4. **Assembly**: Stitch sections into a raw Markdown buffer.
5. **Refinement**: Pass the buffer to the SEO Refiner (see 4.4).
6. **Save**: Update `_index.md`. Set `content_generated: true` and `last_swept: <date>`.

### 4.3 The Deterministic Outline (Target: 2,000 Words)

| Section | Target Words | Content Focus |
| --- | --- | --- |
| **1. The Hook (Intro)** | 250 | Emotional connection, history of the subject, who this is for. |
| **2. Visual Breakdown** | 300 | **MUST use `{{< style-showcase >}}`**. Analyze the specific styles found in the folder. |
| **3. Tools of the Trade** | 400 | Specific recommendations: Wax vs. Oil pencils, Alcohol markers, Gel pens. |
| **4. Techniques Deep Dive** | 500 | Shading, blending, color theory specific to this collection's subject matter. |
| **5. The "Paper Pause"** | 250 | Mental health benefits. Mindfulness. Why this specific subject aids relaxation. |
| **6. Paper & Printing** | 200 | GSM recommendations. Texture (Tooth). High-res printer settings. |
| **7. Expert FAQs** | 150 | 3-5 Schema-ready questions wrapped in `{{< faq >}}` shortcodes. |

### 4.4 The SEO Refiner (Agent 6)

**Input**: Full drafted text + `primary_keyword` (from collection name).
**Process**:
1. **LSI Injection**: Inject semantic keywords related to the subject and coloring (e.g., "blending", "composition", "grayscale removal").
2. **Formatting**: Ensure H2/H3 hierarchy and optimal bold usage.
3. **Tone Check**: Enforce "Master Coach" persona.

---

## 5. Environment & Infrastructure

- **Feature Flag**: `ENABLE_CONTENT_SWEEP` (default: `0`).
- **Model**: `gemini-2.0-flash` (for speed and context window).
- **Temperature**: `0.7` for creative sections, `0.3` for SEO refinement.
- **Manifests**: Every run records a log in `mission-control/logs/content-sweep-<date>.json` containing skipped/processed collections.

---

## 6. Story Breakdown

### Story 1: The Style Showcase Component
**Goal**: Create visual container in `themes/visual-sanctuary-theme/layouts/shortcodes/style-showcase.html`. Use vanilla CSS consistent with `main.css`.

### Story 2: The Text Generation Library
**Goal**: Create `scripts/morning-routine/lib/gemini-text.ts`. Optimize for large text blocks using `gemini-2.0-flash-exp`.

### Story 3: The Content Sweeper (Orchestrator)
**Goal**: Logic for building the 2k-word draft. Implement `getStyleMap(dir)` for asset discovery and `generateSection()` with summary-chaining.

### Story 4: The SEO Refiner
**Goal**: Extend orchestrator to call `refineContent()`. Use a lower temperature for strict SEO adherence.

### Story 5: Integration & CI
**Goal**: Add `npm run content:sweep` script. Create `.github/workflows/daily-content-sweep.yml`.
**Schedule**: `0 7 * * *` (UTC).

---

## 7. Rollback & Safety

1. **Atomic Writes**: Scripts must write to a `.tmp` file and verify formatting before overwriting `_index.md`.
2. **Git Restore**: The pipeline will fail if the resulting file is not valid YAML/Markdown.
3. **Draft Mode**: Initial rollout will set `draft: true` on updated collections for manual review.
