/**
 * Romantic Hindi Music Configuration
 * 
 * Research-based prompt generation inspired by legendary Hindi artists
 * With anime romantic couple visuals
 */

/**
 * Reference Artists - Research from the best
 */
export const REFERENCE_ARTISTS = {
  lyricists: {
    // Gulzar - poetic, metaphorical, nature imagery
    gulzar: {
      name: 'Gulzar',
      style: 'poetic metaphors, nature imagery, deep emotions',
      keywords: ['mausam', 'baarish', 'panchhi', 'raahein', 'khwaab', 'aankhein'],
      signature: 'Uses rain, birds, and roads as metaphors for love',
    },
    // Javed Akhtar - direct emotional, relatable
    javedAkhtar: {
      name: 'Javed Akhtar',
      style: 'direct emotions, relatable feelings, conversational',
      keywords: ['dil', 'pyaar', 'mohabbat', 'zindagi', 'tera', 'mera'],
      signature: 'Simple yet profound expressions of love',
    },
    // Irshad Kamil - modern romance, urban love
    irshadKamil: {
      name: 'Irshad Kamil',
      style: 'modern romance, urban feelings, contemporary',
      keywords: ['ishq', 'junoon', 'awargi', 'bekhudi', 'raat', 'subah'],
      signature: 'Modern love stories with poetic touch',
    },
    // Prasoon Joshi - intense, philosophical
    prasoonJoshi: {
      name: 'Prasoon Joshi',
      style: 'intense emotions, philosophical depth, powerful',
      keywords: ['rooh', 'jazba', 'ehsaas', 'lamha', 'safar', 'manzil'],
      signature: 'Deep philosophical approach to love',
    },
    // Amitabh Bhattacharya - playful, catchy, relatable
    amitabhBhattacharya: {
      name: 'Amitabh Bhattacharya',
      style: 'playful, catchy, youth-oriented, relatable',
      keywords: ['cute', 'crazy', 'pagal', 'deewana', 'ashiqui'],
      signature: 'Fun, catchy, and instantly relatable',
    },
  },

  musicDirectors: {
    // A.R. Rahman - soulful, innovative, layered
    arRahman: {
      name: 'A.R. Rahman',
      style: 'soulful melodies, innovative arrangements, layered harmonies',
      instruments: ['strings', 'flute', 'piano', 'choir', 'electronic elements'],
      signature: 'Spiritual and transcendent musical experience',
    },
    // Pritam - catchy hooks, emotional, mainstream
    pritam: {
      name: 'Pritam',
      style: 'catchy melodies, emotional hooks, mainstream appeal',
      instruments: ['guitar', 'strings', 'drums', 'piano', 'electronic beats'],
      signature: 'Hummable tunes with emotional depth',
    },
    // Amit Trivedi - folk fusion, experimental, raw
    amitTrivedi: {
      name: 'Amit Trivedi',
      style: 'folk fusion, experimental, raw energy',
      instruments: ['folk instruments', 'guitars', 'unconventional sounds'],
      signature: 'Fresh and unconventional romantic sounds',
    },
    // Vishal-Shekhar - energetic, youth, party + romantic
    vishalShekhar: {
      name: 'Vishal-Shekhar',
      style: 'energetic, youth-oriented, versatile',
      instruments: ['electronic', 'guitars', 'drums', 'synths'],
      signature: 'Modern sound with mass appeal',
    },
    // Shankar-Ehsaan-Loy - rock ballads, anthemic, powerful
    shankarEhsaanLoy: {
      name: 'Shankar-Ehsaan-Loy',
      style: 'rock ballads, anthemic, powerful emotions',
      instruments: ['rock guitars', 'powerful drums', 'strings', 'piano'],
      signature: 'Grand, cinematic romantic songs',
    },
  },

  singers: {
    arijitSingh: { name: 'Arijit Singh', style: 'soulful, emotional, versatile' },
    shreyaGhoshal: { name: 'Shreya Ghoshal', style: 'melodious, classical touch, emotive' },
    kk: { name: 'KK', style: 'romantic, soft, heartfelt' },
    mohitChauhan: { name: 'Mohit Chauhan', style: 'raw, emotional, earthy' },
    atifAslam: { name: 'Atif Aslam', style: 'passionate, intense, romantic' },
  },
};

/**
 * Romantic Themes - Weighted selection for YouTube growth
 * Distribution: Sad/Heartbreak 45%, Night Romance 30%, First Love 15%, Other 10%
 */
export interface RomanticTheme {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  emotions: string[];
  settings: string[];
  colorMood: string;
  animeScenes: string[];
  // NEW: Growth optimization properties
  weight: number; // Selection weight (higher = more likely)
  emotionIntensity: 'high' | 'medium' | 'low'; // For prompt adjustment
  playlistTag: 'sad' | 'night' | 'first_love' | 'other'; // For YouTube playlist
}

export const ROMANTIC_THEMES: RomanticTheme[] = [
  // ============================================
  // SAD / HEARTBREAK / LONGING (45% total)
  // ============================================
  {
    id: 'heartbreak',
    name: 'Heartbreak / Dard',
    nameHindi: 'Dard-e-Dil',
    description: 'Pain of separation and heartbreak',
    emotions: ['longing', 'memories', 'tears', 'empty feeling', 'moving on'],
    settings: ['rainy night', 'empty room', 'old photos', 'walking alone', 'sleepless nights'],
    colorMood: 'blue tones, rain aesthetic, melancholic grey',
    animeScenes: [
      'anime girl looking at rain through window, sad expression, blue tones',
      'anime boy sitting alone on bench, city rain, melancholic mood',
      'anime couple silhouettes walking apart, sunset, bittersweet',
      'anime character holding old photo, tears, soft lighting',
    ],
    weight: 25, // 25% - highest priority
    emotionIntensity: 'high',
    playlistTag: 'sad',
  },
  {
    id: 'long-distance',
    name: 'Long Distance / Dooriyan',
    nameHindi: 'Dooriyan',
    description: 'Love across distances, waiting and longing',
    emotions: ['missing', 'waiting', 'phone calls', 'counting days', 'hope'],
    settings: ['video call', 'train station', 'airport', 'looking at moon', 'letters'],
    colorMood: 'purple dusk, city lights, longing blue',
    animeScenes: [
      'anime couple on video call, different cities in background, night',
      'anime girl waiting at train station, sunset, anticipation',
      'anime couple looking at same moon from different places, split screen feel',
      'anime boy writing letter, night lamp, emotional',
    ],
    weight: 20, // 20% - total sad = 45%
    emotionIntensity: 'high',
    playlistTag: 'sad',
  },

  // ============================================
  // SOFT / NIGHT ROMANCE (30% total)
  // ============================================
  {
    id: 'night-romance',
    name: 'Night Romance / Raat Ki Baatein',
    nameHindi: 'Raat Ki Baatein',
    description: 'Late night conversations and intimate moments',
    emotions: ['intimate', 'deep talks', 'stargazing', 'secrets shared', 'peaceful'],
    settings: ['rooftop at night', 'late night drive', 'beach at night', 'terrace'],
    colorMood: 'deep night blue, city lights, starlight silver',
    animeScenes: [
      'anime couple lying on rooftop looking at stars, night sky, peaceful',
      'anime couple in car, night city drive, neon lights, romantic',
      'anime couple sitting on beach at night, moonlight on water',
      'anime couple on terrace, city lights below, intimate conversation',
    ],
    weight: 18, // 18%
    emotionIntensity: 'medium',
    playlistTag: 'night',
  },
  {
    id: 'deep-love',
    name: 'Deep Love / Gehri Mohabbat',
    nameHindi: 'Gehri Mohabbat',
    description: 'Intense, mature, consuming love',
    emotions: ['passionate', 'devoted', 'consuming', 'soulmates', 'eternal bond'],
    settings: ['quiet moments together', 'eyes meeting', 'holding hands', 'silent understanding'],
    colorMood: 'deep red, burgundy, intimate warm lighting',
    animeScenes: [
      'anime couple forehead touch, eyes closed, intimate moment, warm lighting',
      'anime couple holding hands close-up, city night lights background',
      'anime couple embracing, moonlight, emotional moment, soft focus',
      'anime couple looking into each other eyes, starry night, romantic',
    ],
    weight: 12, // 12% - total night = 30%
    emotionIntensity: 'medium',
    playlistTag: 'night',
  },

  // ============================================
  // FIRST LOVE (15%)
  // ============================================
  {
    id: 'first-love',
    name: 'First Love / Pehla Pyaar',
    nameHindi: 'Pehla Pyaar',
    description: 'The innocence and excitement of first love',
    emotions: ['butterflies', 'shy glances', 'nervous excitement', 'innocent crush', 'dreamy'],
    settings: ['college campus', 'school days', 'first meeting', 'library', 'bus ride'],
    colorMood: 'soft pink, cherry blossom, warm golden light',
    animeScenes: [
      'anime couple under cherry blossom tree, petals falling, soft pink lighting',
      'shy anime couple sitting on bench, sunset campus background, warm tones',
      'anime boy and girl exchanging glances, school rooftop, golden hour',
      'anime couple walking together, autumn leaves, gentle breeze',
    ],
    weight: 15, // 15%
    emotionIntensity: 'low',
    playlistTag: 'first_love',
  },

  // ============================================
  // OTHER ROMANTIC (10% total)
  // ============================================
  {
    id: 'monsoon-romance',
    name: 'Monsoon Romance / Baarish',
    nameHindi: 'Baarish Ka Mausam',
    description: 'Romantic rain and monsoon vibes',
    emotions: ['playful', 'getting wet together', 'cozy', 'nostalgic', 'fresh'],
    settings: ['rain on rooftop', 'chai pakoda', 'dancing in rain', 'sharing umbrella'],
    colorMood: 'grey skies, green freshness, warm chai tones',
    animeScenes: [
      'anime couple sharing umbrella in rain, city street, romantic lighting',
      'anime couple dancing in rain, joyful, water splashing, colorful',
      'anime couple on balcony watching rain, cozy mood, warm lighting',
      'anime couple running in rain holding hands, laughing, sunset rain',
    ],
    weight: 4, // 4%
    emotionIntensity: 'medium',
    playlistTag: 'other',
  },
  {
    id: 'confession',
    name: 'Confession / Izhaar',
    nameHindi: 'Dil Ki Baat',
    description: 'Moment of confessing love',
    emotions: ['nervous', 'hopeful', 'vulnerable', 'brave', 'heart racing'],
    settings: ['under tree', 'sunset', 'surprise moment', 'nervous preparation'],
    colorMood: 'warm sunset orange, hopeful golden, soft pink',
    animeScenes: [
      'anime boy confessing to girl, sunset background, nervous but brave',
      'anime girl blushing while receiving confession, cherry blossoms',
      'anime couple moment before kiss, sunset silhouette, romantic',
      'anime boy with flowers behind back, nervous expression, golden light',
    ],
    weight: 4, // 4%
    emotionIntensity: 'low',
    playlistTag: 'other',
  },
  {
    id: 'wedding-love',
    name: 'Wedding Love / Shaadi',
    nameHindi: 'Shaadi Ka Pyaar',
    description: 'Wedding romance and married love',
    emotions: ['celebration', 'forever together', 'sindoor', 'mangalsutra', 'promises'],
    settings: ['wedding ceremony', 'first night', 'sindoor moment', 'dance together'],
    colorMood: 'red and gold, festive, bright and warm',
    animeScenes: [
      'anime couple in Indian wedding attire, mandap, warm festive lighting',
      'anime bride and groom, sindoor ceremony, emotional moment',
      'anime couple doing wedding dance, colorful celebration',
      'anime newlywed couple, traditional dress, romantic pose',
    ],
    weight: 2, // 2% - total other = 10%
    emotionIntensity: 'low',
    playlistTag: 'other',
  },
];

/**
 * Music Style Templates - Based on research
 * Now includes Anime/J-Rock fusion styles
 */
export const MUSIC_STYLES = {
  soulful: {
    description: 'Soulful romantic ballad',
    tempo: 'slow to mid',
    instruments: 'piano, strings, soft drums, flute',
    reference: 'A.R. Rahman style',
  },
  energetic: {
    description: 'Upbeat romantic',
    tempo: 'mid to fast',
    instruments: 'guitars, drums, electronic elements',
    reference: 'Pritam style',
  },
  folk: {
    description: 'Folk fusion romantic',
    tempo: 'variable',
    instruments: 'folk instruments, acoustic, harmonium',
    reference: 'Amit Trivedi style',
  },
  classical: {
    description: 'Semi-classical romantic',
    tempo: 'slow',
    instruments: 'sitar, tabla, flute, strings',
    reference: 'Classical Bollywood',
  },
  modern: {
    description: 'Modern pop romantic',
    tempo: 'mid',
    instruments: 'synths, electronic, modern production',
    reference: 'Vishal-Shekhar style',
  },
  // NEW: Anime/J-Rock fusion styles (Suzume/RADWIMPS inspired)
  animeRock: {
    description: 'Japanese anime rock ballad with emotional builds',
    tempo: 'mid, building to powerful',
    instruments: 'piano, electric guitars, orchestral strings, powerful drums, synth pads',
    reference: 'Anime film soundtrack style - emotional J-rock with orchestral fusion',
  },
  animePiano: {
    description: 'Ethereal anime piano ballad with cinematic strings',
    tempo: 'slow to mid',
    instruments: 'grand piano, sweeping strings, gentle percussion, ambient synths',
    reference: 'Japanese anime OST style - dreamy piano-driven emotional soundtrack',
  },
  animeEpic: {
    description: 'Epic anime soundtrack with rock and orchestra fusion',
    tempo: 'building from slow to powerful',
    instruments: 'orchestra, rock guitars, taiko drums, choir, piano, synth layers',
    reference: 'Anime movie climax style - powerful emotional crescendo',
  },
};

/**
 * Title Generation Patterns
 */
export const ROMANTIC_TITLES = {
  patterns: [
    // Direct emotion titles
    'Tere Bina', 'Mere Sanam', 'Dil Mera', 'Tera Pyaar', 'Ishq Wala',
    // Poetic titles (Gulzar style)
    'Baarish Ki Bundein', 'Chandni Raatein', 'Sapno Ki Raani', 'Aankhon Mein Tu',
    // Modern titles (Irshad Kamil style)
    'Tu Hi Hai', 'Bas Tera Saath', 'Tujhe Dekh Ke', 'Dil Kahe',
    // Playful titles (Amitabh Bhattacharya style)
    'Pagal Dil', 'Crazy Love', 'Deewana Tera', 'Mast Magan',
    // Theme-based
    'Pehla Nasha', 'Raat Ki Rani', 'Baarish Mein', 'Door Se Paas',
  ],
  
  // Theme-specific title pools
  byTheme: {
    'first-love': ['Pehla Nasha', 'Pehli Nazar', 'Pehla Pyaar', 'Naya Ehsaas', 'Dhadkan'],
    'deep-love': ['Rooh Ka Rishta', 'Janam Janam', 'Tu Hi Mera', 'Hamesha', 'Tera Mera'],
    'heartbreak': ['Alvida', 'Tujhe Bhula Diya', 'Dard', 'Kaise Bhulau', 'Tanha Dil'],
    'monsoon-romance': ['Baarish', 'Rim Jhim', 'Bheegi Si', 'Pehli Baarish', 'Sawan'],
    'long-distance': ['Door Rehke', 'Teri Yaad', 'Intezaar', 'Mil Jaaye', 'Wapas Aa'],
    'night-romance': ['Raat Ka Nasha', 'Chandni Raat', 'Sitaaron Mein', 'Raaz'],
    'confession': ['Dil Ki Baat', 'Kehna Hai', 'I Love You', 'Izhaar', 'Bol Do'],
    'wedding-love': ['Meri Jaan', 'Saathiya', 'Mere Haathon', 'Phere', 'Dulhaniya'],
  },
};

/**
 * Get random theme using weighted selection
 * Distribution: Sad/Heartbreak 45%, Night Romance 30%, First Love 15%, Other 10%
 */
export function getRandomTheme(): RomanticTheme {
  const totalWeight = ROMANTIC_THEMES.reduce((sum, theme) => sum + theme.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const theme of ROMANTIC_THEMES) {
    random -= theme.weight;
    if (random <= 0) {
      return theme;
    }
  }
  
  // Fallback (shouldn't happen)
  return ROMANTIC_THEMES[0];
}

/**
 * Get theme by ID
 */
export function getThemeById(id: string): RomanticTheme | undefined {
  return ROMANTIC_THEMES.find(t => t.id === id);
}

/**
 * Get random lyricist reference
 */
export function getRandomLyricist() {
  const lyricists = Object.values(REFERENCE_ARTISTS.lyricists);
  return lyricists[Math.floor(Math.random() * lyricists.length)];
}

/**
 * Get random music director reference
 */
export function getRandomMusicDirector() {
  const directors = Object.values(REFERENCE_ARTISTS.musicDirectors);
  return directors[Math.floor(Math.random() * directors.length)];
}

/**
 * Get random anime scene for theme
 */
export function getRandomAnimeScene(theme: RomanticTheme): string {
  const scenes = theme.animeScenes;
  return scenes[Math.floor(Math.random() * scenes.length)];
}

/**
 * Get random title for theme
 */
export function getRandomTitle(themeId: string): string {
  const themeTitles = ROMANTIC_TITLES.byTheme[themeId as keyof typeof ROMANTIC_TITLES.byTheme];
  if (themeTitles) {
    return themeTitles[Math.floor(Math.random() * themeTitles.length)];
  }
  return ROMANTIC_TITLES.patterns[Math.floor(Math.random() * ROMANTIC_TITLES.patterns.length)];
}

/**
 * Get random music style
 */
export function getRandomMusicStyle() {
  const styles = Object.values(MUSIC_STYLES);
  return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * Playlist mappings for YouTube
 */
export const PLAYLIST_NAMES: Record<RomanticTheme['playlistTag'], { name: string; description: string }> = {
  sad: {
    name: 'Sad Hindi Love Songs 💔',
    description: 'Heartbreak, long distance, and emotional Hindi romantic songs with beautiful anime visuals.',
  },
  night: {
    name: 'Late Night Romantic Songs 🌙',
    description: 'Soft, intimate Hindi love songs perfect for late night listening. Anime couple aesthetics.',
  },
  first_love: {
    name: 'Pehla Pyaar - First Love Songs 🌸',
    description: 'Innocent and sweet Hindi songs about first love and butterflies. Anime romance vibes.',
  },
  other: {
    name: 'Hindi Romantic Songs Collection 💕',
    description: 'Beautiful Hindi romantic songs with stunning anime visuals. Love, celebration, and more.',
  },
};

/**
 * Get playlist info for a theme
 */
export function getPlaylistForTheme(theme: RomanticTheme): { name: string; description: string } {
  return PLAYLIST_NAMES[theme.playlistTag];
}
