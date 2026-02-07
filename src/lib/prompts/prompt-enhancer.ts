/**
 * Professional Prompt Enhancement System
 * Adapted from MMS_BACKEND for Romantic Hindi Music
 * 
 * This provides utility functions for generating better prompts
 * Note: Uses simple template-based generation (no external AI calls needed)
 */

/**
 * System prompt reference for enhancing song prompts
 * Based on MMS_BACKEND's production-grade prompt engineering
 * (Stored here for documentation - actual prompts are generated via templates)
 */
export const SONG_ENHANCER_REFERENCE = `
PRODUCTION DETAILS TO INCLUDE:
- TEMPO: Slow ballad (60-80 BPM), Mid-tempo romantic (80-100 BPM), Upbeat (100-120 BPM)
- KEY/MODE: Minor keys for melancholy, Major for joy, Lydian for dreamy
- INSTRUMENTATION: acoustic guitar, piano, strings quartet, flute, violin, tabla, harmonium
- VOCAL STYLE: Soulful (Arijit style), melodious (Shreya style), passionate (Atif style)
- ARRANGEMENT: Verse-chorus-verse-bridge-chorus with emotional builds
- ATMOSPHERE: Intimate, cinematic, nostalgic, dreamy

ANIME/J-ROCK FUSION STYLE (Suzume/RADWIMPS inspired):
- Piano-driven emotional melodies with orchestral swells
- Japanese rock guitars blending with sweeping strings
- Ethereal, dreamy atmosphere with powerful emotional builds
- Gentle verses building to explosive choruses
- Dynamic shifts from whisper-soft to powerful crescendos

LYRIC STRUCTURE GUIDANCE:
- FIRST 15-20 SECONDS (Hook/Intro): Direct, relatable emotion
  * "Woh message jo tune nahi padhi..." (That message you never read)
  * "Tumhare bina yeh raat..." (Without you, this night...)
  * "Phir wahi khamoshi..." (That same silence again)
- LATER LYRICS: Poetic, metaphorical, deeper meaning
  * Rain as tears, silence as a character
  * Memories as ghosts, distance as time
`;

/**
 * Lyric guidance examples for different emotions
 * First 15-20s = direct, relatable hook
 * Later = poetic, metaphorical
 */
export const LYRIC_GUIDANCE: Record<string, { hook: string[]; poetic: string[] }> = {
  heartbreak: {
    hook: [
      'Woh message jo tune nahi padhi, usme meri jaan thi',
      'Tumhare bina yeh raat kitni lambi hai',
      'Teri aakhri goodbye abhi bhi yaad hai',
      'Phir wahi khamoshi, phir wahi dard',
    ],
    poetic: [
      'Baarish ki boondein bhi roti hain mujhe yaad karke',
      'Khamoshi bhi ab bolti hai teri baatein',
      'Yaadein bhoot ban gayi hain mere kamre mein',
      'Waqt ne sab kuch badal diya, sirf dard wahi hai',
    ],
  },
  longDistance: {
    hook: [
      'Kitne miles door ho, par dil ke paas ho',
      'Screen pe tera chehra, haathon mein kuch nahi',
      'Teri awaaz sunne ko tarasta hai dil',
      'Subah teri shaam hai, aur meri shaam tera kal',
    ],
    poetic: [
      'Chaand wahi hai, aasmaan alag hai',
      'Tumse bichhadkar lamha lamha toot ta hai',
      'Dooriyan bhi ab ek rishta ban gayi hain',
      'Tera khayaal hi mera saathi hai raaton mein',
    ],
  },
  nightRomance: {
    hook: [
      'Raat ke 3 baje, sirf tu yaad hai',
      'Neend nahi aati, teri baatein yaad aati hain',
      'Chhad pe baithke taaron ko dekha',
      'Gaadi mein chalte hue, haath mein tera haath',
    ],
    poetic: [
      'Chaandni raat mein tera chehra dikhta hai',
      'Sitaaron ne dekhi hai humari kahani',
      'Raat ki khamoshi mein tera naam goonjta hai',
      'Teri yaad chandni ban ke bikhar gayi',
    ],
  },
  firstLove: {
    hook: [
      'Pehli baar tumhe dekha tha tab...',
      'College ke woh din, teri ek jhalak',
      'Bus mein teri nazarein mili thi',
      'Library mein chupke chupke tujhe dekha karta tha',
    ],
    poetic: [
      'Phool bhi sharmaate hain jab tu muskurati hai',
      'Titliyon ne bataya tera naam mujhe',
      'Sapne bhi ab rangin ho gaye hain',
      'Dil ki dharkan mein tera naam likha hai',
    ],
  },
};

/**
 * Get lyric guidance for a theme's emotional type
 */
export function getLyricGuidance(playlistTag: string): { hook: string; poetic: string } {
  const mapping: Record<string, keyof typeof LYRIC_GUIDANCE> = {
    sad: 'heartbreak',
    night: 'nightRomance',
    first_love: 'firstLove',
    other: 'firstLove', // default fallback
  };
  
  const key = mapping[playlistTag] || 'heartbreak';
  const guidance = LYRIC_GUIDANCE[key];
  
  return {
    hook: guidance.hook[Math.floor(Math.random() * guidance.hook.length)],
    poetic: guidance.poetic[Math.floor(Math.random() * guidance.poetic.length)],
  };
}

/**
 * Emotion Intensity Adjustment Modifiers
 * High: Slow, powerful, raw emotion
 * Medium: Balanced, flowing
 * Low: Soft, sweet, gentle
 */
export type EmotionIntensity = 'high' | 'medium' | 'low';

export const INTENSITY_MODIFIERS: Record<EmotionIntensity, {
  tempo: string;
  vocalStyle: string;
  arrangement: string;
  dynamics: string;
}> = {
  high: {
    tempo: 'slow 60-70 BPM, heavy emotional weight',
    vocalStyle: 'raw soulful vocals, tears in voice, powerful Arijit-like delivery',
    arrangement: 'sparse to powerful builds, cinematic crescendos',
    dynamics: 'whisper soft verses exploding into powerful chorus',
  },
  medium: {
    tempo: 'mid-tempo 80-90 BPM, flowing rhythm',
    vocalStyle: 'melodious warm vocals, emotional but controlled',
    arrangement: 'balanced orchestration, gentle builds',
    dynamics: 'smooth emotional flow, steady intensity',
  },
  low: {
    tempo: 'gentle 70-80 BPM, sweet and soft',
    vocalStyle: 'soft sweet vocals, innocent and pure',
    arrangement: 'delicate instrumentation, acoustic warmth',
    dynamics: 'soft throughout, dreamy and light',
  },
};

/**
 * Quick prompt enhancement using templates
 * No external AI needed - fast and reliable
 */
export function quickEnhancePrompt(
  theme: string,
  emotion: string,
  instruments: string,
  intensity: EmotionIntensity = 'medium'
): string {
  const mod = INTENSITY_MODIFIERS[intensity];
  
  const templates = [
    `Romantic Hindi song about ${emotion}. ${instruments}. ${mod.vocalStyle}, ${mod.tempo}, ${mod.arrangement}.`,
    `Hindi love song capturing ${emotion}. ${instruments}. ${mod.vocalStyle}, ${mod.tempo}, ${mod.dynamics}.`,
    `Emotional Hindi romantic track about ${emotion}. ${instruments}. ${mod.vocalStyle}, ${mod.arrangement}, Bollywood style.`,
    `Soulful Hindi ballad expressing ${emotion}. ${instruments}. ${mod.tempo}, ${mod.dynamics}, romantic mood.`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate a concise music prompt for Suno (max 200 chars)
 * Now includes anime music fusion elements and emotion intensity
 */
export function generateSunoPrompt(
  theme: string,
  emotion: string,
  style: string,
  intensity: EmotionIntensity = 'medium'
): string {
  // Randomly decide if this should have anime fusion style (40% chance)
  const useAnimeStyle = Math.random() < 0.4;
  const mod = INTENSITY_MODIFIERS[intensity];
  
  // Get intensity-specific descriptor
  const intensityDesc = intensity === 'high' ? 'slow, emotional, powerful'
    : intensity === 'low' ? 'soft, gentle, sweet'
    : 'melodious, flowing';
  
  let prompt: string;
  
  if (useAnimeStyle) {
    // Anime-inspired romantic Hindi song
    const animeElements = [
      'piano and orchestral strings',
      'emotional rock guitars with strings',
      'ethereal synths and piano',
      'cinematic orchestral build',
    ];
    const animeElement = animeElements[Math.floor(Math.random() * animeElements.length)];
    prompt = `Hindi romantic song, ${emotion}. ${animeElement}. ${intensityDesc}. Anime OST style.`;
  } else {
    // Traditional Bollywood style
    prompt = `Hindi romantic song about ${emotion}. ${style}. ${intensityDesc}. Bollywood vocals.`;
  }
  
  // Truncate if needed
  if (prompt.length > 200) {
    return prompt.substring(0, 197) + '...';
  }
  return prompt;
}

/**
 * Generate detailed production prompt (for display/reference)
 */
export function generateDetailedPrompt(
  theme: string,
  emotion: string,
  setting: string,
  style: { description: string; tempo: string; instruments: string }
): string {
  // Randomly decide production style (60% Bollywood, 40% Anime fusion)
  const useAnimeStyle = Math.random() < 0.4;
  
  if (useAnimeStyle) {
    return [
      `A romantic Hindi song about ${emotion}`,
      `set in ${setting}.`,
      `Style: Anime film soundtrack fusion with Hindi vocals,`,
      `piano-driven melody with orchestral strings,`,
      `featuring emotional rock guitars, sweeping strings, grand piano, ambient synths.`,
      `Japanese anime OST production style - ethereal and cinematic.`,
      `Emotional vocals with powerful builds,`,
      `gentle verses building to explosive chorus,`,
      `dynamic shifts from intimate to powerful crescendo.`,
      `Blend of Bollywood romance with anime soundtrack grandeur,`,
      `2:30-3 minutes long.`,
    ].join(' ');
  }
  
  return [
    `A romantic Hindi song about ${emotion}`,
    `set in ${setting}.`,
    `Style: ${style.description},`,
    `${style.tempo} tempo,`,
    `featuring ${style.instruments}.`,
    `Soulful vocals with emotional delivery,`,
    `beautiful melodic hooks,`,
    `intimate arrangement building to emotional crescendo.`,
    `Bollywood romantic ballad quality,`,
    `2:30-3 minutes long.`,
  ].join(' ');
}

/**
 * Generate anime-style image prompt
 */
export function generateAnimeImagePrompt(
  scene: string,
  colorMood: string
): string {
  const artStyles = [
    'Makoto Shinkai style',
    'Your Name movie aesthetic',
    'Suzume visual style',
    'studio ghibli inspired',
  ];
  
  const lightingOptions = [
    'golden hour with dramatic clouds',
    'soft blue hour light with city lights',
    'romantic sunset glow with lens flare',
    'dreamy morning light rays',
    'magical twilight sky with stars',
  ];
  
  const artStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
  const lighting = lightingOptions[Math.floor(Math.random() * lightingOptions.length)];
  
  return [
    scene,
    colorMood,
    lighting,
    `high quality anime illustration, ${artStyle}`,
    'beautiful detailed background',
    'anime couple silhouettes or back view only',
    'no visible faces',
    'emotional romantic atmosphere',
    'album cover art square format 1:1',
    'no text no logos',
    '8k quality',
  ].join(', ');
}
