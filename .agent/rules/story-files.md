---
trigger: glob
globs: .docs/prd/stories/**, .docs/prd/epics/**
---

# Scrum Story Writing Standard (Globbed)

Recommended activation: **Glob** (PRD epics/stories only)

## Story format (required)
Each story must include:
- **Epic:** `<N> - <Epic Title>` (must match the epic file)
- **User story statement** (Scrum):
  - `As a <persona>, I want <capability>, so that <benefit>.`
  - If no persona applies, use: `As the system, I want ...`
- **Acceptance criteria** (Scrum-friendly):
  - Prefer **Given/When/Then** bullets
  - Include at least 1 **negative case** (failure/rollback-safe behavior)
- **Definition of Ready (DoR)** (checklist):
  - Dependencies identified (links)
  - Inputs/outputs defined (files, flags, schemas)
  - Rollback path stated
- **Definition of Done (DoD)** (checklist):
  - Tests/verification steps listed (commands or CI signals)
  - Docs updated (if behavior changes)
  - Idempotency + disable switch validated (if automation)

## Optional (encouraged)
- **Estimation**: 1–8 points (or S/M/L) + brief rationale
- **Non-goals**
- **Risks / edge cases**