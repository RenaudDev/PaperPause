#Here is the task file for your AI agent. It outlines the problem, the context, and the specific steps to regenerate the queue and force the distribution for today.

**File Path:** `.docs/tasks/fix-nightwatcher.md`

```markdown
# Task: Emergency Fix — Restart Night Watchman & Distribution

## Context
The **Distribution System** has stalled. The `config/distribution-queue.json` file was last generated on **Dec 24**, meaning no posts have been scheduled or distributed for Dec 25, 26, or 27. 

The "Night Watchman" (`midnight-scheduler.ts`) likely failed to run or commit its output last night. Without a valid queue, the "Conductor" (`distribution-conductor.ts`) has nothing to send to Make.com/Pinterest.

## Objective
1.  **Regenerate the Schedule:** Manually run the scheduler to build a fresh queue for today (Dec 27).
2.  **Catch Up:** Ensure items scheduled for earlier today (06:00 UTC - Now) are distributed immediately.
3.  **Resume Operations:** Push the updated queue to GitHub so the automated Conductor can resume normal operation.

## Step 1: Diagnostics (Quick Check)
1.  Open GitHub Actions → **Distribution System** workflow.
2.  Identify why the `schedule` (00:00 UTC) run failed or didn't trigger.
    * *Hypothesis:* If the repo has been quiet, GitHub Actions sometimes disables scheduled workflows after 60 days, though unlikely here. More likely a script error or merge conflict in `distribution-queue.json`.

## Step 2: Manual Regeneration (The Fix)
We will bypass the failed CI job and run the scheduler locally to generate the correct state for today.

**Action:** Run the scheduler script locally.
```bash
# Ensure you are on the latest main
git pull

# Run the Night Watchman in standard "Full Audit" mode
# This scans content/animals/* and generates JIT board names and time slots
npx ts-node scripts/morning-routine/tasks/midnight-scheduler.ts

```

**Verify the Output:**

1. Open `config/distribution-queue.json`.
2. Check `generated_at`: Should be today's date (approx now).
3. Check `queue`: Should contain ~5-20 items (depending on active collections).
4. Check `scheduled_at`: Items should have assigned timestamps between 06:00 UTC and 21:00 UTC today.

## Step 3: Commit and Push

Pushing the new queue file is the critical step that "informs" the automated system what to do.

```bash
git add config/distribution-queue.json
git commit -m "fix(schedule): manual regeneration of distribution queue for Dec 27"
git push

```

## Step 4: Force Distribution (Catch Up)

Once the file is on GitHub, the "Conductor" needs to run to pick up any items that are already "past due" (scheduled for earlier this morning).

**Option A: GitHub Actions (Preferred)**

1. Go to **GitHub Actions** → **Distribution System**.
2. Click **Run workflow** (triggers the `workflow_dispatch` event).
3. *Result:* The Conductor will read the new JSON, see items with `scheduled_at < now`, and fire them all immediately to Make.com.

**Option B: Local Execution (If you have ENV vars)**

```bash
# Requires MAKE_WEBHOOK and MAKE_WEBHOOK_API in .env or .dev.vars
npx ts-node scripts/morning-routine/tasks/distribution-conductor.ts

```

## Step 5: Verify Success

1. Check the "Conductor" logs (GitHub or Terminal). Look for:
* `Found X due items.`
* `Webhook fired successfully for ...`


2. Check the **Make.com** History for the "Smart Router" scenario.
3. Check **Pinterest** to confirm the pins have appeared.

```

```