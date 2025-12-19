# Automated Image Generation Schedule

## Daily Schedule (EST)

```
🌅 5:00 AM EST → 🐱 5 Cat Images + 🐶 5 Dog Images
```

**Total per day**: 10 images (5 cats + 5 dogs)

## UTC Times (for GitHub Actions)

```
10:00 AM UTC → 🐱 Cats + 🐶 Dogs  (5:00 AM EST)
```

## Cron Configuration

```yaml
schedule:
  # Both cats and dogs at 5 AM EST
  - cron: '0 10 * * *'
# **PaperPause: Automation Schedule**

This document outlines the daily automation schedule for content generation and publication.

## **1. Daily Generation Schedule**

The primary content pipeline runs automatically once per day.

| Task | Time (EST) | Time (UTC) | Frequency |
| :--- | :--- | :--- | :--- |
| **Image Generation & SEO** | 5:00 AM | 10:00 AM | Daily |

*Note: The schedule uses UTC time. Adjustments for Daylight Saving Time (EST to EDT) happen automatically via the cron configuration.*

## **2. Daily Content Yield**

Each run of the pipeline produces the following assets:

| Collection | Count | Status |
| :--- | :--- | :--- |
| **Cats** | 1 | Published |
| **Dogs** | 1 | Published |
| **Horses** | 1 | Published |
| **Butterflies** | 1 | Published |
| **Sharks** | 1 | Published |
| **Total** | **5 Assets** | |

## **3. Workflow Execution Steps**

When the schedule triggers (10:00 AM UTC), the following sequence is executed:

1.  **Environment Setup:** GitHub runner starts, installs Node.js dependencies.
2.  **API Connections:** Connects to Gemini API (Vision/Pro) and Cloudflare.
3.  **Batch Generation:** Runs `generate-batch.ts` for each collection in the matrix.
    *   Generates a new, unique, high-quality coloring page image.
    *   Uploads the raw image to Cloudflare R2.
    *   Uploads the optimized image to Cloudflare Images.
4.  **SEO Review:** Runs `seo-review-batch.ts` to analyze the new images and generate metadata (Title, Description, Alt Text).
5.  **Commit & Push:** Commits the new markdown files to the repository.
6.  **Reporting:** Posts a completion report to the tracking issue.

## **4. Future Schedule Adjustments**

To increase the volume of content, the matrix in `.github/workflows/daily-generate-and-optimize.yml` can be expanded to include more collections or higher counts per batch.

---

**Quick Reference:**
- Daily run: 5:00 AM EST (10:00 AM UTC)
- Animals: Both 🐱 Cats + 🐶 Dogs
- Per run: 10 images (5 cats + 5 dogs)
- Status: Saved as drafts (manual publishing required)

