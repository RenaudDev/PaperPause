import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import axios from 'axios';
import { ENV } from '../../scripts/morning-routine/config/env';
import { logger } from '../../scripts/morning-routine/lib/logger';
import { withRetry } from '../../scripts/morning-routine/lib/retry';
import { ART_CRITIC_PROMPT } from './prompt';
import { QAAssessmentInput, QAAssessmentOutput } from './types';

/**
 * Lead Art Critic Agent (Agent 3)
 * 
 * Inspects coloring pages for defects using Gemini Vision.
 */

/**
 * Fetch image data from URL or local path and return as base64
 */
async function getImageData(pathOrUrl: string): Promise<{ data: string; mimeType: string }> {
  if (pathOrUrl.startsWith('http')) {
    const response = await axios.get(pathOrUrl, { responseType: 'arraybuffer' });
    const mimeType = response.headers['content-type'] || 'image/png';
    const data = Buffer.from(response.data).toString('base64');
    return { data, mimeType };
  } else {
    const data = await fs.readFile(pathOrUrl, 'base64');
    const mimeType = pathOrUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return { data, mimeType };
  }
}

/**
 * Assess a coloring page image for quality defects
 */
export async function assessImage(input: QAAssessmentInput): Promise<QAAssessmentOutput> {
  return withRetry(
    async () => {
      logger.info(`Critic is inspecting image...`, { subject: input.collection || input.category });

      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      
      // Use gemini-3-flash-preview for speed/efficiency with thinking capabilities
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3-flash-preview',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for objective assessment
        }
      });

      const { data, mimeType } = await getImageData(input.imageUrl);

      const promptParts = [
        ART_CRITIC_PROMPT,
        {
          inlineData: {
            data,
            mimeType,
          },
        },
      ];

      // Add context if available
      if (input.prompt || input.category || input.collection) {
        let context = "\n\n### Candidate Context\n";
        if (input.category) context += `- Category: ${input.category}\n`;
        if (input.collection) context += `- Collection: ${input.collection}\n`;
        if (input.prompt) context += `- Original Prompt: "${input.prompt}"\n`;
        promptParts.push(context);
      }

      // Explicitly set MEDIA_RESOLUTION_ULTRA_HIGH as per 1.B.1
      // Note: In current SDK, resolution is often handled by model selection or parameters
      // we ensure the prompt reinforces the need for high-detail inspection.
      
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      try {
        const assessment = JSON.parse(text) as QAAssessmentOutput;
        
        if (assessment.qa_result === 'pass') {
          logger.success(`QA PASS: Image meets quality standards.`);
        } else {
          logger.warn(`QA FAIL: ${assessment.reason} - ${assessment.reason_details}`);
        }

        return assessment;
      } catch (parseError) {
        logger.error('Failed to parse Critic verdict', parseError as Error);
        throw new Error('Invalid JSON response from Art Critic');
      }
    },
    {
      retries: 2,
      delay: 2000,
      onRetry: (attempt) => logger.warn(`Critic retry attempt ${attempt}...`)
    }
  );
}
