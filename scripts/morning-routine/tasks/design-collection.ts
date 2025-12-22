import fs from 'fs-extra';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import matter from 'gray-matter';
import { logger } from '../lib/logger';
import { ENV } from '../config/env';
import { FLAGS } from '../config/flags';
import { withRetry } from '../lib/retry';
import { getAllStyleNames } from '../config/styles';

/**
 * Designer: Auto-Genesis Task
 * 
 * Scaffolds new collections (directory, _index.md, prompt config)
 * using gemini-3-flash-preview (MEDIUM thinking).
 */

const CONTENT_PATH = path.resolve(__dirname, '../../../content');
const PROMPTS_DIR = path.resolve(__dirname, '../config/prompts');
const LOG_DIR = path.resolve(__dirname, '../../../mission-control/logs');

interface GenesisConfig {
  title: string;
  h1: string;
  basePrompt: string;
  tones: string[];
  types: string[];
  actions: string[];
  settings: string[];
  details: string[];
  styles: string[];
}

/**
 * Ask Gemini (with deep thinking) to design a new coloring page collection.
 * Generates category-aware attributes for prompt variation.
 */
async function brainstormCollection(category: string, collection: string): Promise<GenesisConfig> {
  return withRetry(async () => {
    logger.info(`Designer brainstorming collection: ${category}/${collection}...`);

    const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview'
      // Note: Thinking level will be enabled via generationConfig if SDK supports it
    });

    const globalStyleNames = getAllStyleNames();
    const styleList = globalStyleNames.join(', ');

    const prompt = `
You are the PaperPause Lead Designer with deep expertise in coloring page aesthetics.
Your job is to scaffold a new collection with thoughtful, category-appropriate attributes for prompt variation.

CATEGORY: ${category}
COLLECTION: ${collection}

CRITICAL QUALITY STANDARDS (Aligned with Art Critic):
1. NO TEXT: Generations must never contain letters, words, numbers, or signatures.
2. NO GRAYSCALE: No shading, gradients, or gray fills. 1-bit monochrome only.
3. CLOSED PATHS: Lines must form fully enclosed shapes for easy coloring.
4. HIGH OCCUPANCY: The subject must fill at least 80% of the canvas.
5. VECTOR STYLE: Thick, consistent, black outlines on white background.

YOUR JOB:

1. **Title & H1**: A human-friendly name and heading for this collection.

2. **Base Prompt**: A foundational text that describes the subject and composition.
   - Do NOT use technical requirement lists (these are handled at the system level).
   - FOCUS on: "Vector line art coloring page of a [Subject]. Subject filling the page (80% occupancy). Pure black outlines, no shading, no text."

3. **Tones** (emotional vibe): 8-12 adjectives that meaningfully vary the mood.
   - Examples: "Cozy", "Playful", "Zen", "Adventurous".

4. **Types** (core subjects): 10-15 noun phrases for the main subject variants.
   - Be specific and visually distinct within the collection.

5. **Actions** (on-theme activities): 8-12 plausible activities that don't create micro-detail overload.

6. **Settings** (on-theme contexts): 8-12 background locations that keep high colorability.
   - Favor simple, colorable backgrounds. Avoid cluttered scenery.

7. **Details** (optional small add-ons): 5-8 minor embellishments (e.g., "wearing a scarf").

8. **Styles**: Select 3-5 from: ${styleList}

Return strict JSON:
{
  "title": "string",
  "h1": "string",
  "basePrompt": "string (optimized for Art Critic pass rate)",
  "tones": ["string", ...],
  "types": ["string", ...],
  "actions": ["string", ...],
  "settings": ["string", ...],
  "details": ["string", ...],
  "styles": ["string", ...]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON (handle potential markdown cladding)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from Designer response");
    
    const parsed = JSON.parse(jsonMatch[0]) as GenesisConfig;
    
    // Validate styles: keep only those in the global list
    const validatedStyles = parsed.styles.filter(s => 
      globalStyleNames.some(gs => gs.toLowerCase() === s.toLowerCase())
    );
    
    if (validatedStyles.length === 0) {
      logger.warn(`Designer selected no valid styles for ${category}/${collection}; using defaults: ["Kawaii", "Cottagecore"]`);
      parsed.styles = ['Kawaii', 'Cottagecore'];
    } else {
      parsed.styles = validatedStyles;
    }
    
    return parsed;
  });
}

async function run() {
  const runId = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
  const isDryRun = FLAGS.DESIGNER_DRY_RUN;
  
  // Read matrix from stdin or arg (Foreman output; includes production + dry-run collections)
  const input = process.argv[2];
  if (!input) {
    logger.warn('No matrix input provided to Designer. Exiting.');
    return;
  }

  let designerMatrix: string[] = [];
  try {
    designerMatrix = JSON.parse(input);
  } catch (e) {
    logger.warn('Could not parse designer matrix JSON; assuming empty list.');
    designerMatrix = [];
  }

  const reportLines: string[] = [
    `# Designer Scaffolding Report: ${new Date().toISOString()}`,
    `Dry Run Mode: **${isDryRun}**`,
    '',
    '| Collection | Matrix Type | Dir | Prompt | Action |',
    '|---|---|---|---|---|'
  ];

  for (const collPath of designerMatrix) {
    const [category, collection] = collPath.split('/');
    const collDir = path.join(CONTENT_PATH, category, collection);
    const promptPath = path.join(PROMPTS_DIR, `${category}-${collection}.json`);
    
    let dirExistsBefore = fs.existsSync(collDir);
    let promptExistsBefore = fs.existsSync(promptPath);
    const needsScaffolding = !dirExistsBefore || !promptExistsBefore;

    let action = 'None (Exists)';
    let matrixType = 'production';
    
    if (needsScaffolding) {
      if (isDryRun) {
        action = 'WOULD Scaffold';
      } else {
        try {
          const genesis = await brainstormCollection(category, collection);
          
          // Create Directory
          if (!dirExistsBefore) {
            fs.ensureDirSync(collDir);
            const indexContent = matter.stringify('', {
              title: genesis.title,
              h1: genesis.h1,
              cms_enabled: true,
              cms_batch_size: 1,
              draft: true
            });
            fs.writeFileSync(path.join(collDir, '_index.md'), indexContent);
          }

          // Create Prompt Config
          if (!promptExistsBefore) {
            fs.ensureDirSync(PROMPTS_DIR);
            const promptConfig = {
              collection,
              category,
              base: genesis.basePrompt,
              negative_prompt: "text, letters, words, numbers, signature, watermark, logo, name, gray, shading, gradient, realistic, photorealistic, 3d, rendering, photo, blurry, broken lines, thin lines, sketch, messy, horizontal, landscape, colored, transparent, background patterns, complex shading",
              attributes: {
                tones: genesis.tones,
                types: genesis.types,
                actions: genesis.actions,
                settings: genesis.settings,
                details: genesis.details,
                styles: genesis.styles
              }
            };
            fs.writeFileSync(promptPath, JSON.stringify(promptConfig, null, 2));
          }
          
          action = 'Scaffolded ✅';
        } catch (err) {
          action = `FAILED: ${(err as Error).message}`;
          logger.error(`Designer failed for ${collPath}`, err as Error);
        }
      }
    }

    // Recompute status after write-mode actions
    const dirExistsAfter = fs.existsSync(collDir);
    const promptExistsAfter = fs.existsSync(promptPath);

    reportLines.push(
      `| ${collPath} | ${matrixType} | ${dirExistsAfter ? '✅' : '❌'} | ${promptExistsAfter ? '✅' : '❌'} | ${action} |`
    );
  }

  // Log Report
  fs.ensureDirSync(LOG_DIR);
  fs.writeFileSync(path.join(LOG_DIR, `designer-${runId}.md`), reportLines.join('\n'));
  
  logger.success(`Designer task complete. Processed ${designerMatrix.length} collections.`);
}

run().catch(err => {
  logger.error('Designer fatal error', err);
  process.exit(1);
});
