import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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

interface MigrationResult {
    key: string;
    status: 'success' | 'skipped' | 'failed';
    reason?: string;
    newKey?: string;
}

/**
 * Check if a file exists in R2
 */
async function fileExists(key: string): Promise<boolean> {
    try {
        await R2.send(new HeadObjectCommand({
            Bucket: ENV.R2.BUCKET_NAME,
            Key: key
        }));
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * List all objects in R2 with a given prefix
 */
async function listObjects(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
        const response = await R2.send(new ListObjectsV2Command({
            Bucket: ENV.R2.BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken: continuationToken
        }));

        if (response.Contents) {
            keys.push(...response.Contents.map(obj => obj.Key!).filter(Boolean));
        }

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
}

/**
 * Copy file from source key to destination key in R2
 */
async function copyFile(sourceKey: string, destKey: string): Promise<void> {
    await R2.send(new CopyObjectCommand({
        Bucket: ENV.R2.BUCKET_NAME,
        CopySource: `${ENV.R2.BUCKET_NAME}/${sourceKey}`,
        Key: destKey
    }));
}

/**
 * Delete file from R2
 */
async function deleteFile(key: string): Promise<void> {
    await R2.send(new DeleteObjectCommand({
        Bucket: ENV.R2.BUCKET_NAME,
        Key: key
    }));
}

/**
 * Migrate files from capitalized folders to lowercase folders
 */
export const migrateR2Case = async (dryRun: boolean = false) => {
    const capitalizedFolders = ['Dogs', 'Butterflies', 'Horses'];
    const results: MigrationResult[] = [];

    console.log(`\n[R2 Migration] ${dryRun ? 'DRY RUN - ' : ''}Starting case migration`);
    console.log('═'.repeat(70));

    let totalFiles = 0;
    let successful = 0;
    let skipped = 0;
    let failed = 0;

    for (const folder of capitalizedFolders) {
        console.log(`\n[${folder}] Scanning folder...`);
        
        try {
            const keys = await listObjects(`${folder}/`);
            console.log(`  Found ${keys.length} files in ${folder}/`);
            
            for (const key of keys) {
                totalFiles++;
                const filename = key.split('/').pop()!;
                const lowercaseFolder = folder.toLowerCase();
                const newKey = `${lowercaseFolder}/${filename}`;

                try {
                    // Check if destination already exists
                    const destExists = await fileExists(newKey);
                    
                    if (destExists) {
                        console.log(`  ⏭️  Skipped: ${key} (destination exists)`);
                        results.push({ key, status: 'skipped', reason: 'Destination exists', newKey });
                        skipped++;
                        continue;
                    }

                    if (dryRun) {
                        console.log(`  [DRY RUN] Would copy: ${key} → ${newKey}`);
                        results.push({ key, status: 'success', newKey });
                        successful++;
                    } else {
                        // Copy to new location
                        console.log(`  📋 Copying: ${key} → ${newKey}`);
                        await copyFile(key, newKey);

                        // Verify copy succeeded
                        const copyVerified = await fileExists(newKey);
                        if (!copyVerified) {
                            throw new Error('Copy verification failed');
                        }

                        // Delete original
                        console.log(`  🗑️  Deleting original: ${key}`);
                        await deleteFile(key);

                        console.log(`  ✅ Success: ${key}`);
                        results.push({ key, status: 'success', newKey });
                        successful++;
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.log(`  ❌ Failed: ${key} - ${errorMsg}`);
                    results.push({ key, status: 'failed', reason: errorMsg });
                    failed++;
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`  ❌ Failed to scan ${folder}: ${errorMsg}`);
            failed++;
        }
    }

    // Summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`[R2 Migration] ${dryRun ? 'DRY RUN ' : ''}Complete`);
    console.log(`  Total files: ${totalFiles}`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`${'═'.repeat(70)}\n`);

    // Show failures
    if (failed > 0) {
        console.log(`[R2 Migration] Failed files:`);
        results
            .filter(r => r.status === 'failed')
            .forEach(r => {
                console.log(`  - ${r.key}: ${r.reason}`);
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

    migrateR2Case(dryRun)
        .then(() => {
            console.log('[R2 Migration] Done');
            process.exit(0);
        })
        .catch(error => {
            console.error('[R2 Migration] Fatal error:', error);
            process.exit(1);
        });
}

