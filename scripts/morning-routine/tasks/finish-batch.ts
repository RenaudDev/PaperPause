import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { logger } from '../lib/logger';
import { ENV } from '../config/env';
import { FLAGS } from '../config/flags';
import { downloadR2Object, convertPngToPdf, uploadPdf } from '../lib/storage';
import { reviewSEO } from '../../../.agents/seo-copywriter';

/**
 * Finisher Task (Story 1.C.2, 1.C.3)
 * 
 * Processes survivors (QA Pass) from a manifest:
 * 1. JIT PDF Generation (Story 1.C.3)
 * 2. SEO Copywriting (Story 1.C.2)
 * 3. File Renaming to Semantic Slug (Story 1.C.2)
 */

interface Manifest {
  runId: string;
  created: string[]; // Repo-relative paths to .md files
}

export async function finishBatch(manifestPath: string) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest: Manifest = fs.readJsonSync(manifestPath);
  const repoRoot = path.resolve(__dirname, '../../../');
  
  logger.info(`🚀 Starting Finisher for run: ${manifest.runId} (${manifest.created.length} files)`);

  for (const relPath of manifest.created) {
    const fullPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      logger.warn(`File not found, skipping: ${relPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const { data, content: body } = matter(content);

    // Skip if already published (idempotency)
    if (data.draft === false && data.download_url) {
      logger.info(`Skipping already finished asset: ${relPath}`);
      continue;
    }

    // Determine if it was a survivor
    // Note: If QA_MODE was 'observe', we still treat them as survivors for now
    // unless explicitly rejected in frontmatter (not implemented yet, but for now we follow the manifest)
    
    logger.info(`Finishing asset: ${relPath}`);

    try {
      // 1. JIT PDF Generation (Story 1.C.3)
      let downloadUrl = data.download_url || '';
      const r2Key = data.r2_original ? data.r2_original.replace(`${ENV.R2.PUBLIC_URL_BASE}/`, '') : null;
      
      if (!downloadUrl && r2Key && FLAGS.ENABLE_PDF) {
        logger.info(`Generating JIT PDF for ${r2Key}...`);
        const pngBuffer = await downloadR2Object(r2Key);
        const pdfBuffer = await convertPngToPdf(pngBuffer);
        
        const pdfKey = r2Key.replace('.png', '.pdf');
        const pdfFilename = path.basename(pdfKey);
        
        downloadUrl = await uploadPdf(pdfBuffer, pdfKey, pdfFilename);
      }

      logger.debug(`Download URL after step 1: ${downloadUrl}`);

      // 2. SEO Copywriting (Story 1.C.2)
      let finalData: any = { ...data, download_url: downloadUrl };
      let finalSlug = path.basename(fullPath, '.md');
      
      if (FLAGS.ENABLE_FINISHING) {
        logger.info(`Calling SEO Copywriter for ${data.asset_id}...`);
        const seoResult = await reviewSEO({
          imageUrl: data.image_url,
          subject: data.prompt || data.categories?.[0] || 'coloring-pages',
          style: data.style || 'Kawaii',
          medium: data.medium || 'Markers',
          audience: data.audience || 'Kids',
          originalPrompt: data.prompt
        });

        logger.info(`SEO Copywriter returned slug: ${seoResult.slug}`);

        finalData = {
          ...finalData,
          title: seoResult.title,
          description: seoResult.description,
          pinterest_description: seoResult.pinterest_description,
          medium: seoResult.medium,
          prompt: seoResult.prompt, // Alt text / Prompt
          draft: false // Mark as published
        };
        
        // Prefix with date if the original had one
        const datePrefixMatch = path.basename(fullPath).match(/^\d{8}-/);
        const datePrefix = datePrefixMatch ? datePrefixMatch[0] : '';
        finalSlug = `${datePrefix}${seoResult.slug}`;
      }

      // 3. Save Updated Content (Story 1.C.1 Idempotency)
      const updatedMarkdown = matter.stringify(body, finalData);
      const newPath = path.join(path.dirname(fullPath), `${finalSlug}.md`);

      fs.writeFileSync(newPath, updatedMarkdown);
      
      // If the filename changed, delete the old placeholder
      if (newPath !== fullPath) {
        fs.removeSync(fullPath);
        logger.success(`Asset finished and renamed: ${finalSlug}.md`);
      } else {
        logger.success(`Asset finished: ${relPath}`);
      }

    } catch (err) {
      logger.error(`Finisher failed for ${relPath}`, err as Error);
    }
  }

  logger.success(`Finisher complete for run: ${manifest.runId}`);
}

// Allow direct execution
if (require.main === module) {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    logger.error('Usage: ts-node finish-batch.ts <manifest-path>');
    process.exit(1);
  }

  finishBatch(path.resolve(manifestPath))
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('Finisher fatal error', err);
      process.exit(1);
    });
}
