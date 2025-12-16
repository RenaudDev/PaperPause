import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { logger } from '../lib/logger';
import { ENV } from '../config/env';

/**
 * Publish all draft coloring pages by setting draft: false
 * This script finds all .md files with draft: true and updates them to draft: false
 */
async function publishDrafts() {
  const contentDir = ENV.PATHS.CONTENT_DIR;
  const animalsDir = path.join(contentDir, 'animals');

  if (!fs.existsSync(animalsDir)) {
    logger.error('Animals directory not found', new Error(`Path: ${animalsDir}`));
    process.exit(1);
  }

  logger.info('Searching for draft coloring pages...');

  let publishedCount = 0;
  const collections = ['cats', 'Dogs', 'Horses', 'Butterflies'];

  for (const collection of collections) {
    const collectionDir = path.join(animalsDir, collection);

    if (!fs.existsSync(collectionDir)) {
      logger.warn(`Collection directory not found: ${collection}`);
      continue;
    }

    // Get all .md files except _index.md
    const files = fs.readdirSync(collectionDir).filter(f => f.endsWith('.md') && f !== '_index.md');

    for (const file of files) {
      const filePath = path.join(collectionDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(content);

      // Check if it's a draft
      if (parsed.data.draft === true) {
        // Update draft to false
        parsed.data.draft = false;

        // Reconstruct the file
        const updatedContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(filePath, updatedContent);

        logger.success(`Published: ${collection}/${file}`);
        publishedCount++;
      }
    }
  }

  logger.info(`Publishing complete: ${publishedCount} pages published`);
}

// Run the script
if (require.main === module) {
  publishDrafts()
    .then(() => {
      logger.success('All drafts published successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Failed to publish drafts', error);
      process.exit(1);
    });
}

export { publishDrafts };

