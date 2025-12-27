import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env';
import { logger } from './logger';
import { withRetry } from './retry';

/**
 * Text optimized Gemini client for long-form content generation.
 * Uses gemini-3-flash-preview for high speed and large context window.
 */

export const generateText = async (
    prompt: string, 
    options: { temperature?: number, systemInstruction?: string } = {}
): Promise<string> => {
    const { temperature = 0.7, systemInstruction } = options;

    return withRetry(
        async () => {
            logger.info(`Generating text with Gemini 3 Flash Preview...`);

            const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-3-flash-preview',
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: temperature,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (!text) {
                throw new Error('Emply response from Gemini');
            }

            logger.success('Text generated successfully', { length: text.length });
            return text;
        },
        {
            retries: 3,
            delay: 2000,
            backoff: 2,
            onRetry: (attempt, error) => {
                logger.warn(`Gemini text generation attempt ${attempt} failed, retrying...`, {
                    error: error.message
                });
            }
        }
    );
};

/**
 * Generates a section of an article with context from previous sections.
 */
export const generateSection = async (
    sectionTitle: string,
    contentFocus: string,
    targetWordCount: number,
    context: { 
        collectionName: string, 
        previousSectionSummary?: string,
        visualStyles?: string[]
    }
): Promise<string> => {
    const systemPrompt = `You are a content writer for PaperPause, a premium destination for high-quality coloring pages.
Your tone is encouraging, authoritative, and deeply knowledgeable about art supplies and mental health benefits of coloring.
IMPORTANT: Always write in first-person plural ("we", "At PaperPause, we..."). Never use "I" or phrases like "As your master coach".`;

    const prompt = `
[CONTEXT]
Collection: ${context.collectionName}
Previous Section Summary: ${context.previousSectionSummary || 'This is the first section.'}
Visual Styles detected in collection: ${context.visualStyles?.join(', ') || 'N/A'}

[TASK]
Write the section titled: "${sectionTitle}".
Primary Focus: ${contentFocus}
Target Word Count: ${targetWordCount} words.

[RULES]
1. Use first-person plural voice: "we", "At PaperPause, we...". NEVER use "I" or "As your master coach".
2. **HEADING RULES**:
   *   Start each section with a clean \`## Heading\`. 
   *   DO NOT include section numbers (e.g., NO "1. The Hook").
   *   DO NOT include internal section labels (e.g., NO "The Hook:", NO "Visual Breakdown:").
   *   Example Good: \`## The Ancient Bond Between Dogs and Artists\`.
   *   Example Bad: \`## 1. The Hook: Honoring the Soul...\`.
3. Be specific about tools: mention premium brands (Prismacolor, Faber-Castell) and techniques (burnishing, scumbling).
4. **STYLE SHORTCODES**: Use the exact syntax provided in [CONTEXT]. DO NOT hallucinate.
5. **FAQ SHORTCODES**: If writing Section 7, you MUST use this EXACT syntax:
    {{< faq question="Your specific question here?" >}}
    Your detailed expert answer here.
    {{< /faq >}}
6. Provide deep value: don't just state facts, explain *why* something works for the artist.
7. NO generic fluff. Every sentence must provide insight or emotional connection.

[OUTPUT]
Return only the Markdown content for this section.
`;

    return generateText(prompt, { 
        temperature: 0.7, 
        systemInstruction: systemPrompt 
    });
};
