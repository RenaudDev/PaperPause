/**
 * Image Processor
 * 
 * Provides post-processing utilities for generated images.
 * Ensures consistent quality and formatting before upload.
 */

import sharp from 'sharp';
import { logger } from './logger';

/**
 * Margin Configuration
 * 
 * MARGIN_PERCENT: The percentage of the smaller dimension to use as margin.
 * For a 1536x2048 image with 5% margin:
 *   - Margin = 1536 * 0.05 = ~77px on each side
 *   - Inner content area = 1382 x 1894
 */
const MARGIN_PERCENT = 0.05; // 5% margin on each side

/**
 * Add safe margins to an image by resizing and centering on a white canvas.
 * 
 * This guarantees consistent white borders around all generated content,
 * regardless of what the AI draws. The image is scaled down proportionally
 * and centered on a canvas of the original dimensions.
 * 
 * @param imageBuffer - The raw image buffer from generation
 * @returns A new buffer with the image centered on a white canvas with margins
 */
export async function addSafeMargins(imageBuffer: Buffer): Promise<Buffer> {
    try {
        // Get original dimensions
        const metadata = await sharp(imageBuffer).metadata();
        const originalWidth = metadata.width || 1536;
        const originalHeight = metadata.height || 2048;

        // Calculate new inner dimensions (subtract margins from both sides)
        const marginX = Math.round(originalWidth * MARGIN_PERCENT);
        const marginY = Math.round(originalHeight * MARGIN_PERCENT);
        const innerWidth = originalWidth - (marginX * 2);
        const innerHeight = originalHeight - (marginY * 2);

        logger.info(`[ImageProcessor] Adding safe margins`, {
            original: `${originalWidth}x${originalHeight}`,
            inner: `${innerWidth}x${innerHeight}`,
            margin: `${marginX}px x ${marginY}px`
        });

        // Resize the image to fit within the inner area
        const resizedImage = await sharp(imageBuffer)
            .resize(innerWidth, innerHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toBuffer();

        // Get the actual resized dimensions (may differ due to aspect ratio)
        const resizedMeta = await sharp(resizedImage).metadata();
        const resizedWidth = resizedMeta.width || innerWidth;
        const resizedHeight = resizedMeta.height || innerHeight;

        // Calculate position to center the resized image
        const left = Math.round((originalWidth - resizedWidth) / 2);
        const top = Math.round((originalHeight - resizedHeight) / 2);

        // Create the final image: white canvas with centered content
        const result = await sharp({
            create: {
                width: originalWidth,
                height: originalHeight,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        })
            .composite([{
                input: resizedImage,
                left,
                top
            }])
            .png()
            .toBuffer();

        logger.success(`[ImageProcessor] Margins applied successfully`);
        return result;

    } catch (error) {
        logger.error('[ImageProcessor] Failed to add margins', error as Error);
        // Return original if processing fails (fail-open)
        return imageBuffer;
    }
}
