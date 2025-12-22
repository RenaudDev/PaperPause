export const PROMPT_CONFIG = {
    base: `
    Vector Line Art Coloring Page.
    SUBJECT: A cute, cozy cat.
    
    STYLE REQUIREMENTS:
    - Pure black outlines on pure white background.
    - Thick, consistent lines (4-6px).
    - Centered subject, filling the frame (min 80% occupancy).
    - No shading, no gray, no textures.
    - All paths must be closed.
  `,

    negative_prompt: "text, letters, words, numbers, signature, watermark, logo, name, gray, shading, gradient, realistic, photorealistic, 3d, rendering, photo, blurry, broken lines, thin lines, sketch, messy, horizontal, landscape, colored, transparent, background patterns, complex shading",

    attributes: {
        tones: [
            "Cozy", "Playful", "Sleepy", "Adventurous", "Elegant",
            "Curious", "Grumpy", "Zen", "Mischievous", "Cheerful",
            "Dreamy", "Focused", "Happy", "Lazy"
        ],
        types: [
            "Persian Cat", "Tabby Cat", "Siamese Cat", "Bengal Cat",
            "Maine Coon", "Scottish Fold", "Calico Cat", "Tuxedo Cat",
            "Sphynx Cat", "Ragdoll Cat", "British Shorthair", "Chubby Ginger Cat",
            "Fluffy Kitten"
        ],
        actions: [
            "baking cookies", "chasing butterflies", "napping", "reading a vintage book",
            "painting on a canvas", "knitting a scarf", "sipping herbal tea",
            "potting plants", "playing chess", "watching the rain",
            "juggling apples", "playing the violin", "rolling out dough",
            "peering into a fishbowl", "unraveling a ball of yarn"
        ],
        settings: [
            "rustic kitchen", "sunlit garden", "dusty library", "treehouse",
            "Parisian apartment balcony", "flower shop window", "cozy fireplace rug",
            "Japanese zen garden", "messy art studio", "vintage bakery",
            "magical forest clearing", "cluttered attic", "window sill",
            "vegetable garden", "sewing room"
        ],
        details: [
            "surrounded by flour and utensils", "among oversized sunflowers",
            "stacked on piles of books", "with hanging paper lanterns",
            "with a view of the Eiffel Tower", "surrounded by blooming daisies",
            "with a plate of cookies nearby", "under softly falling cherry blossoms",
            "with paint tubes scattered around", "smelling fresh bread",
            "surrounded by fireflies", "with balls of yarn everywhere",
            "with raindrops on the glass", "surrounded by pumpkins"
        ]
    }
};

/**
 * Randomly selects one value from each attribute array and constructs a unique prompt
 * Template: "{tone} {type} in a {setting} {action}"
 */
export const getRandomVariant = () => {
    const { tones, types, actions, settings } = PROMPT_CONFIG.attributes;

    const randomTone = tones[Math.floor(Math.random() * tones.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomSetting = settings[Math.floor(Math.random() * settings.length)];

    return `${randomTone} ${randomType} in a ${randomSetting} ${randomAction}`;
};
