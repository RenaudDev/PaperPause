# 2 - Content Quality & Scaling

**Source of truth**:
- PRD: `.docs/prd/prompt-improvements.md`
- Master PRD: `.docs/prd/content-quality-scaling-master-prd.md` (Ref only)

## Goal
Drastically improve the "hit rate" of valid assets (targeting >95% adherence to 80% occupancy & closed paths) and establish the "Style-First" taxonomy required to scale operations to 50 unique daily pins.

## Scope (what’s included)
- **Prompt Hygiene (Code)**: Centralize safety/negative logic into the `CRITIC_SAFETY_BLOCK` and strip conflicting redundancies from the codebase.
- **Visual Occupancy (Logic)**: Rewrite prompt generation templates to enforce "Macro/Filled" composition, solving the "floating subject" issue.
- **Content Refinement (Config)**: Overhaul specific collection configs (`butterflies`, `sharks`) to align with new occupancy logic.
- **Taxonomy Strategy (Scaling)**: Define and prove the "Style-Specific Collection" pattern (e.g., `dogs-steampunk`) to enable unlimited niche scaling.

## Explicit non-goals
- Changes to the underlying Art Critic logic (only the prompts sent to it).
- Changes to the core distribution pipeline (Make.com, etc.).
- Creating new agents.

## Key product decisions (locked for implementation)

### 1. The "Critic Block" Authority
- **Decision**: The `CRITIC_SAFETY_BLOCK` in `gemini.ts` is the **single source of truth** for output constraints.
- **Action**: We will aggressively remove "soft" negative prompts (e.g., "no text", "no shading") from individual JSON configs and TypeScript generators. Trusting the Critic Block frees up token attention for creative instructions.

### 2. "Macro-First" Composition
- **Decision**: To guarantee 80% occupancy, prompts must default to a "surrounded" framing rather than a "subject in place" framing.
- **New Template Standard**: created in `prompt-manager.ts`
  * *From*: `${tone} ${type} in a ${setting} ${action}`
  * *To*: `${tone} ${type} ${action}, closely surrounded by ${setting}, filling the frame, macro view.`

### 3. Style-First Taxonomy
- **Decision**: To reach 50 pins/day, we will stop adding generic subjects (e.g., "dogs") and start adding **Style-Locked Subjects**.
- **Pattern**: A collection is now defined as `[Subject] + [Fixed Style]`.
  * *Example*: `dogs-steampunk`, `dogs-kawaii`, `dogs-popart`.
- **Impact**: This creates distinct RSS feeds for distinct Pinterest audiences, preventing "style whiplash" on a single board.

## Acceptance criteria (Epic-level)
- [ ] **Logs**: Generated prompts sent to Gemini are clean; no "aspectRatio" text or generic "no text" spam in the prompt string.
- [ ] **Visuals**: `butterflies` collection generates images where the subject + setting covers >80% of the canvas (no white voids).
- [ ] **Creativity**: `sharks` collection successfully renders "Cool" sharks with visual accessories (sunglasses, etc.).
- [ ] **Scaling**: Two new active collections (`dogs-steampunk`, `dogs-kawaii`) appear in the daily run, producing style-consistent outputs without cross-contamination.

## Story breakdown
- [ ] [2.0.1 - Prompt Pipeline Hygiene](.docs/prd/stories/2.0.1%20-%20Prompt%20Pipeline%20Hygiene.md)
- [ ] [2.0.2 - Occupancy Anchors](.docs/prd/stories/2.0.2%20-%20Occupancy%20Anchors.md)
- [ ] [2.0.3 - Content Refinement](.docs/prd/stories/2.0.3%20-%20Content%20Refinement.md)
- [ ] [2.0.4 - Style-Specific Scaling Strategy](.docs/prd/stories/2.0.4%20-%20Style-Specific%20Scaling%20Strategy.md)
