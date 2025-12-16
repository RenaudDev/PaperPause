# Daily Workflow Setup - Complete ✅

## What Was Set Up

A fully automated GitHub Actions workflow that runs daily to generate and publish coloring page images.

## Files Created

1. **`.github/workflows/daily-image-generation.yml`**
   - Main GitHub Actions workflow file
   - Runs daily at 5:00 AM EST (10:00 AM UTC)
   - Can also be triggered manually

2. **`scripts/morning-routine/tasks/publish-drafts.ts`**
   - Script that sets `draft: false` on all generated images
   - Makes images go live automatically

3. **`.github/GITHUB_ACTIONS_SETUP.md`**
   - Detailed setup instructions
   - Lists all required GitHub secrets
   - Troubleshooting guide

## What the Workflow Does

The workflow runs **once daily** at 5:00 AM EST:

1. ✅ **Generates 1 cat image** - Uses Recraft API with cat prompts
2. ✅ **Generates 1 dog image** - Uses Recraft API with dog prompts
3. ✅ **Generates 1 horse image** - Uses Recraft API with horse prompts
4. ✅ **Generates 1 butterfly image** - Uses Recraft API with butterfly prompts
5. ✅ **Automatically publishes** - Images are set to `draft: false` and go live immediately
6. ✅ **Commits changes** - Pushes to repository with timestamp

**Total**: 4 images generated and published per day (1 cat + 1 dog + 1 horse + 1 butterfly)

**Important**: Images are automatically published and go live immediately.

## Next Steps

### 1. Add GitHub Secrets

You need to add these secrets to your GitHub repository:

**Go to**: Repository → Settings → Secrets and variables → Actions → New repository secret

**Required Secrets:**
- `RECRAFT_API_KEY`
- `GEMINI_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `CF_IMAGES_ACCOUNT_ID`
- `CF_IMAGES_API_TOKEN`
- `CF_IMAGES_ACCOUNT_HASH`

📝 **Tip**: Copy values from your `.dev.vars` file

### 2. Enable Workflow Permissions

**Go to**: Repository → Settings → Actions → General → Workflow permissions

✅ Select: **"Read and write permissions"**

This allows the workflow to commit and push changes.

### 3. Test the Workflow

#### Option A: Wait for Scheduled Run
- **5:00 AM EST (10:00 AM UTC)** - Both cats and dogs are generated automatically

#### Option B: Trigger Manually
1. Go to **Actions** tab
2. Select **"Daily Image Generation"**
3. Click **"Run workflow"**
4. Select branch
5. Choose animal type:
   - **all** - Generate all animals (cats, dogs, horses, butterflies)
   - **cats** - Generate only cat images
   - **Dogs** - Generate only dog images
   - **Horses** - Generate only horse images
   - **Butterflies** - Generate only butterfly images
6. Click **"Run workflow"**

## Local Testing

You can test the scripts locally:

```bash
# Generate 1 cat image
npm run generate animals cats 1

# Generate 1 dog image  
npm run generate animals Dogs 1

# Generate 1 horse image
npm run generate animals Horses 1

# Generate 1 butterfly image
npm run generate animals Butterflies 1

# Or generate multiple images
npm run generate animals cats 5

# Publish any remaining drafts (set draft: false)
npm run publish:drafts
```

## Publishing Images

### Automatic Publishing

Images are **automatically published** when generated:
- The `generate-batch.ts` script creates images with `draft: false`
- The workflow includes a safety step that ensures all drafts are published
- Images go live immediately after generation

### Manual Publishing (if needed)

If you need to publish existing draft images manually:

**Option 1: Use the publish script**
```bash
npm run publish:drafts
```
This will set `draft: false` on ALL draft images.

**Option 2: Manually edit files**
- Open the `.md` files in `content/animals/` subdirectories (cats, Dogs, Horses, Butterflies)
- Change `draft: true` to `draft: false`
- Commit and push

## Customization

### Change Schedule

Edit `.github/workflows/daily-image-generation.yml`:

```yaml
schedule:
  # Both cats and dogs: 5:00 AM EST = 10:00 AM UTC
  - cron: '0 10 * * *'
```

**Time Zone Reference:**
- 5 AM EST = 10:00 AM UTC (during standard time)
- 5 AM EDT = 9:00 AM UTC (during daylight saving time)

**Other Schedule Examples:**
- `0 11 * * *` - 6 AM EST / 11 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9 AM UTC
- `0 0 * * *` - Daily at midnight UTC

### Change Number of Images

Edit the workflow file and change the count parameter:

```yaml
- name: Generate 1 Cat Image
  run: npm run generate animals cats 5  # Change 1 to 5

- name: Generate 1 Dog Image
  run: npm run generate animals Dogs 5  # Change 1 to 5

- name: Generate 1 Horse Image
  run: npm run generate animals Horses 5  # Change 1 to 5

- name: Generate 1 Butterfly Image
  run: npm run generate animals Butterflies 5  # Change 1 to 5
```

This will generate 5 images per collection instead of 1.

### Add More Collections

To generate images for additional animal types:

1. Add new collection prompt files in `scripts/morning-routine/config/prompts/`
2. Add generation step to workflow:

```yaml
- name: Generate 5 Rabbit Images
  run: npm run generate animals rabbits 5
```

## Monitoring

### View Workflow Runs
- Go to **Actions** tab in GitHub
- View history of all runs
- Click any run to see detailed logs

### Check Generated Files
- New images appear in:
  - `content/animals/cats/`
  - `content/animals/Dogs/`
  - `content/animals/Horses/`
  - `content/animals/Butterflies/`
- Each run creates a commit with timestamp

## Troubleshooting

### Workflow Not Running
- Check if workflow is enabled in Actions tab
- Verify cron schedule is correct
- Check workflow permissions are set

### Images Not Publishing
- Check if `draft: false` is being set in markdown files (should be automatic)
- Verify the `publish-drafts.ts` script step is running in workflow logs
- Review workflow logs for any errors during generation or publishing

### API Errors
- Check API keys are valid
- Verify rate limits haven't been exceeded
- Review R2 and Cloudflare Images quotas

## Support

For detailed setup instructions, see:
- `.github/GITHUB_ACTIONS_SETUP.md` - Complete setup guide
- `scripts/morning-routine/tasks/generate-batch.ts` - Image generation logic
- `scripts/morning-routine/tasks/publish-drafts.ts` - Publishing logic

---

**Status**: ✅ Ready to deploy
**Last Updated**: December 15, 2024

