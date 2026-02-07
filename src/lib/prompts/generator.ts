import { SongCategory, GeneratedPrompt } from '@/types';
import {
  getRandomCategory,
  getRandomItem,
  getCategoryById,
  EMOTION_POOLS,
  TIME_SETTINGS,
  ENERGY_LEVELS,
  SOUND_TEXTURES,
  getCurrentEvent,
  getRandomEvent,
  CUSTOM_TRENDING_TOPICS,
  IndianEvent,
} from './categories';

/**
 * Dynamic Title Generation
 * All titles are in Hindi/Hinglish
 */
const TITLE_PATTERNS: Record<string, string[]> = {
  'quiet-motivation': [
    'Khamosh Himmat',
    'Subah Se Pehle',
    'Andar Ki Aag',
    'Akele Mein',
    'Meri Mehnat',
    'Chup Chaap',
    'Sapno Ka Safar',
    'Hausla',
    'Apna Waqt',
    'Akela Raahi',
  ],
  'safar-journey': [
    'Safar',
    'Raaste',
    'Manzil Dur Hai',
    'Chalte Raho',
    'Anjaan Raahein',
    'Musafir',
    'Lambi Dagar',
    'Rahi',
    'Ghar Se Dur',
    'Akela Safar',
  ],
  'late-night-2am': [
    'Raat 2 Baje',
    'Neend Nahi Aati',
    'Raat Ke Khayal',
    'Tanhai',
    'Chandni Raat',
    'Sannata',
    'Akeli Raat',
    'Soch',
    'Khamoshi',
    'Andheri Raat',
  ],
  'cinematic-score': [
    'Woh Lamha',
    'Shuru',
    'Mod',
    'Jaagna',
    'Nayi Subah',
    'Kahani',
    'Ehsaas',
    'Climax',
    'Ankahe',
    'Dastaan',
  ],
  'calm-focus': [
    'Dhyan',
    'Flow',
    'Ekagrata',
    'Zone Mein',
    'Clarity',
    'Padhai',
    'Kaam Ka Waqt',
    'Shanti',
    'Productive',
    'Study Vibes',
  ],
  'trending-topical': [
    // Will be dynamically generated from events
    'Jai Hind',
    'Mera Bharat',
    'Vande Mataram',
    'Desh Ki Mitti',
    'Tiranga',
  ],
};

/**
 * Generate a complete prompt using dynamic parameter composition
 * ALL PROMPTS ARE IN HINDI/HINGLISH
 */
export function generatePrompt(categoryId?: string, customTopic?: string): GeneratedPrompt {
  // Get category (random if not specified)
  const category = categoryId 
    ? getCategoryById(categoryId) || getRandomCategory()
    : getRandomCategory();

  // Special handling for trending/topical category
  if (category.id === 'trending-topical') {
    return generateTrendingPrompt(category, customTopic);
  }

  // Generate title from patterns
  const titles = TITLE_PATTERNS[category.id] || TITLE_PATTERNS['quiet-motivation'];
  const title = getRandomItem(titles);

  // Get dynamic parameters for this category
  const emotions = EMOTION_POOLS[category.id] || EMOTION_POOLS['quiet-motivation'];
  const times = TIME_SETTINGS[category.id] || TIME_SETTINGS['quiet-motivation'];
  const textures = SOUND_TEXTURES[category.id] || SOUND_TEXTURES['quiet-motivation'];

  // Randomly select parameters
  const emotion = getRandomItem(emotions);
  const timeSetting = getRandomItem(times);
  const energy = getRandomItem(ENERGY_LEVELS);
  const texture = getRandomItem(textures);

  // Generate style from category
  const genre = getRandomItem(category.genres);
  const mood = getRandomItem(category.moods);
  const style = `${mood} ${genre}, Hindi/Bollywood style`;

  // Compose dynamic music prompt (NOT hardcoded)
  const musicPrompt = composeMusicPrompt({
    category,
    emotion,
    timeSetting,
    energy,
    texture,
  });

  // Generate image prompt
  const imageHint = getRandomItem(category.imagePromptHints);
  const imagePrompt = generateImagePrompt(category, imageHint, mood);

  return {
    category,
    title,
    lyrics: musicPrompt, // This is a dynamic prompt, not lyrics
    style,
    imagePrompt,
  };
}

/**
 * Generate prompt for trending/topical category
 */
function generateTrendingPrompt(category: SongCategory, customTopic?: string): GeneratedPrompt {
  // Get event - current/upcoming, custom topic, or random
  let event: IndianEvent;
  
  if (customTopic) {
    // Use custom topic if provided
    event = CUSTOM_TRENDING_TOPICS.find(t => 
      t.name.toLowerCase().includes(customTopic.toLowerCase())
    ) || getRandomEvent();
  } else {
    // Check for current/upcoming event
    const currentEvent = getCurrentEvent();
    event = currentEvent || getRandomItem(CUSTOM_TRENDING_TOPICS);
  }

  // Generate title from event
  const title = getRandomItem(event.titleIdeas);
  const theme = getRandomItem(event.themes);

  // Get dynamic parameters
  const emotions = EMOTION_POOLS['trending-topical'];
  const times = TIME_SETTINGS['trending-topical'];
  const textures = SOUND_TEXTURES['trending-topical'];

  const emotion = getRandomItem(emotions);
  const timeSetting = getRandomItem(times);
  const energy = getRandomItem(ENERGY_LEVELS);
  const texture = getRandomItem(textures);

  // Compose trending music prompt
  const musicPrompt = composeTrendingPrompt({
    event,
    theme,
    emotion,
    timeSetting,
    energy,
    texture,
  });

  // Generate style
  const genre = getRandomItem(category.genres);
  const mood = getRandomItem(category.moods);
  const style = `${mood} ${genre}, Hindi patriotic style`;

  // Generate image prompt
  const imageHint = getRandomItem(category.imagePromptHints);
  const imagePrompt = generateTrendingImagePrompt(event, imageHint, mood);

  return {
    category,
    title,
    lyrics: musicPrompt,
    style,
    imagePrompt,
  };
}

/**
 * Compose dynamic music prompt from parameters
 * PROMPTS MUST BE SHORT (~150 chars max for Suno)
 */
function composeMusicPrompt(params: {
  category: SongCategory;
  emotion: string;
  timeSetting: string;
  energy: string;
  texture: string;
}): string {
  const { category, emotion, texture } = params;

  // Keep prompts SHORT - Suno has strict limits
  const categoryPrompts: Record<string, string> = {
    'quiet-motivation': `Hindi song about ${emotion}. ${texture}. Slow, hopeful, Bollywood style.`,
    'safar-journey': `Hindi travel song about journey and ${emotion}. ${texture}. Cinematic, emotional.`,
    'late-night-2am': `Hindi late night song about ${emotion}. ${texture}. Slow, soft, lo-fi vibes.`,
    'cinematic-score': `Hindi cinematic music. ${emotion}. ${texture}. Emotional, powerful.`,
    'calm-focus': `Hindi ambient music for focus. ${emotion}. ${texture}. Calm, minimal.`,
    'trending-topical': `Hindi patriotic song. ${emotion}. ${texture}. Powerful anthem style.`,
  };

  return categoryPrompts[category.id] || categoryPrompts['quiet-motivation'];
}

/**
 * Compose trending/topical music prompt - KEEP SHORT
 */
function composeTrendingPrompt(params: {
  event: IndianEvent;
  theme: string;
  emotion: string;
  timeSetting: string;
  energy: string;
  texture: string;
}): string {
  const { event, theme, emotion, texture } = params;

  // Keep prompt SHORT for Suno API limits
  return `Hindi patriotic song for ${event.nameHindi}. Theme: ${theme}. ${emotion}. ${texture}. Bollywood anthem.`;
}

/**
 * Generate image prompt for Replicate (recraft-v3)
 */
function generateImagePrompt(
  category: SongCategory,
  imageHint: string,
  mood: string
): string {
  const styleModifiers = [
    'cinematic lighting',
    'high quality',
    'detailed',
    'professional photography style',
    'moody atmosphere',
    'dramatic contrast',
    'soft focus background',
  ];

  const colorPalettes: Record<string, string> = {
    'quiet-motivation': 'warm golden tones, soft sunrise colors, minimal palette',
    'safar-journey': 'sunset oranges and purples, wide landscape colors, golden hour',
    'late-night-2am': 'deep blues and purples, city light glows, midnight palette',
    'cinematic-score': 'dramatic contrasts, deep shadows, epic color grading',
    'calm-focus': 'soft neutrals, warm earth tones, minimal and clean',
    'trending-topical': 'Indian tricolor hints, saffron white green, patriotic colors',
  };

  const palette = colorPalettes[category.id] || 'balanced natural colors';
  const styleModifier = getRandomItem(styleModifiers);

  return `${imageHint}, ${mood} atmosphere, ${palette}, ${styleModifier}, album cover art style, square format, no text, aesthetic, Indian aesthetic`;
}

/**
 * Generate image prompt for trending/topical content
 */
function generateTrendingImagePrompt(
  event: IndianEvent,
  imageHint: string,
  mood: string
): string {
  const eventSpecificHints: Record<string, string> = {
    'national': 'Indian flag colors, patriotic theme, saffron white green',
    'festival': 'celebration lights, festive atmosphere, vibrant colors',
    'cultural': 'diverse Indian faces, unity theme, colorful',
    'sports': 'energetic, competitive spirit, team colors',
  };

  const eventHint = eventSpecificHints[event.type] || eventSpecificHints['national'];

  return `${imageHint}, ${mood} atmosphere, ${eventHint}, cinematic lighting, album cover art style, square format, no text, Indian aesthetic, high quality`;
}

/**
 * Get all available categories for UI
 */
export function getAllCategories(): SongCategory[] {
  return [
    getCategoryById('quiet-motivation')!,
    getCategoryById('safar-journey')!,
    getCategoryById('late-night-2am')!,
    getCategoryById('cinematic-score')!,
    getCategoryById('calm-focus')!,
    getCategoryById('trending-topical')!,
  ];
}

/**
 * Check if there's an upcoming event for trending category
 */
export function getUpcomingEventInfo(): { hasEvent: boolean; event?: IndianEvent } {
  const event = getCurrentEvent();
  return {
    hasEvent: !!event,
    event: event || undefined,
  };
}
