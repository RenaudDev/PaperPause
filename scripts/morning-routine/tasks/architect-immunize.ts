import fs from 'fs-extra';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../lib/logger';
import { ENV } from '../config/env';
import { FLAGS } from '../config/flags';
import { fetchIssueComments, parseTrashcanLogs, TrashcanLog } from '../lib/issue-parser';
import { loadPrompt, savePrompt, PromptConfig } from '../lib/prompt-manager';
import { withRetry } from '../lib/retry';

/**
 * Architect: Immunization Task (Agent 1)
 * 
 * Aggregates rejections from Issue #4 and updates prompt configs 
 * to "immunize" them against recurring failures.
 */

const REJECTION_THRESHOLD = 5; // Min failures per reason
const REJECTION_WINDOW_DAYS = 14;

interface RejectionGroup {
  category: string;
  collection: string;
  reason: string;
  count: number;
  latest_asset_id: string;
}

/**
 * Ask Gemini (Architect) to propose negative terms to fix a recurring failure
 */
async function brainstormImmunization(group: RejectionGroup, currentNegative: string): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-flash-preview',
    generationConfig: {
      temperature: 0.1, // High precision
    }
  });

  // PRD REQUIREMENT: Input prompt must be <= 500 chars (feedback loop growth cap)
  const inputPrompt = `Architect Agent 1: Fix recurring failure in coloring page collection.
COLLECTION: ${group.collection}
REASON: ${group.reason}
FAILURES: ${group.count} (Last 14 days)
CURRENT NEGATIVE: ${currentNegative.substring(0, 100)}...

GOAL: Propose 3-5 specific negative terms to block this defect.
OUTPUT: comma-separated list of terms only.`;

  if (inputPrompt.length > 500) {
    logger.warn(`Architect input prompt exceeds 500 chars (${inputPrompt.length}), truncating...`);
  }

  return withRetry(async () => {
    const result = await model.generateContent(inputPrompt.substring(0, 500));
    const text = result.response.text();
    
    // Clean up response: split by comma, trim, lowercase
    const terms = text.split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 1 && !currentNegative.toLowerCase().includes(t));
      
    return terms;
  });
}

async function run() {
  if (!FLAGS.ENABLE_IMMUNIZATION) {
    logger.info('Architect: Immunization is disabled (ENABLE_IMMUNIZATION=0).');
    return;
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.TRACKING_ISSUE_NUMBER || '4';

  if (!githubToken || !repo) {
    logger.warn('Architect: GitHub credentials missing, skipping immunization.');
    return;
  }

  try {
    // 1. Fetch rejections from Issue #4
    const rawComments = await fetchIssueComments(repo, issueNumber, githubToken);
    const logs = parseTrashcanLogs(rawComments);

    // 2. Filter by window
    const now = Date.now();
    const windowMs = REJECTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp_utc).getTime();
      return (now - logTime) < windowMs;
    });

    logger.info(`Found ${recentLogs.length} rejections in the last ${REJECTION_WINDOW_DAYS} days.`);

    // 3. Group rejections
    const groupsMap = new Map<string, RejectionGroup>();
    for (const log of recentLogs) {
      const key = `${log.category}/${log.collection}:${log.reason}`;
      const existing = groupsMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        groupsMap.set(key, {
          category: log.category,
          collection: log.collection,
          reason: log.reason,
          count: 1,
          latest_asset_id: log.asset_id
        });
      }
    }

    // 4. Identify sick collections
    const sickGroups = Array.from(groupsMap.values())
      .filter(g => g.count >= REJECTION_THRESHOLD)
      .sort((a, b) => b.count - a.count);

    if (sickGroups.length === 0) {
      logger.success('Architect: No collections meet the rejection threshold for immunization.');
      return;
    }

    logger.info(`Architect: Found ${sickGroups.length} groups requiring immunization.`);

    // 5. Apply immunizations
    for (const group of sickGroups) {
      const config = loadPrompt(group.category, group.collection);
      if (!config) continue;

      logger.info(`🩺 Immunizing ${group.category}/${group.collection} against ${group.reason} (${group.count} rejections)...`);

      const currentNegative = config.negative_prompt;
      const currentImmunizations = config.immunization_terms || [];
      
      const newTerms = await brainstormImmunization(group, currentNegative + ', ' + currentImmunizations.join(', '));
      
      if (newTerms.length > 0) {
        config.immunization_terms = Array.from(new Set([...currentImmunizations, ...newTerms]));
        
        // Final Safety Check (as merged into generation)
        const totalNegative = (config.negative_prompt + ', ' + config.immunization_terms.join(', ')).length;
        if (totalNegative > 400) { // Keep some buffer for positive prompt in the 500 cap
            logger.warn(`Immunization would make negative prompt very large (${totalNegative}), limiting...`);
            // Simple prune: keep latest terms
            config.immunization_terms = config.immunization_terms.slice(-10);
        }

        savePrompt(group.category, group.collection, config);
        logger.success(`✅ Immunized with ${newTerms.length} new terms: ${newTerms.join(', ')}`);
      } else {
        logger.info(`Architect decided no new terms were needed for ${group.collection}.`);
      }
    }

    logger.success('Architect: Immunization task complete.');

  } catch (error) {
    logger.error('Architect failed', error as Error);
    process.exit(1);
  }
}

run();
