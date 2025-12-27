import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { logger } from '../lib/logger';
import { scanCategories, scanCollections, updateIndexFile } from '../lib/hugo-manager';
import { generateSection } from '../lib/gemini-text';

import { refineArticle } from './refine-content-seo';

const CONTENT_DIR = path.resolve(__dirname, '../../../content');

interface StyleInfo {
    style: string;
    cf_image_id: string;
    title: string;
    filePath: string; // Path relative to content/
}

/**
 * Main Orchestrator for the Content Sweeper.
 */
async function runContentSweep() {
    logger.info('🚀 Starting Content Sweeper...');

    const targetCollection = process.env.TARGET_COLLECTION;
    const categories = scanCategories();
    let totalProcessed = 0;

    for (const category of categories) {
        const collections = scanCollections(category.name);
        
        for (const collection of collections) {
            if (targetCollection && collection.name !== targetCollection) continue;
            
            const indexPath = path.join(collection.path, '_index.md');
            const content = fs.readFileSync(indexPath, 'utf8');
            const { data, content: body } = matter(content);
            
            const wordCount = body.trim().split(/\s+/).length;
            const isGenerated = data.content_generated === true;

            // GATE: Process if < 2000 words OR not marked as generated
            if (wordCount < 2000 || !isGenerated) {
                logger.info(`📝 Enriching collection: ${category.name}/${collection.name} (${wordCount} words)`);
                
                try {
                    await processCollection(category.name, collection.name, collection.path, data);
                    totalProcessed++;
                } catch (error) {
                    logger.error(`❌ Failed to process ${collection.name}:`, error as Error);
                }
            } else {
                logger.info(`✅ Skipping ${collection.name} (already deep content: ${wordCount} words)`);
            }
        }
    }

    logger.success(`🏁 Content Sweep complete. Processed ${totalProcessed} collections.`);
}

/**
 * Per-collection processing logic.
 */
async function processCollection(category: string, name: string, collectionPath: string, metadata: any) {
    // 1. Visual Audit
    const styles = await getStyleMap(category, name, collectionPath);
    const styleNames = Object.keys(styles);

    // Create a "Reference Library" for the LLM to pick from
    const showcaseMenu = styleNames.map(style => {
        const item = styles[style];
        return `- Style: ${style} | File: ${item.filePath} | Title: ${item.title}`;
    }).join('\n');

    const showcaseCommands = styleNames.map(style => {
        const item = styles[style];
        return `{{< style-showcase file="${item.filePath}" title="${item.title}" description="Brief analysis of ${style} style..." >}}`;
    }).join('\n');

    // 2. Deterministic Outline
    const outline = [
        { title: "1. The Hook (Intro)", focus: "Emotional connection, history of the subject, who this is for. DO NOT use style-showcase here.", words: 250 },
        { title: "2. Visual Breakdown", focus: "Analyze the specific styles found in the collection. You MUST use style-showcases here for EVERY style provided.", words: 300 },
        { title: "3. Tools of the Trade", focus: "Specific recommendations: Wax vs. Oil pencils, Alcohol markers. Use 1-2 style-showcases as examples.", words: 400 },
        { title: "4. Techniques Deep Dive", focus: "Shading, blending, color theory. Use 1-2 style-showcases as examples.", words: 500 },
        { title: "5. The Paper Pause", focus: "Mental health benefits, mindfulness. Use 1 style-showcase as a focal point.", words: 250 },
        { title: "6. Paper & Printing", focus: "GSM recommendations, texture, printer settings. No style-showcase needed.", words: 200 },
        { title: "7. Expert FAQs", focus: "3-5 Schema-ready questions wrapped in {{< faq >}} shortcodes.", words: 150 }
    ];

    let fullContent = "";
    let previousSummary = "";

    for (const section of outline) {
        logger.info(`   - Generating: ${section.title}...`);
        
        let extraFocus = section.focus;
        
        // Only provide the full image library to the Visual Breakdown section
        // For others, we provide a "No images" rule unless specified
        if (section.title.includes("Visual Breakdown")) {
            extraFocus += `\n\n[VALID STYLE SHOWCASES]\nAvailable Library:\n${showcaseMenu}\n\nCRITICAL: You MUST use the EXACT file path from the library above for EVERY style mentioned.`;
        } else if (section.title.includes("Tools") || section.title.includes("Techniques")) {
            // Provide a limited selection for examples (just the first 2)
            const limitedMenu = styleNames.slice(0, 2).map(style => {
                const item = styles[style];
                return `- Style: ${style} | File: ${item.filePath} | Title: ${item.title}`;
            }).join('\n');
            extraFocus += `\n\n[VALID STYLE SHOWCASES - OPTIONAL EXAMPLES]\n${limitedMenu}\n\nUse at most ONE style-showcase as a specific example if it enhances the text.`;
        } else {
            extraFocus += `\n\nCRITICAL: DO NOT use any {{< style-showcase >}} shortcodes in this section.`;
        }

        const sectionContent = await generateSection(
            section.title,
            extraFocus,
            section.words,
            {
                collectionName: metadata.title || name,
                previousSectionSummary: previousSummary,
                visualStyles: styleNames
            }
        );

        fullContent += sectionContent + "\n\n";
        previousSummary = sectionContent.split('\n').filter(l => l.length > 0).slice(0, 3).join(' ');
    }

    // 3. SEO & QA Refinement Pass
    const collectionFullName = metadata.title || name;
    const refinedContent = await refineArticle(fullContent, collectionFullName);

    // 4. Assembly & Save
    const finalMetadata = {
        ...metadata,
        content_generated: true,
        last_swept: new Date().toISOString()
    };

    const indexPath = path.join(collectionPath, '_index.md');
    const newFileContent = matter.stringify('\n' + refinedContent.trim(), finalMetadata);
    fs.writeFileSync(indexPath, newFileContent, 'utf8');

    logger.success(`✨ Successfully updated ${name}`);
}

/**
 * Scans a collection folder for sibling markdown files and groups them by style.
 */
async function getStyleMap(category: string, collectionName: string, collectionPath: string): Promise<Record<string, StyleInfo>> {
    const items = fs.readdirSync(collectionPath);
    const styles: Record<string, StyleInfo> = {};

    for (const item of items) {
        if (item === '_index.md' || !item.endsWith('.md')) continue;
        
        const content = fs.readFileSync(path.join(collectionPath, item), 'utf8');
        const { data } = matter(content);
        
        if (data.cf_image_id && data.style) {
            if (!styles[data.style]) {
                styles[data.style] = {
                    style: data.style,
                    cf_image_id: data.cf_image_id,
                    title: data.title || "Coloring Page",
                    filePath: `${category}/${collectionName}/${item.replace('.md', '')}`
                };
            }
        }
    }

    return styles;
}

// Execute
if (require.main === module) {
    runContentSweep().catch(err => {
        logger.error('CRITICAL ERROR:', err);
        process.exit(1);
    });
}
