
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
  scheduled_at?: string; // ISO timestamp
}

interface DistributionQueue {
  generated_at: string;
  queue: QueueItem[];
}

// --- Helpers ---

function toTitleCase(str: string): string {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


// --- Main ---

async function main() {
  logger.info("🌙 Night Watchman: Starting midnight schedule run...");

  const args = process.argv.slice(2);
  const fromManifests = args.includes('--from-manifests');

  try {
    let collectionsToSchedule: QueueItem[] = [];

    if (fromManifests) {
      // MODE A: Success-Gated Scheduling (from Daily Workflow)
      // Only schedule collections that successfully generated content TODAY
      logger.info('📚 Mode: Success-Gated (Manifests)');
      
      const runsDir = path.resolve(__dirname, '../../.runs');
      if (fs.existsSync(runsDir)) {
         // Look for manifests specific to this run batch (heuristic: created in last 2 hours)
         // OR just process all json files since the workflow cleans up/downloads fresh artifacts
         // The workflow uses download-artifact which overwrites.
         const files = glob.sync(`${runsDir}/*.json`);
         
         for (const file of files) {
            try {
              const manifest = await fs.readJson(file);
              // Validation: Must have created content
              if (manifest.created && manifest.created.length > 0) {
                 logger.info(`✅ Found success manifest: ${manifest.collection}`);
                 
                 // Calculate details
                 const collection = manifest.collection;
                 const boardName = `${toTitleCase(collection)} Coloring Pages`;
                 const rssUrl = `https://paperpause.app/animals/${collection}/index.xml`;
                 
                 collectionsToSchedule.push({
                   collection,
                   board_name: boardName,
                   mode: 'growth', // Generated today = growth/active
                   priority: 10,
                   rss_url: rssUrl
                 });
              } else {
                logger.warn(`⚠️ Skipping empty manifest: ${path.basename(file)}`);
              }
            } catch (err) {
              logger.warn(`Failed to parse manifest ${file}`, err);
            }
         }
      } else {
        logger.warn("No .runs directory found. Queue will be empty.");
      }

    } else {
      // MODE B: Full Audit (Legacy/Midnight Cron)
      // Scans file system, applies growth/maintenance logic
      logger.info('🔍 Mode: Full System Audit');
      
      const items = fs.readdirSync(CONTENT_ROOT);
      const collections = items.filter(item => {
        const fullPath = path.join(CONTENT_ROOT, item);
        return fs.statSync(fullPath).isDirectory() && item !== '.DS_Store';
      });

      // Separate growth vs maintenance collections
      const growthCollections: { collection: string; count: number }[] = [];
      const maintenanceCollections: { collection: string; count: number }[] = [];

      for (const collection of collections) {
        const posts = listContent('animals', collection, false);
        const count = posts.length;
        
        if (count < 75) {
          growthCollections.push({ collection, count });
        } else {
          maintenanceCollections.push({ collection, count });
        }
      }

      logger.info(`Found ${growthCollections.length} growth collections, ${maintenanceCollections.length} maintenance collections.`);

      // Schedule ALL growth collections (daily)
      for (const { collection, count } of growthCollections) {
        const boardName = `${toTitleCase(collection)} Coloring Pages`;
        const rssUrl = `https://paperpause.app/animals/${collection}/index.xml`;
        
        collectionsToSchedule.push({
          collection,
          board_name: boardName,
          mode: 'growth',
          priority: 10,
          rss_url: rssUrl
        });
        logger.info(`[${collection}] count=${count} mode=growth -> Scheduled`);
      }

      // Schedule maintenance collections using ROUND-ROBIN (balanced weekly distribution)
      // Sort alphabetically for determinism
      maintenanceCollections.sort((a, b) => a.collection.localeCompare(b.collection));
      const currentDayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      maintenanceCollections.forEach(({ collection, count }, index) => {
        const assignedDay = index % 7;
        
        if (assignedDay === currentDayOfWeek) {
          const boardName = `${toTitleCase(collection)} Coloring Pages`;
          const rssUrl = `https://paperpause.app/animals/${collection}/index.xml`;
          
          collectionsToSchedule.push({
            collection,
            board_name: boardName,
            mode: 'maintenance',
            priority: 5,
            rss_url: rssUrl
          });
          logger.info(`[${collection}] count=${count} mode=maintenance (day ${assignedDay}) -> Scheduled`);
        } else {
          logger.debug(`[${collection}] count=${count} mode=maintenance (day ${assignedDay}) -> Skipped (today is day ${currentDayOfWeek})`);
        }
      });
    }

    logger.info(`Selected ${collectionsToSchedule.length} collections for distribution.`);

    // --- Time Slot Assignment (Randomized) ---
    // Window: 06:00 UTC (1 AM ET) to 21:00 UTC (4 PM ET)
    // 15 hour window = 60 * 15 = 900 minutes / 15 min slots = 60 slots
    const queue: QueueItem[] = [];
    const START_HOUR = 6; 
    const END_HOUR = 21;
    
    // Generate available slots (every 15 mins)
    let slots: Date[] = [];
    const baseDate = new Date();
    baseDate.setUTCHours(0, 0, 0, 0); // Start of today UTC

    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let m = 0; m < 60; m += 15) {
        const slot = new Date(baseDate);
        slot.setUTCHours(h, m, 0, 0);
        slots.push(slot);
      }
    }

    // Shuffle slots Fisher-Yates style
    for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    // Assign slots to collections
    collectionsToSchedule.forEach((item, index) => {
       if (index < slots.length) {
         item.scheduled_at = slots[index].toISOString();
         queue.push(item);
         logger.info(`📅 Scheduled ${item.collection} at ${slots[index].toISOString()} (${item.mode})`);
       } else {
         // Overflow fallback (should be rare with 60 slots)
         logger.warn(`⚠️ No slots left for ${item.collection}, skipping.`);
       }
    });

    // Write Queue
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
