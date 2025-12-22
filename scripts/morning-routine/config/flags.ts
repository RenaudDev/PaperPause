import { logger } from '../lib/logger';

/**
 * Autonomy System Feature Flags
 * 
 * These flags control the phased rollout of the autonomous pipeline.
 * They are sourced from environment variables, typically set in the 
 * GitHub Actions workflow or a local .dev.vars file.
 */
export const FLAGS = {
  // Phase A: Scheduling & Scaffolding
  ENABLE_FOREMAN: process.env.ENABLE_FOREMAN === '1',
  ENABLE_DESIGNER: process.env.ENABLE_DESIGNER === '1',
  DESIGNER_DRY_RUN: process.env.DESIGNER_DRY_RUN !== '0', // Default to dry-run true for safety

  // Phase B: Quality Assurance
  ENABLE_QA: process.env.ENABLE_QA === '1',
  QA_MODE: (process.env.QA_MODE as 'observe' | 'enforce_failfast') || 'observe',

  // Phase C: Finishing & JIT
  ENABLE_FINISHING: process.env.ENABLE_FINISHING === '1',
  ENABLE_PDF: process.env.ENABLE_PDF === '1', // Controls post-QA PDF generation

  // Phase D: Feedback Loops
  ENABLE_IMMUNIZATION: process.env.ENABLE_IMMUNIZATION === '1',
};

/**
 * Log the current flag status to the console/logger
 */
export function logActiveFlags() {
  const activeFlags = Object.entries(FLAGS)
    .filter(([_, value]) => value === true || (typeof value === 'string' && (value as string) !== '0'))
    .map(([key, value]) => `${key}: ${value}`);

  if (activeFlags.length > 0) {
    logger.info('🚩 Active Autonomy Flags:', activeFlags);
  } else {
    logger.info('🏳️ No autonomy flags enabled (Baseline Mode)');
  }
}
