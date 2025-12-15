import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const ENV = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: 'gemini-3-pro-image-preview',

    R2: {
        ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
        ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
        SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
        BUCKET_NAME: process.env.R2_BUCKET_NAME || 'paperpause',
        PUBLIC_URL_BASE: process.env.R2_PUBLIC_URL || 'https://img.paperpause.app'
    },

    CF_IMAGES: {
        ACCOUNT_ID: process.env.CF_IMAGES_ACCOUNT_ID || '',
        API_TOKEN: process.env.CF_IMAGES_API_TOKEN || '',
        ACCOUNT_HASH: process.env.CF_IMAGES_ACCOUNT_HASH || '', // For delivery URLs
    },

    PATHS: {
        CONTENT_DIR: path.resolve(__dirname, '../../../content'),
        DASHBOARD_PORT: parseInt(process.env.DASHBOARD_PORT || '3000', 10)
    }
};

if (!ENV.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is missing in .env");
}
