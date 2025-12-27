# 4 - Collection Content Engine

Source of truth: `[.docs/prd/content-agent-prd.md]`

## Goal
Build an automated Programmatic SEO engine ("The Sweeper") that generates deep, coach-level guides (2,000+ words) for every collection. This engine will ensure high topical authority, visual excellence through style showcases, and semantic richness via a dedicated refiner agent.

## Scope
-   **Style Showcase Shortcode**: A reusable component to display representative images for each artistic style.
-   **Gemini Text Library**: A specialized high-speed client for long-form text generation.
-   **The Sweeper Agent**: Orchestrator for scanning collections, planning outlines, and assembling content.
-   **The Refiner Agent**: Post-processor for LSI keyword injection and SEO optimization.
-   **Automation**: A daily GitHub Actions workflow that runs independently of the image generation pipeline.

## Explicit non-goals
-   **Image Generation**: This engine uses existing images; it does not trigger new generations.
-   **UI Refactoring**: The Vault UX is assumed to be stable and out of scope.

## Key product decisions
-   **Sectional Chaining**: Long-form content will be generated in discrete sections with context passing to maintain flow.
-   **Gemini 3 Flash Preview**: Selected for speed and large context window handling.
-   **2,000 Word Gate**: The engine targets a high word count to signal authority; existing content under 2,000 words will be eligible for enrichment.
-   **Vanilla CSS**: Shortcodes will use vanilla CSS to match the existing theme architecture.
-   **First-person plural voice**: Content uses "we" and "At PaperPause, we..." instead of singular first-person.

## Acceptance criteria (Epic-level)
-   ✅ Collections with < 2,000 words are automatically identified and processed.
-   ✅ Generated articles contain visual showcases of specific styles found in the collection.
-   ✅ Content is semantically rich (LSI keywords) and uses first-person plural voice.
-   ✅ The daily sweep runs successfully in CI/CD without interfering with the main image production pipeline.

## Story breakdown
-   ✅ `4.0.1 — Style Showcase Component`
-   ✅ `4.0.2 — Text Generation Library`
-   ✅ `4.A.1 — Content Sweeper Orchestrator`
-   ✅ `4.A.2 — SEO Refiner Agent`
-   ✅ `4.B.1 — Daily Content Sweep Workflow`
