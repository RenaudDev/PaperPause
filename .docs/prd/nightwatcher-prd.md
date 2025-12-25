# Nightwatcher Distribution System PRD

**Epic:** `1 - PaperPause Autonomy System`  
**Status:** ✅ Implemented  
**Architecture:** Success-Gated Randomized Distribution (GitHub) → One-Way Fire (Make.com)

---

## 1. Executive Summary

The **Nightwatcher Distribution System** is a fully automated Pinterest distribution pipeline that:

- **Only posts new content:** Uses manifest-based success gating to ensure only collections that successfully generated images get scheduled
- **Randomizes post times:** Each collection gets a unique random time slot daily (1 AM - 4 PM ET)
- **Prevents duplicates:** Failed generation = no scheduling = no duplicate pins
- **Scales effortlessly:** From 5 to 50+ collections without human intervention

---

## 2. Architecture Overview

### Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│              daily-generate-and-optimize.yml (12:10 AM ET)             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Generate images (matrix per collection)                             │
│ 2. Write manifests with category/collection/created[]                  │
│ 3. Commit content                                                      │
│ 4. Run Scheduler (--from-manifests)                                    │
│    → Only successful collections get random time slots                 │
│ 5. Commit queue                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│              distribution-system.yml (Every 15 min)                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Read queue                                                          │
│ 2. Find items where scheduled_at <= now                                │
│ 3. Fire webhooks for all due items                                     │
│ 4. Remove successful items from queue                                  │
│ 5. Commit updated queue                                                │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────────────┐
│                      Make.com (Executor)                                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Webhook receives: collection, board_name, rss_url                   │
│ 2. Check Data Store for cached board_id                                │
│ 3. If miss: Search/Create Pinterest board, cache ID                    │
│ 4. Fetch RSS feed → Get latest item                                    │
│ 5. Create Pin                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Design Decisions

### Success-Gated Scheduling
- The scheduler reads **generation manifests** (not the file system)
- Only collections with `created.length > 0` are scheduled
- This prevents posting yesterday's content if today's generation failed

### Randomized Time Slots
- Window: **06:00 - 21:00 UTC** (1 AM - 4 PM ET)
- Slots: Every 15 minutes (60 slots available)
- Assignment: Fisher-Yates shuffle for even distribution
- No collisions: Each collection gets a unique slot

### RSS Propagation Buffer
- Generation runs at **05:10 UTC** (12:10 AM ET)
- First possible post at **06:00 UTC** (1:00 AM ET)
- 50-minute buffer ensures GitHub Pages has rebuilt

---

## 4. Technical Specifications

### Queue Schema (`config/distribution-queue.json`)

```json
{
  "generated_at": "2025-12-26T05:15:00Z",
  "queue": [
    {
      "collection": "dogs",
      "board_name": "Dogs Coloring Pages",
      "mode": "growth",
      "priority": 10,
      "rss_url": "https://paperpause.app/animals/dogs/index.xml",
      "scheduled_at": "2025-12-26T14:30:00Z"
    }
  ]
}
```

### Manifest Schema (`scripts/morning-routine/.runs/*.json`)

```json
{
  "runId": "2025-12-26T05-15-00Z-dogs",
  "category": "animals",
  "collection": "dogs",
  "created": [
    "content/animals/dogs/20251226-golden-retriever-garden-for-kids-ab12.md"
  ]
}
```

### Environment Variables

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `MAKE_WEBHOOK` | GitHub Secret | Make.com scenario webhook URL |
| `MAKE_WEBHOOK_API` | GitHub Secret | Make.com API key for auth header |

---

## 5. Workflows

### `daily-generate-and-optimize.yml`

- **Schedule:** `10 5 * * *` (12:10 AM ET)
- **Jobs:**
  - `setup`: Foreman + Designer
  - `generate`: Matrix generation (1 image per collection)
  - `commit`: Content commit + Scheduler run + Queue commit

### `distribution-system.yml`

- **Schedule:** `*/15 6-22 * * *` (Every 15 min, 1 AM - 5 PM ET)
- **Jobs:**
  - `distributor`: Check for due items, fire webhooks, commit queue

---

## 6. Acceptance Criteria

- [x] **Success-Gating:** Only collections with successful generation are scheduled
- [x] **Randomized Times:** Each collection gets a unique random time slot
- [x] **No Duplicates:** Failed generation → no queue entry → no duplicate pin
- [x] **Zero-Touch Scaling:** New collections automatically get boards and start posting
- [x] **State Awareness:** Collections with ≥75 posts slow down to weekly (maintenance mode)
- [x] **Security:** No Pinterest tokens in GitHub repo; Make.com manages OAuth

---

## 7. Manual Setup (One-Time)

### Make.com
1. Create `Board_Mappings` Data Store (key: collection, value: board_id)
2. Build scenario: Webhook → Board lookup/create → RSS → Create Pin
3. Configure Pinterest OAuth connection

### GitHub
1. Add secret: `MAKE_WEBHOOK` (scenario webhook URL)
2. Add secret: `MAKE_WEBHOOK_API` (Make.com API key)