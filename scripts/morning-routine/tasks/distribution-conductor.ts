
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
    const queue = data.queue;

    if (!queue || queue.length === 0) {
      logger.info("Queue is empty. Nothing to distribute.");
      return;
    }

    // 2. Validate Env
    if (!ENV.MAKE_WEBHOOK || !ENV.MAKE_WEBHOOK_API) {
        throw new Error("Missing MAKE_WEBHOOK or MAKE_WEBHOOK_API in environment.");
    }

    // 3. Pop Item (Peek first)
    // We don't remove it yet. We peek, fire, then shift & save.
    const item = queue[0];
    logger.info(`Processing item: ${item.collection} (${item.board_name})`);

    // 4. Fire Webhook
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
        throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    logger.success("Webhook fired successfully.");

    // 5. Update Queue (Shift)
    queue.shift(); // Remove the processed item
    data.queue = queue; // Update reference

    // 6. Save Queue
    await fs.writeJson(QUEUE_FILE, data, { spaces: 2 });
    logger.success("Queue updated and saved.");

  } catch (error) {
    logger.error("Distribution Conductor failed", error as Error);
    process.exit(1); // Exit with error so Workflow knows to fail (and NOT commit if we set it up that way)
  }
}

main();
