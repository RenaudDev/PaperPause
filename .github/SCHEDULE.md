# Automated Image Generation Schedule

## Daily Schedule (EST)

```
🌅 6:00 AM EST → 🐱 Generate 5 Cat Images
🌆 6:00 PM EST → 🐶 Generate 5 Dog Images
```

## UTC Times (for GitHub Actions)

```
11:00 AM UTC → 🐱 Cats  (6:00 AM EST)
11:00 PM UTC → 🐶 Dogs  (6:00 PM EST)
```

## Cron Configuration

```yaml
schedule:
  # Cats at 6 AM EST
  - cron: '0 11 * * *'
  # Dogs at 6 PM EST
  - cron: '0 23 * * *'
```

## Daylight Saving Time Adjustment

During **EDT** (March - November), EST becomes UTC-4 instead of UTC-5.

If you want to maintain the same local times during DST:

```yaml
schedule:
  # Cats at 6 AM EDT
  - cron: '0 10 * * *'
  # Dogs at 6 PM EDT
  - cron: '0 22 * * *'
```

## Time Zone Conversion Reference

| Local Time | EST (UTC-5) | EDT (UTC-4) |
|------------|-------------|-------------|
| 6:00 AM    | 11:00 UTC   | 10:00 UTC   |
| 6:00 PM    | 23:00 UTC   | 22:00 UTC   |

## What Happens Each Run

1. ✅ Workflow triggers at scheduled time
2. ✅ Determines which animal type to generate (cats or dogs)
3. ✅ Generates 5 images using Recraft API
4. ✅ Uploads to Cloudflare R2 and CF Images
5. ✅ Creates markdown files with metadata
6. ✅ Sets `draft: false` (publishes live)
7. ✅ Commits and pushes to repository

## Manual Override

You can manually trigger the workflow anytime with options:
- Generate **cats only**
- Generate **dogs only**
- Generate **both**

---

**Quick Reference:**
- Morning (6 AM EST) = Cats 🐱
- Evening (6 PM EST) = Dogs 🐶
- Each run = 5 images
- Total per day = 10 images (5 cats + 5 dogs)

