export interface SEOReviewInput {
  imageUrl: string;
  subject: string;
  style: string;
  medium: string;
  audience: string; // "Kids" or "Adults"
  originalPrompt?: string;
}

export interface SEOReviewOutput {
  title: string; // <= 50 chars
  slug: string; // <--- NEW: URL-friendly slug
  description: string; // 140-160 chars
  pinterest_title: string; // <= 80 chars
  pinterest_description: string; // 200-300 chars
  prompt: string; // 1-2 sentences, literal description for alt text
}

export class SEOValidationError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'SEOValidationError';
  }
}


