
import fs from 'fs-extra';
import path from 'path';
import { ENV } from '../config/env';
import { logger } from '../lib/logger';

// --- Configuration ---
const QUEUE_FILE = path.resolve(__dirname, '../../../config/distribution-queue.json');

// --- Types ---
interface QueueItem {
  collection: string;
  board_name: string;
  mode: 'growth' | 'maintenance' | 'daily_maintenance';
  priority: number;
  rss_url: string;
  scheduled_at?: string;
}

interface DistributionQueue {
  generated_at: string;
  queue: QueueItem[];
}

// --- Main ---

async function main() {
  logger.info("🚂 Distribution Conductor: Starting run...");

  try {
    // 1. Check/Load Queue
    if (!fs.existsSync(QUEUE_FILE)) {
      logger.warn(`Queue file not found at ${QUEUE_FILE}. Exiting.`);
      return; 
    }

    const data: DistributionQueue = await fs.readJson(QUEUE_FILE);
    let queue = data.queue;

    if (!queue || queue.length === 0) {
      logger.info("Queue is empty. Nothing to distribute.");
      return;
    }

    // 2. Validate Env
    if (!ENV.MAKE_WEBHOOK || !ENV.MAKE_WEBHOOK_API) {
        throw new Error("Missing MAKE_WEBHOOK or MAKE_WEBHOOK_API in environment.");
    }

    // 3. Find Due Items
    const now = new Date();
    const dueItems: { item: QueueItem, index: number }[] = [];

    queue.forEach((item, index) => {
        if (!item.scheduled_at) {
            // Legacy items (no time) -> Process immediately
            dueItems.push({ item, index });
        } else {
            const scheduledTime = new Date(item.scheduled_at);
            if (scheduledTime <= now) {
                // Time has passed -> Due
                dueItems.push({ item, index });
            }
        }
    });

    if (dueItems.length === 0) {
        logger.info(`No items due for distribution. (Next item scheduled at: ${queue[0].scheduled_at || 'unknown'})`);
        return;
    }

    logger.info(`Found ${dueItems.length} due items.`);

    // 4. Fire Webhooks (Process ALL due items)
    const successfulIndices: number[] = [];

    for (const { item, index } of dueItems) {
        try {
            logger.info(`Processing item: ${item.collection} (${item.board_name})`, { scheduled_at: item.scheduled_at });

            const payload = {
                collection: item.collection,
                board_name: item.board_name,
                rss_url: item.rss_url
            };
        
            logger.debug("Firing webhook...", payload);
        
            const response = await fetch(ENV.MAKE_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-make-apikey': ENV.MAKE_WEBHOOK_API
                },
                body: JSON.stringify(payload)
            });
        
            if (!response.ok) {
                const errorText = await response.text();
                // We log error but CONTINUE so one failure doesn't block others
                logger.error(`Webhook failed for ${item.collection}: ${response.status} ${response.statusText} - ${errorText}`);
            } else {
                logger.success(`Webhook fired successfully for ${item.collection}.`);
                successfulIndices.push(index);
            }
        } catch (err) {
            logger.error(`Failed to process ${item.collection}`, err as Error);
        }
    }

    // 5. Update Queue (Remove successful items)
    // Filter out items whose indices are in successfulIndices
    if (successfulIndices.length > 0) {
        const newQueue = queue.filter((_, idx) => !successfulIndices.includes(idx));
        data.queue = newQueue;

        // 6. Save Queue
        await fs.writeJson(QUEUE_FILE, data, { spaces: 2 });
        logger.success(`Queue updated. Removed ${successfulIndices.length} items. Remaining: ${newQueue.length}`);
    } else {
        logger.warn("No items were successfully processed. Queue unchanged.");
    }

  } catch (error) {
    logger.error("Distribution Conductor failed", error as Error);
    process.exit(1); 
  }
}

main();
