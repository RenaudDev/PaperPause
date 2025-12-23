
import fs from 'fs-extra';
import path from 'path';
import { listContent } from '../lib/content-manager';
import { logger } from '../lib/logger';
import glob from 'glob';

// --- Configuration ---
const CONTENT_ROOT = path.resolve(__dirname, '../../../content/animals');
const QUEUE_FILE = path.resolve(__dirname, '../../../config/distribution-queue.json');

// --- Types ---
interface QueueItem {
  collection: string;
  board_name: string;
  mode: 'growth' | 'maintenance' | 'daily_maintenance';
  priority: number; // For sorting if needed, though strictly we just push/pop
  rss_url: string;
}

interface DistributionQueue {
  generated_at: string;
  queue: QueueItem[];
}

// --- Helpers ---

// Simple string hash for deterministic day selection
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function toTitleCase(str: string): string {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// --- Main ---

async function main() {
  logger.info("🌙 Night Watchman: Starting midnight schedule run...");

  try {
    // 1. Discover Collections
    // We look for directories in content/animals/
    // glob doesn't support only directories easily in v7/8 without config, but we can list * and check stat
    const items = fs.readdirSync(CONTENT_ROOT);
    const collections = items.filter(item => {
      const fullPath = path.join(CONTENT_ROOT, item);
      return fs.statSync(fullPath).isDirectory() && item !== '.DS_Store'; // Basic filter
    });

    logger.info(`Found ${collections.length} collections.`);

    const queue: QueueItem[] = [];
    const today = new Date();
    const dayOfYear = getDayOfYear(today);

    for (const collection of collections) {
        // 2. Count Content
        // We use listContent from lib, but we need to list ALL for counts, not just non-drafts?
        // PRD: "Maintenance Rule: If posts >= 75"
        // Usually we count published posts.
        const posts = listContent('animals', collection, false); // draftOnly=false (published)
        const count = posts.length;

        // 3. Determine Mode & Schedule
        const boardName = `${toTitleCase(collection)} Coloring Pages`;
        const rssUrl = `https://paperpause.app/animals/${collection}/index.xml`;
        
        let shouldSchedule = false;
        let mode: QueueItem['mode'] = 'growth';

        if (count < 75) {
            // Growth: Schedule Daily
            mode = 'growth';
            shouldSchedule = true;
        } else {
            // Maintenance: Schedule Weekly
            // Rule: DayOfYear % 7 == CollectionHash % 7
            // This spreads maintenance collections evenly across the week
            const hash = simpleHash(collection);
            const targetDay = hash % 7;
            const currentDay = dayOfYear % 7; // 0-6
            
            // Note: This matches "Day of Year" modulo, not "Day of Week" (Sunday/Monday). 
            // This ensures rotation even if week boundaries shift, but effectively it's a 7-day cycle.
            if (targetDay === currentDay) {
                mode = 'maintenance';
                shouldSchedule = true;
            }
        }

        if (shouldSchedule) {
            logger.info(`[${collection}] count=${count} mode=${mode} -> Scheduled`);
            queue.push({
                collection,
                board_name: boardName,
                mode,
                priority: mode === 'growth' ? 10 : 5, // Growth gets priority if we sort, but simple queue is fine
                rss_url: rssUrl
            });
        } else {
            logger.debug(`[${collection}] count=${count} mode=maintenance -> Skipped (Not today)`);
        }
    }

    // 4. Sort Queue?
    // PRD doesn't strict specify order, but mixing valid items is good.
    // "Calculates the daily 'Flight Plan'... and manages the queue."
    // Let's sort by Priority then Name for deterministic output
    queue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority; // Higher priority first
        return a.collection.localeCompare(b.collection);
    });

    // 5. Write Queue
    const output: DistributionQueue = {
        generated_at: new Date().toISOString(),
        queue
    };

    await fs.ensureDir(path.dirname(QUEUE_FILE));
    await fs.writeJson(QUEUE_FILE, output, { spaces: 2 });
    
    logger.success(`Queue generated with ${queue.length} items. Written to ${QUEUE_FILE}`);

  } catch (error) {
    logger.error("Night Watchman failed", error as Error);
    process.exit(1);
  }
}

main();
