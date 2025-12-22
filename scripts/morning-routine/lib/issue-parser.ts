import axios from 'axios';
import { logger } from './logger';

/**
 * Issue Parser Library
 * 
 * Fetches comments from a GitHub Issue and parses JSON blocks 
 * matching the 'trashcan_v1' schema.
 */

export interface TrashcanLog {
  schema_version: "trashcan_v1";
  timestamp_utc: string;
  run_id: string;
  asset_id: string;
  category: string;
  collection: string;
  qa_mode: string;
  qa_result: string;
  reason: string;
  reason_details: string;
  image_url: string;
  r2_original: string;
  rejected_r2_url: string;
}

/**
 * Fetch all comments from the tracking issue
 */
export async function fetchIssueComments(
  repo: string,
  issueNumber: string,
  token: string
): Promise<any[]> {
  logger.info(`Fetching comments from ${repo} Issue #${issueNumber}...`);
  
  let comments: any[] = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const response = await axios.get(
      `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`,
      {
        params: { page, per_page: perPage },
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    const pageComments = response.data;
    comments = comments.concat(pageComments);
    
    if (pageComments.length < perPage) break;
    page++;
  }
  
  return comments;
}

/**
 * Extract trashcan_v1 blocks from raw comment text
 */
export function parseTrashcanLogs(comments: any[]): TrashcanLog[] {
  const logs: TrashcanLog[] = [];
  
  for (const comment of comments) {
    const body = comment.body;
    if (!body) continue;
    
    // Look for JSON code blocks
    const jsonMatch = body.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) continue;
    
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.schema_version === 'trashcan_v1') {
        logs.push(parsed as TrashcanLog);
      }
    } catch (e) {
      // Skip invalid JSON
      logger.debug(`Failed to parse JSON in comment: ${comment.id}`);
    }
  }
  
  // Dedup by asset_id (keep latest if duplicate for some reason)
  const dedupedMap = new Map<string, TrashcanLog>();
  for (const log of logs) {
    dedupedMap.set(log.asset_id, log);
  }
  
  return Array.from(dedupedMap.values());
}
