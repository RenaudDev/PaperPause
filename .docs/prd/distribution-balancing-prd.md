# Distribution Balancing Problem PRD

**Status:** Analysis / Proposal  
**Related:** nightwatcher-prd.md, Story 1.E.3

---

## 1. Problem Statement

The current maintenance scheduling uses a deterministic hash:
```
shouldSchedule = (DayOfYear % 7) == (CollectionHash % 7)
```

This causes **unbalanced daily post volume**:

| Scenario | Monday | Tue-Sun |
| :--- | :--- | :--- |
| 5 daily + 10 maintenance (all hash to Mon) | **15 posts** | 5 posts |
| 5 daily + 10 maintenance (evenly spread) | 6-7 posts | 6-7 posts |

**Why This Matters:**
1. **Pinterest Algorithm:** Prefers consistent posting patterns over bursts
2. **Rate Limits:** Bursty behavior could trigger API throttling
3. **User Engagement:** Steady content flow keeps audience engaged daily

---

## 2. Root Cause Analysis

The hash function is **collection-name-dependent**, not **balance-aware**:
- `simpleHash("dogs") % 7` → some day X
- `simpleHash("cats") % 7` → could also be day X

No mechanism exists to:
1. Count how many are already scheduled per day
2. Redistribute to balance across the week

---

## 3. Proposed Solutions

### Option A: Round-Robin Assignment (Recommended)

**Concept:** Assign maintenance collections to days in round-robin order, not by hash.

**Implementation:**
```typescript
// Sort maintenance collections alphabetically for determinism
const maintenanceCollections = collections.filter(c => c.count >= 75).sort();

// Assign each to a day (0-6) in round-robin
maintenanceCollections.forEach((collection, index) => {
  const targetDay = index % 7;
  if (currentDayOfWeek === targetDay) {
    scheduleCollection(collection);
  }
});
```

**Pros:**
- Simple, deterministic
- Perfect 7-day spread for any number of collections
- No state required

**Cons:**
- Assignment changes when collections are added/removed
- Less "random" feel to posting pattern

---

### Option B: Stable Day Assignment (Hash + Shuffle)

**Concept:** Use a seeded shuffle to assign stable days that are also balanced.

**Implementation:**
1. Hash each collection name
2. Sort by hash (deterministic order)
3. Assign days: first collection → Day 0, second → Day 1, ... wraps at 7

**Pros:**
- Stable assignments per collection
- Balanced distribution
- Deterministic

**Cons:**
- More complex logic

---

### Option C: Dynamic Daily Balancing

**Concept:** Each day, the scheduler checks which day has the fewest upcoming posts and assigns maintenance collections to balance.

**Implementation:**
1. Load `distribution-queue.json` (includes past scheduled items)
2. Count posts per weekday for the next 7 days
3. Assign maintenance collections to the least-loaded day

**Pros:**
- Optimal balancing in real-time
- Adapts to changing collection counts

**Cons:**
- Requires lookahead state
- More complex, potential for drift

---

### Option D: Daily Cap with Overflow

**Concept:** Set a maximum posts-per-day cap. If exceeded, defer to next day.

**Example:**
- Cap: 10 posts/day
- Monday: 5 daily + 3 maintenance = 8 ✓
- Monday (overflow): 2 more maintenance → deferred to Tuesday

**Pros:**
- Hard limit on daily volume
- Protects rate limits

**Cons:**
- Could push posts indefinitely if cap too low
- Maintenance posts may drift from their "assigned" day

---

## 4. Recommendation

**Option A: Round-Robin Assignment** is the simplest and most effective.

| Criteria | Round-Robin | Hash+Shuffle | Dynamic | Daily Cap |
| :--- | :---: | :---: | :---: | :---: |
| Implementation Complexity | ⭐ Low | Medium | High | Medium |
| Balance Guarantee | ✅ Perfect | ✅ Perfect | ✅ Dynamic | ⚠️ Approximate |
| Determinism | ✅ Yes | ✅ Yes | ⚠️ Partial | ⚠️ Partial |
| No State Required | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

---

## 5. Example Outcome (Round-Robin)

**Collections:**
- 5 daily (dogs, cats, horses, sharks, butterflies)
- 10 maintenance (bears, birds, deer, dolphins, eagles, foxes, lions, owls, pandas, wolves)

**Weekly Distribution:**

| Day | Daily | Maintenance | Total |
| :--- | :--- | :--- | :--- |
| Mon | 5 | bears, lions | 7 |
| Tue | 5 | birds, owls | 7 |
| Wed | 5 | deer, pandas | 7 |
| Thu | 5 | dolphins, wolves | 7 |
| Fri | 5 | eagles | 6 |
| Sat | 5 | foxes | 6 |
| Sun | 5 | — | 5 |

Average: ~6.4 posts/day (vs. 15/5/5/5/5/5/5 with bad hash luck)

---

## 6. Decision Required

1. Should we implement Round-Robin (Option A)?
2. Should we add a daily cap as a safety net (Option D hybrid)?
3. Any preference for a different approach?
