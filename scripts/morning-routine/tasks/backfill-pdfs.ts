import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';
import { convertPngToPdf } from '../lib/storage';
import { ENV } from '../config/env';

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${ENV.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ENV.R2.ACCESS_KEY_ID,
        secretAccessKey: ENV.R2.SECRET_ACCESS_KEY
    }
});

interface BackfillResult {
    file: string;
    status: 'success' | 'skipped' | 'failed';
    reason?: string;
    pdfUrl?: string;
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadFromUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Check if PDF already exists in R2
 */
async function pdfExists(pdfKey: string): Promise<boolean> {
    try {
        await R2.send(new HeadObjectCommand({
            Bucket: ENV.R2.BUCKET_NAME,
            Key: pdfKey
        }));
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Extract collection from R2 URL path
 * e.g., "https://img.paperpause.app/dogs/zen-dog-coloring-page-3539.png" -> "dogs"
 * Preserves the case from the URL (which should already be lowercase after migration)
 */
function extractCollectionFromUrl(url: string): string {
    const match = url.match(/\/([^\/]+)\/[^\/]+\.png$/);
    return match ? match[1] : 'cats';
}

/**
 * Backfill PDFs for all existing coloring pages
 */
export const backfillPdfs = async () => {
    const contentDir = path.resolve(__dirname, '../../../content');
    
    // Find all markdown files in content/animals/**/*.md (exclude _index.md)
    const files = await glob(`${contentDir}/animals/**/*.md`, {
        ignore: ['**/_index.md']
    });

    console.log(`\n[Backfill] Found ${files.length} coloring pages to process`);
    console.log('═'.repeat(70));

    const results: BackfillResult[] = [];
    let skipped = 0;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = path.basename(file);
        const relPath = path.relative(contentDir, file);

        try {
            console.log(`\n[${i + 1}/${files.length}] Processing: ${relPath}`);

            // Read file
            const content = await fs.readFile(file, 'utf-8');
            const { data: frontmatter, content: markdown } = matter(content);

            // Skip if already has PDF
            if (frontmatter.has_pdf === true) {
                console.log(`  ⏭️  Skipped (already has PDF)`);
                results.push({ file: relPath, status: 'skipped', reason: 'Already has PDF' });
                skipped++;
                continue;
            }

            // Get PNG URL
            const r2_original = frontmatter.r2_original;
            if (!r2_original) {
                console.log(`  ❌ Failed: No r2_original found in frontmatter`);
                results.push({ file: relPath, status: 'failed', reason: 'No r2_original' });
                failed++;
                continue;
            }

            console.log(`  📥 Downloading PNG from R2...`);
            const pngBuffer = await downloadFromUrl(r2_original);
            console.log(`  ✓ Downloaded ${(pngBuffer.length / 1024 / 1024).toFixed(2)}MB PNG`);

            // Generate PDF
            console.log(`  🔄 Converting PNG to PDF...`);
            const pdfBuffer = await convertPngToPdf(pngBuffer);
            console.log(`  ✓ Generated ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB PDF`);

            // Determine PDF key
            const collection = extractCollectionFromUrl(r2_original);
            const pngFilename = path.basename(r2_original);
            const pdfFilename = pngFilename.replace('.png', '.pdf');
            const pdfKey = `${collection}/${pdfFilename}`;

            // Check if PDF already exists in R2
            const alreadyExists = await pdfExists(pdfKey);
            if (alreadyExists) {
                console.log(`  ℹ️  PDF already exists in R2, skipping upload`);
            } else {
                // Upload PDF
                console.log(`  📤 Uploading PDF to R2...`);
                await R2.send(new PutObjectCommand({
                    Bucket: ENV.R2.BUCKET_NAME,
                    Key: pdfKey,
                    Body: pdfBuffer,
                    ContentType: 'application/pdf',
                    ContentDisposition: `attachment; filename="${pdfFilename}"`
                }));
                console.log(`  ✓ PDF uploaded`);
            }

            // Update frontmatter
            const pdfUrl = `${ENV.R2.PUBLIC_URL_BASE}/${pdfKey}`;
            frontmatter.download_url = pdfUrl;
            frontmatter.has_pdf = true;

            // Write updated markdown
            const updatedContent = matter.stringify(markdown, frontmatter);
            await fs.writeFile(file, updatedContent);
            console.log(`  ✏️  Updated frontmatter`);
            console.log(`  ✅ Success: ${pdfUrl}`);

            results.push({ file: relPath, status: 'success', pdfUrl });
            successful++;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`  ❌ Failed: ${errorMsg}`);
            results.push({ file: relPath, status: 'failed', reason: errorMsg });
            failed++;
        }
    }

    // Summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`[Backfill] Complete`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`${'═'.repeat(70)}\n`);

    // Show failures
    if (failed > 0) {
        console.log(`[Backfill] Failed files:`);
        results
            .filter(r => r.status === 'failed')
            .forEach(r => {
                console.log(`  - ${r.file}: ${r.reason}`);
            });
    }

    return results;
};

// Allow direct execution
if (require.main === module) {
    backfillPdfs()
        .then(() => {
            console.log('[Backfill] Done');
            process.exit(0);
        })
        .catch(error => {
            console.error('[Backfill] Fatal error:', error);
            process.exit(1);
        });
}

