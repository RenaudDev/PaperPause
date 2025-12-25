# 2 — Content Quality & Scaling (Master PRD)

**Source of truth**:
- PRD: `.docs/prd/content-quality-scaling-master-prd.md`
- Codebase: `scripts/morning-routine/lib/gemini.ts`, `prompt-manager.ts`
- Configs: `scripts/morning-routine/config/prompts/*.json`

---

## Goal
Drastically improve the "hit rate" of valid assets (targeting >95% adherence to 80% occupancy & closed paths) and establish the "Style-First" taxonomy required to scale operations to 50 unique daily pins.

## Scope
1.  **Prompt Hygiene (Code)**: Centralize safety/negative logic into the `CRITIC_SAFETY_BLOCK` and strip conflicting redundancies from the codebase.
2.  **Visual Occupancy (Logic)**: Rewrite prompt generation templates to enforce "Macro/Filled" composition, solving the "floating subject" issue.
3.  **Content Refinement (Config)**: Overhaul specific collection configs (`butterflies`, `sharks`) to align with new occupancy logic.
4.  **Taxonomy Strategy (Scaling)**: Define and prove the "Style-Specific Collection" pattern (e.g., `dogs-steampunk`) to enable unlimited niche scaling.

---

## Key Product Decisions (Locked)

### 1. The "Critic Block" Authority
- **Decision**: The `CRITIC_SAFETY_BLOCK` in `gemini.ts` is the **single source of truth** for output constraints.
- **Action**: We will aggressively remove "soft" negative prompts (e.g., "no text", "no shading") from individual JSON configs and TypeScript generators. Trusting the Critic Block frees up token attention for creative instructions.

### 2. "Macro-First" Composition
- **Decision**: To guarantee 80% occupancy, prompts must default to a "surrounded" framing rather than a "subject in place" framing.
- **New Template Standard**:
  * *From*: `${tone} ${type} in a ${setting} ${action}`
  * *To*: `${tone} ${type} ${action}, closely surrounded by ${setting}, filling the frame, macro view.`

### 3. Style-First Taxonomy
- **Decision**: To reach 50 pins/day, we will stop adding generic subjects (e.g., "dogs") and start adding **Style-Locked Subjects**.
- **Pattern**: A collection is now defined as `[Subject] + [Fixed Style]`.
  * *Example*: `dogs-steampunk`, `dogs-kawaii`, `dogs-popart`.
- **Impact**: This creates distinct RSS feeds for distinct Pinterest audiences, preventing "style whiplash" on a single board.

---

## Implementation Plan

### Task 1: Prompt Pipeline Hygiene (Cleanup)
**Objective**: Eliminate "instruction drift" and token waste.
1.  **Refactor `prompt-manager.ts`**:
    - Remove hardcoded technical specs from the text prompt (`aspectRatio = "3:4"`, `Resolution: "4K"`). Let the API config handle this.
    - Remove the generated string "No shading, no text, no gray" from the `negative_prompt` construction.
2.  **Clean JSON Configs**:
    - Iterate through all `config/prompts/*.json`.
    - Delete generic negative terms from the `base` and `negative_prompt` fields.
    - *Note*: Keep subject-specific anatomical negatives (e.g., "extra legs" for horses).

### Task 2: Implement "Occupancy Anchors" (Logic)
**Objective**: Force the model to fill the white space.
1.  **Update `prompt-manager.ts`**:
    - Modify the `getVariantPrompt` function to use the new "Macro-First" template:
      `"${tone} ${type} ${action}, closely surrounded by ${setting}, filling the frame, macro view."`

### Task 3: Content Refinement (Deep Dive)
**Objective**: Fix the weakest collections using the new logic.
1.  **Butterflies (`animals-butterflies.json`)**:
    - **Settings**: Replace "sky/garden" with macro objects: "cluster of blooming peonies", "intricate mandala of leaves", "glass jar with fireflies".
    - **Actions**: Remove "flying" (implies distance). Add "resting on leaf", "sipping nectar".
2.  **Sharks (`animals-sharks.json`)**:
    - **Tones**: Visualize abstract tones. Change "Cool / Swaggy" to "Cool / Swaggy (wearing sunglasses)".
    - **Settings**: Ensure enclosure. "Inside sunken ship captain's quarters" vs "Ocean".

### Task 4: Style-Specific Scaling Strategy
**Objective**: Prove the scaling pattern.
1.  **Create "Steampunk Dogs"**:
    - Clone `animals-dogs.json` → `animals-dogs-steampunk.json`.
    - Lock `attributes.styles` to `["Steampunk"]`.
    - Update `base` prompt to explicitly mention "Steampunk Vector line art".
2.  **Create "Kawaii Dogs"**:
    - Clone `animals-dogs.json` → `animals-dogs-kawaii.json`.
    - Lock `attributes.styles` to `["Kawaii"]`.
3.  **Validate**: Ensure the system generates two distinct folders/RSS feeds (`dogs-steampunk` and `dogs-kawaii`) during the next run.

---

## Acceptance Criteria
- [ ] **Logs**: Generated prompts sent to Gemini are clean; no "aspectRatio" text or generic "no text" spam in the prompt string.
- [ ] **Visuals**: `butterflies` collection generates images where the subject + setting covers >80% of the canvas (no white voids).
- [ ] **Creativity**: `sharks` collection successfully renders "Cool" sharks with visual accessories (sunglasses, etc.).
- [ ] **Scaling**: Two new active collections (`dogs-steampunk`, `dogs-kawaii`) appear in the daily run, producing style-consistent outputs without cross-contamination.