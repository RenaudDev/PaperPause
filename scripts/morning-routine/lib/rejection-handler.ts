import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { ENV } from '../config/env';
import { logger } from './logger';
import { QAFailureReason, QAResult } from '../../../.agents/art-critic/types';

/**
 * Rejection Handler
 * 
 * Handles assets that failed QA:
 * 1. Archives them to a 'rejected/' path in R2.
 * 2. Logs the failure to Issue #4 with the trashcan_v1 schema.
 */

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${ENV.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ENV.R2.ACCESS_KEY_ID,
        secretAccessKey: ENV.R2.SECRET_ACCESS_KEY
    }
});

export interface RejectionLogInput {
  asset_id: string;
  category: string;
  collection: string;
  qa_mode: string;
  qa_result: QAResult;
  reason: QAFailureReason;
  reason_details: string;
  image_url: string; // The CF URL that was evaluated
  r2_original: string; // The original R2 URL
  imageBuffer: Buffer;
  run_id: string;
}

/**
 * Archive rejected image to R2 and log to Issue #4
 */
export async function handleRejection(input: RejectionLogInput) {
  const rejectedKey = `rejected/${input.category}/${input.collection}/${input.asset_id}.png`;
  
  try {
    // 1. Upload to R2 rejected sink
    logger.info(`Archiving rejected asset to R2: ${rejectedKey}`);
    await R2.send(new PutObjectCommand({
      Bucket: ENV.R2.BUCKET_NAME,
      Key: rejectedKey,
      Body: input.imageBuffer,
      ContentType: 'image/png'
    }));

    const rejectedR2Url = `${ENV.R2.PUBLIC_URL_BASE}/${rejectedKey}`;

    // 2. Log to Issue #4 via GitHub API (if token available)
    const githubToken = process.env.GITHUB_TOKEN;
    const issueNumber = process.env.TRACKING_ISSUE_NUMBER || '4';
    const repo = process.env.GITHUB_REPOSITORY; // e.g. "user/repo"

    if (githubToken && repo) {
      const trashcanLog = {
        schema_version: "trashcan_v1",
        timestamp_utc: new Date().toISOString(),
        run_id: input.run_id,
        asset_id: input.asset_id,
        category: input.category,
        collection: input.collection,
        qa_mode: input.qa_mode,
        qa_result: input.qa_result,
        reason: input.reason,
        reason_details: input.reason_details,
        image_url: input.image_url,
        r2_original: input.r2_original,
        rejected_r2_url: rejectedR2Url
      };

      const commentBody = `### 🗑️ QA REJECTION: ${input.category}/${input.collection}\n\n` +
        `**Reason**: \`${input.reason}\` - ${input.reason_details}\n` +
        `**Run ID**: \`${input.run_id}\`\n\n` +
        `\`\`\`json\n${JSON.stringify(trashcanLog, null, 2)}\n\`\`\``;

      logger.info(`Logging rejection to GitHub Issue #${issueNumber}...`);
      
      await axios.post(
        `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`,
        { body: commentBody },
        { 
          headers: { 
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          } 
        }
      );
      
      logger.success(`Successfully logged rejection to Issue #${issueNumber}`);
    } else {
      logger.warn(`GitHub logging skipped: GITHUB_TOKEN or GITHUB_REPOSITORY missing.`, {
        repo,
        hasToken: !!githubToken
      });
      // Fallback: Just log the JSON to console so it appears in GHA logs
      console.log(`TRASHCAN_LOG_START\n${JSON.stringify(input, null, 2)}\nTRASHCAN_LOG_END`);
    }

  } catch (error) {
    logger.error('Failed to handle rejection', error as Error);
    // Don't rethrow, avoid crashing the whole batch if logging fails
  }
}
