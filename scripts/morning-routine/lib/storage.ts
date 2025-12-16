import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ENV } from '../config/env';
import { uploadToCloudflareImages, getCFImageVariants, deleteFromCloudflareImages } from './cf-images';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${ENV.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ENV.R2.ACCESS_KEY_ID,
        secretAccessKey: ENV.R2.SECRET_ACCESS_KEY
    }
});

export interface UploadResult {
    r2Url: string;              // Original PNG in R2 for backup
    cfImageId: string;          // Cloudflare Images ID
    imageUrl: string;           // Web preview URL (CF Images desktop variant)
    downloadUrl: string;        // R2 PDF download URL (empty string if PDF generation failed)
    variants: {
        desktop: string;        // 1200x1600 - Desktop web preview
        mobile: string;         // 600x800 - Mobile web preview
        thumbnail: string;      // 300x400 - Grid/masonry thumbnails
        rss: string;            // 1125x1500 - RSS feeds (3:4 ratio)
        pinterest: string;      // 1000x1500 - Pinterest/og:image (2:3 ratio)
    };
}

/**
 * Convert PNG buffer to PDF buffer optimized for A4/Letter printing
 * Handles image scaling to fit on page while maintaining aspect ratio
 */
export async function convertPngToPdf(pngBuffer: Buffer): Promise<Buffer> {
    // Get image dimensions using sharp
    const metadata = await sharp(pngBuffer).metadata();
    const imageWidth = metadata.width || 1200;
    const imageHeight = metadata.height || 1600;

    // Letter size dimensions in points (1 point = 1/72 inch)
    // Letter: 612 x 792 points (8.5 x 11 inches)
    const pageWidth = 612;
    const pageHeight = 792;

    // Calculate scaling to fit image on page while maintaining aspect ratio
    const scaleX = pageWidth / imageWidth;
    const scaleY = pageHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    // Center the image on the page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [pageWidth, pageHeight],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Embed the PNG image
        doc.image(pngBuffer, x, y, {
            width: scaledWidth,
            height: scaledHeight,
            fit: [scaledWidth, scaledHeight]
        });

        doc.end();
    });
}

export const uploadImage = async (buffer: Buffer, filename: string, collection?: string): Promise<UploadResult> => {
    // Extract collection from filename if not provided (e.g., "sleepy-cat-coloring-page-1234.png" -> "cats")
    // Always use lowercase for consistency
    const collectionFolder = (collection || filename.match(/-([a-z]+)-coloring-page-/)?.[1] + 's' || 'cats').toLowerCase();
    const key = `${collectionFolder}/${filename}`; // Organize in collection folder in bucket

    try {
        // 1. Upload original PNG to R2 (backup + archive)
        console.log(`[R2] Uploading PNG ${key}...`);
        await R2.send(new PutObjectCommand({
            Bucket: ENV.R2.BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/png', // PNG from Recraft
            ContentDisposition: `attachment; filename="${filename}"` // Force download instead of inline display
        }));

        const r2Url = `${ENV.R2.PUBLIC_URL_BASE}/${key}`;
        console.log(`[R2] ✅ PNG stored at ${r2Url}`);

        // 2. Generate PDF from PNG (non-blocking - failures don't break PNG upload)
        let downloadUrl = '';
        try {
            console.log(`[PDF] Converting PNG to PDF...`);
            const pdfBuffer = await convertPngToPdf(buffer);
            const pdfKey = key.replace('.png', '.pdf');
            const pdfFilename = filename.replace('.png', '.pdf');

            console.log(`[R2] Uploading PDF ${pdfKey}...`);
            await R2.send(new PutObjectCommand({
                Bucket: ENV.R2.BUCKET_NAME,
                Key: pdfKey,
                Body: pdfBuffer,
                ContentType: 'application/pdf',
                ContentDisposition: `attachment; filename="${pdfFilename}"`
            }));

            downloadUrl = `${ENV.R2.PUBLIC_URL_BASE}/${pdfKey}`;
            console.log(`[R2] ✅ PDF stored at ${downloadUrl}`);
        } catch (pdfError) {
            console.warn(`[PDF] ⚠️ PDF generation failed, PNG fallback will be used:`, pdfError);
            // Set downloadUrl to empty string so frontmatter knows no PDF exists
            downloadUrl = '';
        }

        // 3. Upload to Cloudflare Images for web delivery (if configured)
        let cfImageId = '';
        let imageUrl = r2Url; // Fallback to R2
        let variants = {
            desktop: r2Url,
            mobile: r2Url,
            thumbnail: r2Url,
            rss: r2Url,
            pinterest: r2Url
        };

        if (ENV.CF_IMAGES.ACCOUNT_ID && ENV.CF_IMAGES.API_TOKEN) {
            try {
                cfImageId = await uploadToCloudflareImages(buffer, filename);
                const cfVariants = getCFImageVariants(cfImageId);
                imageUrl = cfVariants.desktop;
                variants = cfVariants;
                console.log(`[Upload] ✅ CF Images configured for web delivery`);
            } catch (cfError) {
                console.warn(`[Upload] ⚠️ CF Images upload failed, falling back to R2:`, cfError);
                cfImageId = ''; // Mark as failed but continue
            }
        } else {
            console.log(`[Upload] ℹ️ CF Images not configured, using R2 direct delivery`);
        }

        return {
            r2Url,
            cfImageId,
            imageUrl,
            downloadUrl,
            variants
        };
    } catch (error) {
        console.error(`[R2] Upload Failed for ${key}:`, error);
        throw error;
    }
};

export const deleteImage = async (filename: string, cfImageId?: string, collection?: string): Promise<void> => {
    // Extract collection from filename if not provided
    // Always use lowercase for consistency
    const collectionFolder = (collection || filename.match(/-([a-z]+)-coloring-page-/)?.[1] + 's' || 'cats').toLowerCase();
    const key = `${collectionFolder}/${filename}`;
    const pdfKey = key.replace('.png', '.pdf');
    
    try {
        // 1. Delete PNG from R2 storage
        console.log(`[R2] Attempting to delete: ${key}`);
        await R2.send(new DeleteObjectCommand({
            Bucket: ENV.R2.BUCKET_NAME,
            Key: key
        }));
        console.log(`[R2] ✅ Successfully deleted ${key}`);

        // 2. Delete PDF from R2 storage (if it exists)
        try {
            console.log(`[R2] Attempting to delete: ${pdfKey}`);
            await R2.send(new DeleteObjectCommand({
                Bucket: ENV.R2.BUCKET_NAME,
                Key: pdfKey
            }));
            console.log(`[R2] ✅ Successfully deleted ${pdfKey}`);
        } catch (pdfDeleteError) {
            console.warn(`[R2] ⚠️ PDF delete failed (may not exist): ${pdfKey}`, pdfDeleteError);
            // Don't throw - PDF may not exist and shouldn't block PNG deletion
        }
        
        // 3. Delete from Cloudflare Images if ID provided
        if (cfImageId) {
            console.log(`[CF Images] Deleting image ID: ${cfImageId}`);
            await deleteFromCloudflareImages(cfImageId);
        }
        
    } catch (error) {
        console.error(`[R2] ❌ Delete failed for ${key}:`, error);
        throw error; // Propagate so dashboard knows it failed
    }
};
