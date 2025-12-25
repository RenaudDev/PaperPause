# Implementation Plan - Epic 2: Content Quality & Scaling (Final Polish)

This plan outlines the steps to implement the stories in Epic 2, ensuring prompt settings are **conceptually universally adaptable** across all art styles.

## User Review Required
> [!IMPORTANT]
> - **Style Universalism**: We are replacing specific man-made objects (like "portholes" or "ships") with **dense organic environments**.
> - **Rationale**: Nature (plants, rocks, water) is the universal substrate. It can be rendered as "Steampunk" (metal flowers), "Kawaii" (cute round flowers), or "Pop Art" (bold flowers) without semantic conflict. Portholes or Wreckage imply specific eras/tech that might clash.

## Proposed Changes

### Scripts & Libraries

#### [MODIFY] [prompt-manager.ts](file:///c:/Users/Renaud%20Gagne/Desktop/ProjectA/scripts/morning-routine/lib/prompt-manager.ts)
- **Story 2.0.1 (Hygiene)**:
    - **CRITICAL**: Remove the hardcoded string: `aspectRatio = "3:4", Resolution: "4K", 3:4 aspect ratio, high-resolution 4K detail`.
    - Remove redundant negative prompt construction.
- **Story 2.0.2 (Occupancy)**:
    - Update `getVariantPrompt` to use the new "Macro-First" template:
      `${tone} ${type} ${action}, closely surrounded by ${setting}, filling the frame, macro view.`

### Configuration (Prompts)

#### [MODIFY] [animals-butterflies.json](file:///c:/Users/Renaud%20Gagne/Desktop/ProjectA/scripts/morning-routine/config/prompts/animals-butterflies.json)
- **Story 2.0.3 (Refinement - Nature Density)**:
    - **Settings**: "dense cluster of blooming peonies", "intricate lattice of woven vines", "carpet of fern leaves".
    - **Actions**: "resting wings-open on leaf", "clinging to stem".

#### [MODIFY] [animals-sharks.json](file:///c:/Users/Renaud%20Gagne/Desktop/ProjectA/scripts/morning-routine/config/prompts/animals-sharks.json)
- **Story 2.0.3 (Refinement - Nature Density)**:
    - **Tones**: Keep abstract ("Cool", "Fierce"). No human accessories.
    - **Settings**: **Organic Enclosure only**.
        *   *New*: "vertical kelp forest" (perfect for 3:4 aspect), "wall of dense coral", "swirling school of tiny fish".
        *   *Removed*: "Porthole" (risk of borders), "Ship Wreckage" (style clash risk).

#### [MODIFY] [animals-dogs.json](file:///c:/Users/Renaud%20Gagne/Desktop/ProjectA/scripts/morning-routine/config/prompts/animals-dogs.json)
- **Story 2.0.1 (Hygiene)**: Remove generic negative prompts.

#### [MODIFY] [animals-cats.json](file:///c:/Users/Renaud%20Gagne/Desktop/ProjectA/scripts/morning-routine/config/prompts/animals-cats.json)
- **Story 2.0.1 (Hygiene)**: Remove generic negative prompts.

#### [MODIFY] [animals-horses.json](file:///c:/Users/Renaud%20Gagne/Desktop/ProjectA/scripts/morning-routine/config/prompts/animals-horses.json)
- **Story 2.0.1 (Hygiene)**: Remove generic negative prompts.

## Verification Plan

### Automated Verification
- **Dry Run**: Check prompt strings for cleanness.

### Manual Verification
- **Visuals**:
    - **Sharks**: Verify "Kelp Forest" fills the vertical frame and adapts to style (e.g. Steampunk Kelp vs Kawaii Kelp).
    - **Consistency**: Ensure no "frame" or "border" elements appear from the settings.
