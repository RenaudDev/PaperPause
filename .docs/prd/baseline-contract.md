# Baseline Contract: PaperPause Autonomy System

**Version:** 1.0 (Baseline)
**Date:** December 21, 2025

## 1. Overview
This document defines the "known good" state of the PaperPause daily production pipeline as of December 21, 2025. This state serves as the mandatory rollback target for all autonomous rollout phases.

## 2. Pipeline Invariants
The following behaviors must remain functional regardless of which autonomous features are enabled:
1. **Trigger**: Daily at 5:00 AM EST (10:00 AM UTC) via GitHub Actions cron.
2. **Matrix Generation**: Hardcoded set of collections (current: `cats, dogs, horses, butterflies, sharks`).
3. **Workflow Steps**:
   - `Generate`: Creates 1 image per collection using Gemini (Step 1.32).
   - `SEO`: Best-effort metadata optimization and renaming (Step 1.15).
   - `Commit`: Commits newly generated markdown files to `main`.
4. **Issue Tracking**:
   - Primary Run Summary: Posted to **Issue #1**.
   - (New) Rejection Log: Reserved for **Issue #4**.

## 3. Core Artifacts
- **Markdown**: Created in `content/animals/<collection>/`.
- **Manifests**: Generated in `scripts/morning-routine/.runs/<runId>.json`.
- **Assets**: Uploaded to Cloudflare R2 and Cloudflare Images.

## 4. Error Handling
- SEO optimization failures are allowed to be "best-effort" (`continue-on-error: true`).
- Generation failures halt the specific matrix job but do not crash the entire workflow run.

## 5. Rollback Procedure
To revert the system to this baseline:
1. Set all `ENABLE_*` feature flags to `0` in the GitHub Actions workflow.
2. Verify that `daily-generate-and-optimize.yml` matches the structure defined in this contract.
