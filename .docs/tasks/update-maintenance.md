# Update Maintenance Strategy

**Role:** Documentation Manager & Architect
**Task:** Update the Autonomy PRD and create the Implementation Story for the new "Distributed Maintenance" strategy.

**Context:**
We are pivoting from a "Monday-only" maintenance schedule to a "Distributed" schedule to avoid Pinterest spam filters. We need to update our "Constitution" (PRD) to reflect this new law and create a specific Story file for the coding agent to implement it later.

**Action 1: Update `.docs/prd/autonomy-prd.md**`

1. In **Section 1 (Executive Summary)**, strictly append the following "Growth Constraints" block to the "Non-negotiable constraints" section (or creates a new subsection there):

### Growth Constraints (Pinterest Safety)
- **Max Daily Velocity:** 25 pins/day total (Hard Limit).
- **Active Growth Slots:** Capped at 15 collections/day.
- **Maintenance Buffer:** Reserve ~10 slots/day for rotating maintenance collections.




2. In **Section 6 (Foreman scheduling)**, under "Maintenance mode", find the bullet point **"Maintenance day rule"**. Completely **REPLACE** that entire bullet block with this new definition:

- **Maintenance day rule (Distributed Hashing)**:
  - DO NOT schedule all maintenance runs on Monday (avoids API spikes).
  - Use a deterministic hash of the collection name to assign a specific day of the week (0-6).
  - Formula: `hash(collection_name) % 7` = Target Day Index.
  - If `current_day_index == target_day_index`, include the collection in the daily run



**Action 2: Create New File `.docs/prd/stories/1.A.7 - Distributed Maintenance Scheduling.md**`
Create this file exactly with the following content:

# Story: Distributed Maintenance Scheduling

## Context
Pinterest penalizes "spikes" in activity. Our previous logic scheduled all "Maintenance" collections (1/week) on Mondays, which would eventually create a massive spike (e.g., 50+ posts) on that day, triggering spam filters.

## Requirements
1. **Modify `production-schedule.ts`**:
   - Remove the `isMonday` logic for capped collections.
   - Implement a deterministic helper function `getCollectionDay(collection_name)` that returns 0-6.
   - Only schedule a capped collection if today's day index matches the collection's target day.

2. **Verify Distribution**:
   - Ensure that `cats` (example) always runs on the same day of the week.
   - Ensure that across 50 collections, the maintenance load is roughly even (approx 7 collections per day).

3. **Update Logging**:
   - Foreman logs should explicitly state: "Skipped (Wait for [DayName])" instead of just "Skipped".

## Acceptance Criteria
- [ ] Running Foreman on Monday does NOT schedule every capped collection.
- [ ] Running Foreman on the specific hashed day for "cats" schedules "cats".
- [ ] The total production matrix size stays within the ~20-25 safe zone.

```