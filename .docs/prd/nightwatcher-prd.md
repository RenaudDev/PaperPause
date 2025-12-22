
# 1.E.3 — Distribution Conductor & Queue System (Final)

**Epic:** `1 - PaperPause Autonomy System`
**Status:** Ready for Implementation
**Architecture:** Deterministic "Night Watchman" (GitHub) → "One-Way Fire" (Make.com)

---

## 1. Executive Summary
We are implementing a **Deterministic Distribution System** that scales from 5 to 50+ collections without human intervention.
- **The Brain (GitHub):** Calculates the daily "Flight Plan" based on hard rules (post counts) and manages the queue.
- **The Hands (Make.com):** Receives orders, manages Pinterest Board IDs (Just-In-Time provisioning), and executes posts.
- **Security:** One-way data flow. Make.com never writes back to GitHub.

---

## 2. Responsibility Matrix

### 👤 Manual Setup (You do this once)
1.  **Make.com Data Store:** Create `Board_Mappings` store.
2.  **Make.com Scenario:** Build the "Smart Router" scenario (Webhook → Pinterest).
3.  **GitHub Secrets:** Add `MAKE_WEBHOOK_URL` to repository secrets.

### 🤖 Automated Code (The System does this forever)
1.  **Midnight Scheduler:** Audits content, applies Growth/Maintenance rules, generates JIT board names, builds the queue.
2.  **Distribution Conductor:** Pops items from the queue, triggers Make.com, commits state to repo.
3.  **GitHub Workflows:** Orchestrates the timing (00:00 reset + hourly distribution).

---

## 3. System Architecture

### A. The "Night Watchman" (Scheduler Script)
* **Runs:** Every night at 00:00 UTC.
* **Logic:**
    1.  Scans `content/animals/*`.
    2.  **Growth Rule:** If posts < 75 → Schedule **Daily**.
    3.  **Maintenance Rule:** If posts ≥ 75 → Schedule **Weekly** (DayOfYear % 7 == CollectionHash % 7).
    4.  **JIT Naming:** Generates "Board Name" (e.g., `sharks` → "Shark Coloring Pages") automatically.
    5.  **Output:** Overwrites `config/distribution-queue.json`.

### B. The "Conductor" (Executor Script)
* **Runs:** Approx every 45-60 minutes (via Cron).
* **Logic:**
    1.  Reads `config/distribution-queue.json`.
    2.  **Queue Empty?** → Exit.
    3.  **Queue Has Item?** → Pop first item.
    4.  **Fire:** Send JSON payload to Make.com Webhook.
    5.  **Commit:** Save updated queue to GitHub (preventing duplicates).

### C. The "Executor" (Make.com)
* **Trigger:** Webhook.
* **Logic:**
    1.  **Check Memory:** Look up Collection in `Board_Mappings` Data Store.
    2.  **Miss (New Collection):** Search Pinterest for Board → Create if missing → Save ID to Data Store.
    3.  **Hit (Existing):** Use cached Board ID.
    4.  **Action:** Create Pin.

---

## 4. Technical Specifications (The Code)

### Artifact: `config/distribution-queue.json`
```json
{
  "generated_at": "2025-12-21T00:00:00Z",
  "queue": [
    {
      "collection": "dragons",
      "board_name": "Dragon Coloring Pages",
      "mode": "growth"
    }
  ]
}

```

### Script 1: `scripts/morning-routine/tasks/midnight-scheduler.ts`

*(Logic to handle file counting, hashing, and shuffling)*

### Script 2: `scripts/morning-routine/tasks/distribution-conductor.ts`

*(Logic to pop queue, fetch webhook, and git commit)*

### Workflow: `.github/workflows/distribution-system.yml`

```yaml
name: Distribution System

on:
  schedule:
    # 1. The Night Watchman: Runs at midnight UTC to build the queue
    - cron: '0 0 * * *'
    # 2. The Conductor: Runs every hour at minute 45 to distribute
    - cron: '45 * * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  scheduler:
    if: github.event.schedule == '0 0 * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run Night Watchman
        run: npx ts-node scripts/morning-routine/tasks/midnight-scheduler.ts
      - name: Commit Queue
        run: |
          git config user.name "PaperPause Bot"
          git config user.email "bot@paperpause.app"
          git add config/distribution-queue.json
          git commit -m "chore(schedule): generate daily distribution queue" || exit 0
          git push

  distributor:
    if: github.event.schedule != '0 0 * * *'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run Conductor
        env:
          MAKE_WEBHOOK_URL: ${{ secrets.MAKE_WEBHOOK_URL }}
        run: npx ts-node scripts/morning-routine/tasks/distribution-conductor.ts

```

---

## 5. Make.com Scenario Configuration (Manual)

**Data Store:**

* **Name:** `Board_Mappings`
* **Structure:** Key (`collection`), Value (`board_id`)

**Scenario Flow:**

1. **Webhook:** Capture `collection`, `board_name`.
2. **Get Record (Data Store):** Key = `{{collection}}`.
3. **Router:**
* **Route A (Known):** Record exists.
* Set Variable `final_board_id` = `{{Record.value}}`.


* **Route B (Unknown):** Record missing.
* **Pinterest List Boards:** Search `{{board_name}}`.
* **Router (Sub):**
* **Found:** Set `temp_id` = `{{ID}}`.
* **Missing:** **Pinterest Create Board** (`{{board_name}}`) → Set `temp_id` = `{{ID}}`.


* **Add Record (Data Store):** Key=`{{collection}}`, Value=`{{temp_id}}`.
* Set Variable `final_board_id` = `{{temp_id}}`.




4. **Converge:**
5. **RSS Get Feed:** `https://paperpause.app/animals/{{collection}}/index.xml`
6. **Pinterest Create Pin:**
* Board: `{{final_board_id}}` (Map option)
* Image: `{{RSS.image}}`
* Link: `{{RSS.link}}`



---

## 6. Acceptance Criteria

* [ ] **Zero-Touch Scaling:** Adding a new folder `content/animals/unicorns` automatically results in a "Unicorn Coloring Pages" board being created and pinned to the next day.
* [ ] **State Awareness:** Collections with >75 posts automatically slow down to 1x/week.
* [ ] **Resilience:** If GitHub fails to fire, the queue remains. If Make.com fails, the item is retried next time (via queue persistence logic adjustment if strict delivery is needed, but current logic "pops" to prevent blocking).
* [ ] **Security:** No API tokens for Pinterest exist in the GitHub Repo.
 