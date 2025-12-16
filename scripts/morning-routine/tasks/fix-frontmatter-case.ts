import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

interface FixResult {
    file: string;
    status: 'success' | 'skipped' | 'failed';
    changes?: string[];
    reason?: string;
}

/**
 * Fix case in URLs by replacing capitalized folder names with lowercase
 */
function fixUrlCase(url: string): { fixed: string; changed: boolean } {
    if (!url) {
        return { fixed: url, changed: false };
    }

    const original = url;
    let fixed = url;

    // Replace capitalized folder names with lowercase
    const replacements: Record<string, string> = {
        '/Dogs/': '/dogs/',
        '/Butterflies/': '/butterflies/',
        '/Horses/': '/horses/'
    };

    for (const [from, to] of Object.entries(replacements)) {
        fixed = fixed.replace(from, to);
    }

    return {
        fixed,
        changed: fixed !== original
    };
}

/**
 * Fix frontmatter URLs in all markdown files
 */
export const fixFrontmatterCase = async (dryRun: boolean = false) => {
    const contentDir = path.resolve(__dirname, '../../../content');
    
    // Find all markdown files in content/animals/**/*.md (exclude _index.md)
    const files = await glob(`${contentDir}/animals/**/*.md`, {
        ignore: ['**/_index.md']
    });

    console.log(`\n[Frontmatter Fix] ${dryRun ? 'DRY RUN - ' : ''}Found ${files.length} files to process`);
    console.log('═'.repeat(70));

    const results: FixResult[] = [];
    let successful = 0;
    let skipped = 0;
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

            const changes: string[] = [];

            // Fix r2_original
            if (frontmatter.r2_original) {
                const { fixed, changed } = fixUrlCase(frontmatter.r2_original);
                if (changed) {
                    changes.push(`r2_original: ${frontmatter.r2_original} → ${fixed}`);
                    frontmatter.r2_original = fixed;
                }
            }

            // Fix download_url
            if (frontmatter.download_url) {
                const { fixed, changed } = fixUrlCase(frontmatter.download_url);
                if (changed) {
                    changes.push(`download_url: ${frontmatter.download_url} → ${fixed}`);
                    frontmatter.download_url = fixed;
                }
            }

            // Skip if no changes needed
            if (changes.length === 0) {
                console.log(`  ⏭️  No changes needed`);
                results.push({ file: relPath, status: 'skipped', reason: 'No changes needed' });
                skipped++;
                continue;
            }

            if (dryRun) {
                console.log(`  [DRY RUN] Would update:`);
                changes.forEach(change => console.log(`    - ${change}`));
                results.push({ file: relPath, status: 'success', changes });
                successful++;
            } else {
                // Write updated markdown
                const updatedContent = matter.stringify(markdown, frontmatter);
                await fs.writeFile(file, updatedContent);

                console.log(`  ✏️  Updated:`);
                changes.forEach(change => console.log(`    - ${change}`));
                console.log(`  ✅ Success`);

                results.push({ file: relPath, status: 'success', changes });
                successful++;
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`  ❌ Failed: ${errorMsg}`);
            results.push({ file: relPath, status: 'failed', reason: errorMsg });
            failed++;
        }
    }

    // Summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`[Frontmatter Fix] ${dryRun ? 'DRY RUN ' : ''}Complete`);
    console.log(`  Total files: ${files.length}`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`${'═'.repeat(70)}\n`);

    // Show failures
    if (failed > 0) {
        console.log(`[Frontmatter Fix] Failed files:`);
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
    const dryRun = process.argv.includes('--dry-run');
    
    if (dryRun) {
        console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
    }

    fixFrontmatterCase(dryRun)
        .then(() => {
            console.log('[Frontmatter Fix] Done');
            process.exit(0);
        })
        .catch(error => {
            console.error('[Frontmatter Fix] Fatal error:', error);
            process.exit(1);
        });
}

