import { generateText } from '../lib/gemini-text';
import { logger } from '../lib/logger';

/**
 * SEO Refiner Agent
 * Performs a post-processing pass on generated content to optimize for:
 * 1. Semantic density (LSI keywords)
 * 2. Proper heading hierarchy
 * 3. Elimination of hallucinations (like rogue shortcodes)
 * 4. First-person plural voice consistency ("we", "At PaperPause, we...")
 */
export async function refineArticle(content: string, collectionName: string): Promise<string> {
    logger.info(`🔍 Refining content for ${collectionName}...`);

    const systemPrompt = `You are a content editor and SEO Specialist for PaperPause.
Your job is to take a long-form article about coloring and refine it into a masterpiece.
You must ensure the tone is encouraging (first-person plural: "we", "At PaperPause, we..."), the SEO is semantically dense, and the formatting is flawless.`;

    const prompt = `
[TASK]
Refine the following article for the "${collectionName}" coloring collection.

[OBJECTIVES]
1.  **LSI Injection**: Inject semantic keywords naturally (e.g., "color therapy", "fine motor skills", "lightfastness", "pigment load", "tooth of the paper", "Prismacolor", "Faber-Castell").
2.  **Heading Cleanup**: 
    *   Ensure all H2 headings are clean and compelling.
    *   REMOVE all section numbers (e.g. "1. ", "2. ") and internal identifiers ("The Hook:", "Visual Breakdown:", etc.).
3.  **Shortcode Audit**: 
    *   Ensure only ONE style-showcase per specific style is used in the entire article.
    *   If a style-showcase appears twice for the same image, REMOVE the redundant ones.
    *   Ensure all {{< style-showcase >}} and {{< faq >}} shortcodes are correctly formatted.
    *   Check for hallucinated file paths and remove them if they don't look like "category/collection/filename".
4.  **Tone & Flow**: Enforce first-person plural ("we"). REPLACE any "I" or "As your master coach" with "we" or "At PaperPause, we...". Remove repetitive section-start greetings.

[ARTICLE CONTENT]
${content}

[OUTPUT]
Return only the refined Markdown content. DO NOT include any preamble or meta-talk.
`;

    const refinedContent = await generateText(prompt, { 
        temperature: 0.3, // Lower temperature for structural precision
        systemInstruction: systemPrompt 
    });

    return refinedContent;
}
