import { SongCategory } from '@/types';

/**
 * 6 AI Music Categories for Autopilot Growth
 * 
 * Categories 1-5: Evergreen (always relevant)
 * Category 6: Trending/Topical (festivals, events, news)
 * 
 * ALL MUSIC IS IN HINDI/HINGLISH
 */

export const MUSIC_CATEGORIES: SongCategory[] = [
  {
    id: 'quiet-motivation',
    name: 'Quiet Motivation',
    description: 'Calm, internal motivation. No cringe speeches. Silent determination energy.',
    genres: ['ambient', 'minimal', 'atmospheric', 'soft electronic'],
    moods: ['determined', 'focused', 'calm', 'hopeful', 'grounded'],
    imagePromptHints: [
      'silhouette of person at sunrise',
      'empty road at dawn',
      'quiet morning coffee scene',
      'person looking at city lights',
      'minimal workspace with warm light',
    ],
  },
  {
    id: 'safar-journey',
    name: 'Safar / Journey',
    description: 'Timeless journey music. Movement, not destination. Perfect for Safar-Vaani brand.',
    genres: ['cinematic', 'ambient', 'world fusion', 'atmospheric'],
    moods: ['nostalgic', 'curious', 'hopeful', 'wandering', 'reflective'],
    imagePromptHints: [
      'endless highway at sunset',
      'train window with passing landscapes',
      'traveler silhouette against mountains',
      'winding road through valleys',
      'boat on calm waters at dusk',
    ],
  },
  {
    id: 'late-night-2am',
    name: 'Late Night / 2AM',
    description: '2AM vibes. Sleepless nights, calm loneliness, heavy thoughts but peaceful.',
    genres: ['lo-fi', 'ambient', 'chillhop', 'soft electronic'],
    moods: ['solitary', 'peaceful', 'melancholic', 'thoughtful', 'calm'],
    imagePromptHints: [
      'city lights from window at night',
      'empty street with soft lights',
      'moon through clouds',
      'cozy room with dim lamp',
      'rain on window at night',
    ],
  },
  {
    id: 'cinematic-score',
    name: 'Cinematic Background',
    description: 'Universal film score vibes. No story, only feel. Language-agnostic.',
    genres: ['cinematic', 'orchestral', 'epic ambient', 'modern classical'],
    moods: ['anticipation', 'depth', 'serious', 'powerful', 'emotional'],
    imagePromptHints: [
      'dramatic clouds over landscape',
      'silhouette against epic sky',
      'vast desert with lone figure',
      'mountain peak at golden hour',
      'dramatic ocean waves',
    ],
  },
  {
    id: 'calm-focus',
    name: 'Calm Focus / Work',
    description: 'Background music for deep work. Coding, studying, reading. Long listening sessions.',
    genres: ['ambient', 'minimal', 'electronic', 'soft piano'],
    moods: ['focused', 'clear', 'balanced', 'flowing', 'steady'],
    imagePromptHints: [
      'minimal desk with warm lighting',
      'coffee and notebook aesthetic',
      'rain on window with cozy interior',
      'peaceful library corner',
      'sunrise over calm water',
    ],
  },
  {
    id: 'trending-topical',
    name: 'Trending / Desh Ki Baat',
    description: 'Topical songs on festivals, events, news. Republic Day, Diwali, current affairs. Viral potential.',
    genres: ['patriotic', 'folk fusion', 'pop', 'anthem style'],
    moods: ['proud', 'emotional', 'united', 'celebratory', 'powerful'],
    imagePromptHints: [
      'Indian flag waving majestically',
      'diverse Indian faces united',
      'Indian landmarks at sunset',
      'festival celebration lights',
      'soldiers silhouette at border',
    ],
  },
];

/**
 * Dynamic Parameter Pools for Unique Song Generation
 * These are combined randomly to create infinite variations
 */

export const EMOTION_POOLS: Record<string, string[]> = {
  'quiet-motivation': [
    'quiet determination',
    'inner strength',
    'calm confidence',
    'silent perseverance',
    'gentle resolve',
    'patient ambition',
    'steady courage',
  ],
  'safar-journey': [
    'nostalgic wandering',
    'curious exploration',
    'bittersweet memories',
    'hopeful uncertainty',
    'peaceful movement',
    'endless possibility',
    'gentle discovery',
  ],
  'late-night-2am': [
    'calm solitude',
    'peaceful overthinking',
    'soft melancholy',
    'quiet acceptance',
    'gentle loneliness',
    'thoughtful silence',
    'serene insomnia',
  ],
  'cinematic-score': [
    'rising anticipation',
    'quiet intensity',
    'emotional depth',
    'subtle power',
    'controlled drama',
    'profound moment',
    'silent climax',
  ],
  'calm-focus': [
    'mental clarity',
    'deep concentration',
    'effortless flow',
    'quiet productivity',
    'balanced focus',
    'steady presence',
    'peaceful engagement',
  ],
  'trending-topical': [
    'deshbhakti (patriotism)',
    'unity and pride',
    'celebration and joy',
    'emotional tribute',
    'fighting spirit',
    'hope for nation',
    'cultural pride',
  ],
};

export const TIME_SETTINGS: Record<string, string[]> = {
  'quiet-motivation': [
    'early morning before anyone wakes',
    '5 AM when the world is silent',
    'late night solo session',
    'sunrise just breaking through',
    'quiet evening alone',
  ],
  'safar-journey': [
    'endless road at sunset',
    'train journey through countryside',
    'long drive at dusk',
    'walking through unknown city',
    'boat ride at golden hour',
  ],
  'late-night-2am': [
    '2 AM in a quiet room',
    'midnight with city lights outside',
    '3 AM unable to sleep',
    'late night with rain outside',
    'silent hours before dawn',
  ],
  'cinematic-score': [
    'moment before something changes',
    'silent scene with no dialogue',
    'turning point in a story',
    'final moments of a journey',
    'beginning of something new',
  ],
  'calm-focus': [
    'productive morning hours',
    'deep work session',
    'afternoon concentration',
    'study night with coffee',
    'creative flow state',
  ],
  'trending-topical': [
    'national celebration moment',
    'emotional tribute scene',
    'pride of the nation',
    'unity in diversity',
    'historical remembrance',
  ],
};

export const ENERGY_LEVELS: string[] = [
  'slow and minimal',
  'gradual build',
  'steady and consistent',
  'soft and airy',
  'gentle progression',
  'controlled intensity',
  'subtle layering',
];

export const SOUND_TEXTURES: Record<string, string[]> = {
  'quiet-motivation': [
    'warm ambient pads',
    'soft piano with reverb',
    'gentle synth layers',
    'minimal beats',
    'subtle bass undertones',
  ],
  'safar-journey': [
    'wide cinematic pads',
    'world instrument hints',
    'layered strings',
    'atmospheric guitar',
    'evolving soundscapes',
  ],
  'late-night-2am': [
    'lo-fi textures',
    'soft vinyl crackle',
    'mellow piano',
    'gentle rain ambience',
    'warm analog synths',
  ],
  'cinematic-score': [
    'orchestral swells',
    'deep brass undertones',
    'sweeping strings',
    'powerful percussion',
    'epic atmosphere',
  ],
  'calm-focus': [
    'consistent ambient drone',
    'soft piano loops',
    'minimal electronic',
    'nature sounds blend',
    'gentle white noise texture',
  ],
  'trending-topical': [
    'dhol and Indian drums',
    'patriotic orchestra',
    'folk instruments fusion',
    'powerful anthem style',
    'traditional meets modern',
  ],
};

/**
 * Engaging hook texts for shorts (Hindi/Hinglish)
 */
export const HOOK_TEXTS: Record<string, string[]> = {
  'quiet-motivation': [
    'Jab duniya so rahi ho... 🌅',
    'Khamoshi mein taakat hai... 💪',
    'Apne sapno ke liye... ✨',
    'No one knows I\'m grinding... 🔥',
    'Silent progress hits different...',
  ],
  'safar-journey': [
    'Safar abhi baaki hai... 🛤️',
    'Manzil se zyada safar... 🌄',
    'Kahan ja rahe ho tum? 🚗',
    'The journey continues... ✨',
    'Raaste badal jaate hain... 🌅',
  ],
  'late-night-2am': [
    '2 AM thoughts hit different... 🌙',
    'Neend nahi aati? Same... 💭',
    'Raat ke raaz... 🌃',
    'Kya soch rahe ho? 🤔',
    'When the world sleeps... 🌙',
  ],
  'cinematic-score': [
    'Feel this moment... 🎬',
    'No words needed... ✨',
    'Close your eyes... 🎭',
    'Imagine your movie... 🎥',
    'This hits different... 💫',
  ],
  'calm-focus': [
    'Focus mode: ON 🎧',
    'Deep work vibes... 💻',
    'Productivity unlocked... 🔓',
    'Zone mein aa jao... 🧠',
    'Study with me... 📚',
  ],
  'trending-topical': [
    'Jai Hind! 🇮🇳',
    'Mera Bharat Mahan! 🇮🇳',
    'Desh ke liye... ❤️',
    'Proud to be Indian! 🇮🇳',
    'Vande Mataram! 🙏',
  ],
};

/**
 * Get random item from array
 */
export function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): SongCategory | undefined {
  return MUSIC_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get random category
 */
export function getRandomCategory(): SongCategory {
  return getRandomItem(MUSIC_CATEGORIES);
}

// Alias for backward compatibility
export const SONG_CATEGORIES = MUSIC_CATEGORIES;

/**
 * Indian Events Calendar for Trending/Topical Category
 * Format: { month: day } => event details
 */
export interface IndianEvent {
  name: string;
  nameHindi: string;
  type: 'national' | 'festival' | 'cultural' | 'sports';
  themes: string[];
  titleIdeas: string[];
}

export const INDIAN_EVENTS: Record<string, IndianEvent> = {
  // National Days
  '1-26': {
    name: 'Republic Day',
    nameHindi: 'Gantantra Diwas',
    type: 'national',
    themes: ['constitution', 'democracy', 'freedom', 'unity', 'soldiers tribute'],
    titleIdeas: ['Gantantra Diwas', '26 January', 'Mera Bharat', 'Tiranga', 'Jai Hind'],
  },
  '8-15': {
    name: 'Independence Day',
    nameHindi: 'Swatantrata Diwas',
    type: 'national',
    themes: ['freedom fighters', 'independence', 'sacrifice', 'patriotism', 'national pride'],
    titleIdeas: ['Azaadi', '15 August', 'Vande Mataram', 'Inquilab', 'Shaheedon Ko Salaam'],
  },
  '10-2': {
    name: 'Gandhi Jayanti',
    nameHindi: 'Gandhi Jayanti',
    type: 'national',
    themes: ['non-violence', 'peace', 'truth', 'simplicity', 'freedom struggle'],
    titleIdeas: ['Bapu', 'Ahimsa', 'Satya Ki Raah', 'Gandhi Ji', 'Sabarmati'],
  },
  // Major Festivals
  '10-24': { // Approximate - Diwali moves
    name: 'Diwali',
    nameHindi: 'Deepawali',
    type: 'festival',
    themes: ['light over darkness', 'celebration', 'family', 'prosperity', 'new beginnings'],
    titleIdeas: ['Deepon Ki Roshni', 'Diwali Nights', 'Khushiyon Ka Tyohar', 'Lakshmi Puja'],
  },
  '3-25': { // Approximate - Holi moves
    name: 'Holi',
    nameHindi: 'Holi',
    type: 'festival',
    themes: ['colors', 'celebration', 'forgiveness', 'spring', 'joy'],
    titleIdeas: ['Rang Barse', 'Holi Hai', 'Gulaal', 'Rang De', 'Balam Pichkari'],
  },
  '11-1': { // Approximate - Eid moves
    name: 'Eid',
    nameHindi: 'Eid',
    type: 'festival',
    themes: ['celebration', 'unity', 'blessings', 'family', 'gratitude'],
    titleIdeas: ['Eid Mubarak', 'Chand Raat', 'Khushiyan', 'Pyaar Ki Eid'],
  },
  '8-29': {
    name: 'Raksha Bandhan',
    nameHindi: 'Raksha Bandhan',
    type: 'festival',
    themes: ['sibling love', 'protection', 'bond', 'family', 'tradition'],
    titleIdeas: ['Bhai Behan', 'Rakhi', 'Phoolon Ka Taaro Ka', 'Meri Behna'],
  },
  '10-12': { // Approximate - Navratri
    name: 'Navratri',
    nameHindi: 'Navratri',
    type: 'festival',
    themes: ['divine feminine', 'dance', 'celebration', 'devotion', 'garba'],
    titleIdeas: ['Navratri Nights', 'Garba Queen', 'Mata Ki Bhakti', 'Dandiya'],
  },
  // Sports
  '4-2': { // IPL Season approximate
    name: 'IPL Season',
    nameHindi: 'IPL',
    type: 'sports',
    themes: ['cricket', 'team spirit', 'competition', 'passion', 'victory'],
    titleIdeas: ['Cricket Fever', 'IPL Anthem', 'Chakka Maar', 'Team India'],
  },
  // Army Day
  '1-15': {
    name: 'Army Day',
    nameHindi: 'Sena Diwas',
    type: 'national',
    themes: ['soldiers', 'sacrifice', 'bravery', 'protection', 'tribute'],
    titleIdeas: ['Fauji', 'Sarhad', 'Veer Jawan', 'Border Pe', 'Salaam'],
  },
  // Kargil Vijay Diwas
  '7-26': {
    name: 'Kargil Vijay Diwas',
    nameHindi: 'Kargil Vijay Diwas',
    type: 'national',
    themes: ['victory', 'soldiers', 'sacrifice', 'courage', 'mountain warfare'],
    titleIdeas: ['Kargil Heroes', 'Vijay', 'Shaheedon Ko', 'Himmat'],
  },
};

/**
 * Get current or upcoming Indian event (within 15 days)
 */
export function getCurrentEvent(): IndianEvent | null {
  const today = new Date();
  const checkDays = 15; // Look 15 days ahead
  
  for (let i = 0; i <= checkDays; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const key = `${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    
    if (INDIAN_EVENTS[key]) {
      return INDIAN_EVENTS[key];
    }
  }
  
  return null;
}

/**
 * Get a random event for when no current event
 */
export function getRandomEvent(): IndianEvent {
  const events = Object.values(INDIAN_EVENTS);
  return getRandomItem(events);
}

/**
 * Custom trending topics (can be manually added)
 * For news-based content like tensions, achievements, etc.
 */
export const CUSTOM_TRENDING_TOPICS: IndianEvent[] = [
  {
    name: 'Soldier Tribute',
    nameHindi: 'Jawan Ko Salaam',
    type: 'national',
    themes: ['army', 'sacrifice', 'border', 'family of soldier', 'patriotism'],
    titleIdeas: ['Maa Ka Jawan', 'Border Se', 'Shaheed', 'Tiranga Zindabad', 'Fauji Ki Zindagi'],
  },
  {
    name: 'India Pride',
    nameHindi: 'Bharat Gaurav',
    type: 'national',
    themes: ['achievement', 'global recognition', 'proud moment', 'unity'],
    titleIdeas: ['Bharat Ki Shaan', 'Hamara India', 'Vishwa Guru', 'Mera Desh'],
  },
  {
    name: 'Unity Message',
    nameHindi: 'Ekta Ka Sandesh',
    type: 'cultural',
    themes: ['hindu-muslim unity', 'diversity', 'brotherhood', 'peace', 'harmony'],
    titleIdeas: ['Ek Hain Hum', 'Bhai Bhai', 'Milke Rahenge', 'Insaniyat', 'Pyaar Ki Jeet'],
  },
];
