import { logger } from '../lib/logger';

/**
 * Art Style Definitions for Coloring Pages
 * Each style includes a description and the prompt modifier to inject into image generation
 */

export interface StyleDefinition {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  targetAudience: 'Kids' | 'Adults';
  preferredMedium?: string;
  tags?: string[];
}

export const COLORING_STYLES: Record<string, StyleDefinition> = {
  kawaii: {
    id: "kawaii",
    name: "Kawaii",
    description: "Cute, simple, rounded. Good for kids, relaxing for adults.",
    promptModifier: "chibi style, super cute, rounded soft shapes, large eyes, simple details, thick joyful outlines, japanese kawaii aesthetic, minimal background noise, closed paths, bold easy-to-color segments",
    targetAudience: "Kids",
    preferredMedium: "Crayons",
    tags: ["cute", "kids", "simple", "rounded", "japanese"]
  },

  cottagecore: {
    id: "cottagecore",
    name: "Cottagecore",
    description: "Cozy, nostalgic, storybook feel.",
    promptModifier: "gentle hand-drawn illustration, cozy cottagecore aesthetic, medium-weight even outlines, storybook illustration style, soft organic shapes, clear fillable sections, pastoral and homey feel, minimal background clutter, clean black and white line art, continuous closed paths.",
    targetAudience: "Adults",
    preferredMedium: "Colored Pencils",
    tags: ["cozy", "nostalgic", "storybook", "whimsical", "nature"]
  },

  totem: {
    id: "totem",
    name: "Totem",
    description: "Outline with internal patterns (Zentangle style).",
    promptModifier: "zentangle style, silhouette shape filled with intricate floral and geometric patterns, mandala elements, decorative internal line work, folk art inspired, symmetrical patterning, clear separation between patterns, distinct segments.",
    targetAudience: "Adults",
    preferredMedium: "Gel Pens",
    tags: ["patterns", "zentangle", "meditative", "detailed", "symmetrical"]
  },

  popArt: {
    id: "pop-art",
    name: "Bold Line Pop Art",
    description: "Modern, sharp, sticker-like.",
    promptModifier: "pop art style, thick uniform bold outer lines, stained glass segments, graffiti art influence, clear segmentation, modern vector art, distinct shapes for easy coloring, dynamic angles, no shading, monochrome line work.",
    targetAudience: "Kids",
    preferredMedium: "Markers",
    tags: ["bold", "modern", "sticker", "vector", "dynamic"]
  },

  magicalRealism: {
    id: "magical-realism",
    name: "Magical Realism",
    description: "Realistic proportions but fantasy elements (The 'Enchanted' look).",
    promptModifier: "enchanted realism, biologically accurate anatomy blended with fantasy elements, elegant and regal, fine detailed line work, art nouveau influence, ethereal atmosphere, dreamlike composition, mystical details, sharp black and white outlines.",
    targetAudience: "Adults",
    preferredMedium: "Colored Pencils",
    tags: ["realistic", "fantasy", "elegant", "detailed", "enchanted"]
  },

  steampunk: {
    id: "steampunk",
    name: "SteamPunk",
    description: "Mechanical, detailed, Victorian industrial.",
    promptModifier: "steampunk style, mechanical details, gears and cogs, victorian industrial aesthetic, fine technical line work, brass and copper textures implied through shading patterns, intricate machinery, scifi-vintage fusion, clear nuts and bolts details, clockwork elements.",
    targetAudience: "Adults",
    preferredMedium: "Fineliners",
    tags: ["steampunk", "mechanical", "gears", "victorian", "detailed"]
  }
};

/**
 * Get a random style from the available styles
 */
export function getRandomStyle(): StyleDefinition {
  const styles = Object.values(COLORING_STYLES);
  return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * Get style by ID
 */
export function getStyleById(styleId: string): StyleDefinition | null {
  return COLORING_STYLES[styleId] || null;
}

/**
 * Get all style IDs
 */
export function getAllStyleIds(): string[] {
  return Object.keys(COLORING_STYLES);
}

/**
 * Get all style names for display
 */
export function getAllStyleNames(): string[] {
  return Object.values(COLORING_STYLES).map(s => s.name);
}

/**
 * Find style by name (case-insensitive)
 */
export function getStyleByName(styleName: string): StyleDefinition | null {
  const nameLower = styleName.toLowerCase();
  const allStyles = Object.values(COLORING_STYLES);
  return allStyles.find(s => s.name.toLowerCase() === nameLower) || null;
}

