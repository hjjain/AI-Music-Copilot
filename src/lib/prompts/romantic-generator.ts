/**
 * Romantic Hindi Song Prompt Generator
 * 
 * Professional prompt engineering inspired by MMS_BACKEND
 * Research-based prompts from legendary Hindi artists
 * With anime romantic couple visuals
 */

import {
  ROMANTIC_THEMES,
  RomanticTheme,
  getRandomTheme,
  getThemeById,
  getRandomLyricist,
  getRandomMusicDirector,
  getRandomAnimeScene,
  getRandomTitle,
  getRandomMusicStyle,
  getPlaylistForTheme,
  REFERENCE_ARTISTS,
  MUSIC_STYLES,
} from './romantic-config';
import { generateSunoPrompt, EmotionIntensity, INTENSITY_MODIFIERS, getLyricGuidance } from './prompt-enhancer';

export interface RomanticPrompt {
  title: string;
  theme: RomanticTheme;
  musicPrompt: string;  // For Suno (short, <200 chars)
  fullPrompt: string;   // Full detailed prompt (for reference)
  style: string;        // Music style/genre
  imagePrompt: string;  // For Replicate - anime style
  emotionIntensity: EmotionIntensity; // high/medium/low for prompt adjustment
  playlistTag: RomanticTheme['playlistTag']; // For YouTube playlist categorization
  playlistInfo: { name: string; description: string }; // Playlist details
  lyricGuidance: { hook: string; poetic: string }; // Lyric structure examples
  references: {
    lyricist: string;
    musicDirector: string;
  };
}

/**
 * Generate a complete romantic song prompt
 * Uses weighted themes and artist references
 * Enhanced with MMS_BACKEND style prompt engineering
 * Now includes emotion intensity for dynamic prompt adjustment
 */
export function generateRomanticPrompt(themeId?: string): RomanticPrompt {
  // Get theme (weighted random if not specified)
  const theme = themeId ? getThemeById(themeId) || getRandomTheme() : getRandomTheme();
  
  // Get emotion intensity from theme (for Suno prompt adjustment)
  const emotionIntensity = theme.emotionIntensity;
  
  // Get random references for inspiration
  const lyricist = getRandomLyricist();
  const musicDirector = getRandomMusicDirector();
  const musicStyle = getRandomMusicStyle();
  
  // Generate title based on theme
  const title = getRandomTitle(theme.id);
  
  // Get emotion for this theme
  const emotion = theme.emotions[Math.floor(Math.random() * theme.emotions.length)];
  
  // Generate FULL detailed prompt (for reference/display)
  // Now passes emotion intensity for tempo/style adjustment
  const fullPrompt = composeDetailedPrompt(theme, musicDirector, musicStyle, emotion, emotionIntensity);
  
  // Generate SHORT music prompt for Suno API (max 200 chars)
  // Now passes emotion intensity for tempo/dynamics adjustment
  const musicPrompt = generateSunoPrompt(theme.nameHindi, emotion, musicStyle.description, emotionIntensity);
  
  // Generate style string (includes intensity-based tempo)
  const style = composeStyleString(theme, musicDirector, emotionIntensity);
  
  // Generate anime image prompt (detailed, cinematic)
  const imagePrompt = composeAnimeImagePrompt(theme);
  
  // Get playlist info for YouTube
  const playlistInfo = getPlaylistForTheme(theme);
  
  // Get lyric guidance (hook = first 15-20s, poetic = later)
  const lyricGuidance = getLyricGuidance(theme.playlistTag);
  
  return {
    title,
    theme,
    musicPrompt,
    fullPrompt,
    style,
    imagePrompt,
    emotionIntensity,
    playlistTag: theme.playlistTag,
    playlistInfo,
    lyricGuidance,
    references: {
      lyricist: lyricist.name,
      musicDirector: musicDirector.name,
    },
  };
}

/**
 * Compose DETAILED prompt for reference/display
 * Based on MMS_BACKEND's professional prompt structure
 * Now includes anime music fusion elements and emotion intensity
 */
function composeDetailedPrompt(
  theme: RomanticTheme,
  musicDirector: typeof REFERENCE_ARTISTS.musicDirectors[keyof typeof REFERENCE_ARTISTS.musicDirectors],
  musicStyle: typeof MUSIC_STYLES[keyof typeof MUSIC_STYLES],
  emotion: string,
  intensity: EmotionIntensity
): string {
  // Get setting from theme
  const setting = theme.settings[Math.floor(Math.random() * theme.settings.length)];
  
  // Get intensity modifiers for tempo and dynamics
  const intensityMod = INTENSITY_MODIFIERS[intensity];
  
  // Randomly decide production style (60% Bollywood, 40% Anime fusion)
  const useAnimeStyle = Math.random() < 0.4;
  
  let productionDetails: string[];
  
  if (useAnimeStyle) {
    // Anime OST fusion style (Suzume/RADWIMPS inspired)
    productionDetails = [
      `A romantic Hindi song about ${emotion}`,
      `set in ${setting}.`,
      `Style: Anime film soundtrack fusion with Hindi vocals,`,
      `piano-driven melody with orchestral strings,`,
      `featuring emotional rock guitars, sweeping strings, grand piano, ambient synths.`,
      `Tempo: ${intensityMod.tempo}.`,
      `Vocals: ${intensityMod.vocalStyle}.`,
      `${intensityMod.dynamics}.`,
      `Blend of Bollywood romance with anime soundtrack grandeur,`,
      `2:30-3 minutes long.`,
    ];
  } else {
    // Traditional Bollywood style with intensity adjustment
    productionDetails = [
      `A romantic Hindi song about ${emotion}`,
      `set in ${setting}.`,
      `Style: ${musicStyle.description},`,
      `Tempo: ${intensityMod.tempo},`,
      `featuring ${musicStyle.instruments}.`,
      `${musicDirector.style.split(',')[0]} production style.`,
      `Vocals: ${intensityMod.vocalStyle},`,
      `${intensityMod.arrangement},`,
      `${intensityMod.dynamics}.`,
      `Bollywood romantic quality,`,
      `2:30-3 minutes long.`,
    ];
  }
  
  return productionDetails.join(' ');
}

/**
 * Compose style string for Suno
 * Now includes intensity-based descriptors
 */
function composeStyleString(
  theme: RomanticTheme,
  musicDirector: typeof REFERENCE_ARTISTS.musicDirectors[keyof typeof REFERENCE_ARTISTS.musicDirectors],
  intensity: EmotionIntensity
): string {
  // Intensity-specific moods
  const moodsByIntensity: Record<EmotionIntensity, string[]> = {
    high: ['emotional', 'soulful', 'heartbreaking', 'raw'],
    medium: ['romantic', 'melodious', 'beautiful', 'tender'],
    low: ['sweet', 'soft', 'innocent', 'gentle'],
  };
  
  const moods = moodsByIntensity[intensity];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  
  // Intensity-specific tempo hint
  const tempoHint = intensity === 'high' ? 'slow emotional'
    : intensity === 'low' ? 'soft gentle'
    : 'melodious';
  
  return `${mood} Hindi romantic, ${tempoHint}, ${musicDirector.style.split(',')[0]}, Bollywood love song`;
}

/**
 * Compose anime image prompt for Replicate
 * Enhanced with MMS_BACKEND style detailed prompts
 * Inspired by Makoto Shinkai films (Your Name, Weathering With You, Suzume)
 */
function composeAnimeImagePrompt(theme: RomanticTheme): string {
  // Get a random anime scene from theme
  const baseScene = getRandomAnimeScene(theme);
  
  // Detailed art direction (Makoto Shinkai / anime film style)
  const artDirection = [
    'high quality anime illustration, Makoto Shinkai style',
    'beautiful detailed background, Your Name movie aesthetic',
    'cinematic anime composition, film quality',
    'studio ghibli inspired soft art style',
    'Suzume movie visual style, emotional atmosphere',
    'anime film screenshot quality, detailed environment',
  ];
  
  // Specific lighting (anime film characteristic lighting)
  const lightingOptions = [
    'golden hour with dramatic clouds, god rays',
    'soft diffused blue hour light with city lights',
    'romantic sunset glow with lens flare',
    'rain with neon city reflections',
    'dreamy morning light rays through window',
    'magical twilight sky with stars appearing',
    'dramatic cloudy sky with sunbeams breaking through',
  ];
  
  // Composition rules (cinematic anime style)
  const compositions = [
    'wide cinematic aspect composition',
    'environmental storytelling focus',
    'intimate two-shot framing',
    'dramatic sky dominating upper half',
  ];
  
  // Anime-specific visual elements
  const animeElements = [
    'detailed clouds and sky',
    'beautiful atmospheric perspective',
    'cherry blossom petals floating',
    'rain drops with bokeh',
    'city lights twinkling',
    'train or station in background',
    'traditional Japanese elements blend',
  ];
  
  const randomArt = artDirection[Math.floor(Math.random() * artDirection.length)];
  const randomLighting = lightingOptions[Math.floor(Math.random() * lightingOptions.length)];
  const randomComp = compositions[Math.floor(Math.random() * compositions.length)];
  const randomElement = animeElements[Math.floor(Math.random() * animeElements.length)];
  
  // Compose detailed anime film-quality image prompt
  // Note: NO VISIBLE FACES - only silhouettes, back views, or side profiles
  return [
    baseScene,
    theme.colorMood,
    randomLighting,
    randomArt,
    randomComp,
    randomElement,
    'anime couple silhouettes or back view only',
    'no visible faces',
    'emotional cinematic atmosphere',
    'album cover art square format 1:1',
    'no text no logos no watermarks',
    '8k quality anime illustration',
  ].join(', ');
}

/**
 * Generate prompt with manual theme selection (for semi-auto)
 */
export function generateRomanticPromptForTheme(themeId: string): RomanticPrompt {
  return generateRomanticPrompt(themeId);
}

/**
 * Get all themes for UI selection
 */
export function getAllThemes(): RomanticTheme[] {
  return ROMANTIC_THEMES;
}

/**
 * Preview prompt without generating
 * For semi-auto approval flow
 */
export function previewPrompt(themeId?: string): RomanticPrompt {
  return generateRomanticPrompt(themeId);
}

/**
 * Regenerate a specific part of the prompt
 */
export function regenerateTitle(theme: RomanticTheme): string {
  return getRandomTitle(theme.id);
}

export function regenerateImagePrompt(theme: RomanticTheme): string {
  return composeAnimeImagePrompt(theme);
}

export function regenerateMusicPrompt(theme: RomanticTheme): string {
  const musicStyle = getRandomMusicStyle();
  const emotion = theme.emotions[Math.floor(Math.random() * theme.emotions.length)];
  return generateSunoPrompt(theme.nameHindi, emotion, musicStyle.description, theme.emotionIntensity);
}

/**
 * Get theme statistics for dashboard
 */
export function getThemeStats(): { total: number; themes: string[] } {
  return {
    total: ROMANTIC_THEMES.length,
    themes: ROMANTIC_THEMES.map(t => t.nameHindi),
  };
}

/**
 * Scene variations for 3-image generation
 * Each scene tells a different part of the visual story
 */
const SCENE_VARIATIONS = [
  {
    name: 'Opening Scene',
    elements: [
      'romantic first meeting aesthetic',
      'couple silhouette against dramatic sky',
      'looking at each other from a distance',
      'train station or bridge encounter',
    ],
    lighting: 'golden hour with dramatic clouds, god rays',
    composition: 'wide cinematic establishing shot',
  },
  {
    name: 'Intimate Moment',
    elements: [
      'couple close together, back view',
      'shared umbrella in rain',
      'sitting on rooftop watching city',
      'walking together on beach at sunset',
    ],
    lighting: 'soft romantic twilight glow',
    composition: 'intimate two-shot framing',
  },
  {
    name: 'Emotional Peak',
    elements: [
      'dramatic separation or reunion moment',
      'running towards each other',
      'reaching hands not quite touching',
      'couple silhouette against moon or stars',
    ],
    lighting: 'dramatic backlit silhouette, lens flare',
    composition: 'centered dramatic composition',
  },
];

/**
 * Generate 3 different scene image prompts for the same theme
 * Perfect for sequential image generation with variety
 * 
 * @param theme - The romantic theme to use
 * @returns Array of 3 different scene prompts
 */
export function generateMultiSceneImagePrompts(theme: RomanticTheme): string[] {
  // Base scene from theme (uses animeScenes array)
  const baseSceneOptions = theme.animeScenes;
  
  // Art direction (Makoto Shinkai inspired)
  const artDirection = [
    'Your Name movie visual style, Makoto Shinkai aesthetic',
    'beautiful detailed background, Your Name movie aesthetic',
    'Suzume movie visual style, emotional atmosphere',
  ];
  
  // Generate 3 unique scene prompts
  return SCENE_VARIATIONS.map((scene, index) => {
    const baseScene = baseSceneOptions[index % baseSceneOptions.length];
    const sceneElement = scene.elements[Math.floor(Math.random() * scene.elements.length)];
    const art = artDirection[index];
    
    return [
      baseScene,
      sceneElement,
      theme.colorMood,
      scene.lighting,
      art,
      scene.composition,
      'anime couple silhouettes or back view only',
      'no visible faces',
      'emotional cinematic atmosphere',
      '8k quality anime illustration',
      'no text no logos no watermarks',
    ].join(', ');
  });
}

/**
 * Generate animation prompts for each of the 3 scenes
 * Different motion style for each scene
 */
export function getAnimationPromptsForScenes(): string[] {
  return [
    // Scene 1: Opening - gentle environmental motion
    'gentle wind blowing through scene, clouds moving slowly, dreamy atmospheric motion, subtle light rays shifting',
    // Scene 2: Intimate - subtle character breathing and ambient motion
    'soft breathing motion, rain drops falling gently, warm candlelight flickering, romantic atmosphere',
    // Scene 3: Emotional Peak - dramatic motion
    'dramatic wind and movement, cherry blossom petals swirling, emotional intensity, cinematic camera drift',
  ];
}
