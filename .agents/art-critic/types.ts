/**
 * Art Critic Agent Types
 */

export type QAResult = 'pass' | 'fail';

/**
 * Bounded enum for QA failure reasons as per PRD
 */
export type QAFailureReason =
  | 'TEXT_PRESENT'         // Image contains words, letters or numbers
  | 'GRAYSCALE_SHADING'    // Image has realistic shading instead of line art
  | 'BLURRY_LINES'         // Image has low resolution or fuzzy edges
  | 'MAJOR_OPEN_PATHS'     // Lines or shapes are not fully enclosed (hard to color)
  | 'CANVAS_OCCUPANCY_LOW' // Image is too small/sparse on the page
  | 'TOO_COMPLEX'         // Lines are too dense for a coloring page
  | 'OFF_SUBJECT'          // Image doesn't match the requested subject
  | 'BAD_AESTHETIC';       // General quality issues (AI artifacts, etc.)

export interface QAAssessmentInput {
  imageUrl: string;
  category?: string;
  collection?: string;
  prompt?: string;
}

export interface QAAssessmentOutput {
  qa_result: QAResult;
  reason?: QAFailureReason;
  reason_details?: string;
}
