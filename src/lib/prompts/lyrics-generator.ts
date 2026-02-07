/**
 * Professional Hindi Lyrics Generator
 * 
 * Generates song lyrics inspired by legendary Hindi lyricists:
 * - Gulzar (poetic imagery, metaphors, nature)
 * - Javed Akhtar (philosophical depth, storytelling)
 * - Prasoon Joshi (patriotic, emotional)
 * - Irshad Kamil (modern romance, conversational)
 * - Sameer (catchy, mass appeal)
 * - Sahir Ludhianvi (social commentary, romance)
 * 
 * These prompts are used with AI to generate professional-quality lyrics
 * in Hinglish (Hindi words in Roman script).
 */

import { RomanticTheme } from './romantic-config';

/**
 * Lyricist writing styles for inspiration
 */
const LYRICIST_STYLES: Record<string, {
  name: string;
  style: string;
  techniques: string[];
  signature: string;
}> = {
  gulzar: {
    name: 'Gulzar',
    style: 'poetic, metaphorical, nature imagery',
    techniques: [
      'Uses rain, trees, rivers as metaphors for emotions',
      'Creates visual poetry with everyday objects',
      'Layers meanings in simple words',
      'Paints pictures with words',
    ],
    signature: 'Mera kuch saamaan tumhare paas pada hai',
  },
  javed: {
    name: 'Javed Akhtar',
    style: 'philosophical, storytelling, deep',
    techniques: [
      'Explores philosophy through love',
      'Uses questions to evoke emotion',
      'Balance of simplicity and depth',
      'Strong narrative arc',
    ],
    signature: 'Tujhe dekha toh ye jana sanam',
  },
  irshad: {
    name: 'Irshad Kamil',
    style: 'modern, conversational, relatable',
    techniques: [
      'Contemporary language and references',
      'Conversational tone like talking to beloved',
      'Mix of Urdu elegance with Hindi simplicity',
      'Unexpected word combinations',
    ],
    signature: 'Matargashti, chal hatt',
  },
  prasoon: {
    name: 'Prasoon Joshi',
    style: 'emotional, patriotic, inspirational',
    techniques: [
      'Deep emotional resonance',
      'Universal themes of love and hope',
      'Simple yet powerful expressions',
      'Builds to emotional crescendo',
    ],
    signature: 'Maa tujhe salaam',
  },
  sameer: {
    name: 'Sameer',
    style: 'catchy, romantic, mass appeal',
    techniques: [
      'Memorable hook lines',
      'Rhyming patterns that stick',
      'Universal romantic expressions',
      'Easy to sing along',
    ],
    signature: 'Dhak dhak karne laga',
  },
};

/**
 * Theme-specific lyric elements
 */
const THEME_LYRIC_ELEMENTS: Record<string, {
  imagery: string[];
  emotions: string[];
  metaphors: string[];
  settings: string[];
}> = {
  'first-love': {
    imagery: ['first rain', 'butterflies', 'spring flowers', 'morning sun'],
    emotions: ['nervous excitement', 'innocent wonder', 'shy glances', 'racing heart'],
    metaphors: ['new morning', 'first bloom', 'untold story', 'blank page'],
    settings: ['college corridor', 'chai stall', 'park bench', 'rooftop'],
  },
  'deep-love': {
    imagery: ['eternal flame', 'two shadows', 'intertwined fingers', 'shared silence'],
    emotions: ['complete devotion', 'peaceful belonging', 'soul connection', 'unconditional trust'],
    metaphors: ['two rivers meeting', 'roots entangled', 'same heartbeat', 'old wine'],
    settings: ['home', 'kitchen together', 'old photograph', 'familiar street'],
  },
  'heartbreak': {
    imagery: ['empty room', 'unsent messages', 'fading photographs', 'rain on window'],
    emotions: ['hollowness', 'memories haunting', 'unanswered questions', 'learning to unlove'],
    metaphors: ['broken mirror', 'wilted flower', 'silent phone', 'cold coffee'],
    settings: ['their favorite spot', 'empty bed', 'old cafe', 'midnight'],
  },
  'monsoon-romance': {
    imagery: ['first rain drops', 'wet streets', 'thunder', 'petrichor'],
    emotions: ['playful joy', 'romantic tension', 'cozy warmth', 'nostalgia'],
    metaphors: ['clouds finally meeting', 'earth drinking sky', 'storm and shelter'],
    settings: ['shared umbrella', 'window watching rain', 'chai and pakoras', 'flooded streets'],
  },
  'long-distance': {
    imagery: ['phone screen glow', 'time zones', 'video calls', 'flight tickets'],
    emotions: ['yearning', 'counting days', 'love despite distance', 'virtual touch'],
    metaphors: ['same moon different sky', 'thread stretching but not breaking', 'heart knows no borders'],
    settings: ['airport', 'late night calls', 'separate cities', 'countdown calendars'],
  },
  'night-romance': {
    imagery: ['city lights', 'stars', 'moonlight', 'quiet streets'],
    emotions: ['intimate connection', 'secrets shared', 'peaceful love', 'midnight confessions'],
    metaphors: ['night that never ends', 'stars witness', 'darkness as comfort'],
    settings: ['rooftop stargazing', 'night drive', 'balcony conversations', '3 AM texts'],
  },
  'confession': {
    imagery: ['sunset colors', 'trembling hands', 'held breath', 'eyes meeting'],
    emotions: ['nervous courage', 'hope and fear', 'vulnerability', 'leap of faith'],
    metaphors: ['words trapped for years', 'heart speaking', 'now or never'],
    settings: ['sunset point', 'before goodbye', 'wedding venue', 'familiar bench'],
  },
  'wedding-love': {
    imagery: ['henna hands', 'gold jewelry', 'decorated pandal', 'pheras'],
    emotions: ['pure joy', 'family blessings', 'new beginning', 'promises made'],
    metaphors: ['two families becoming one', 'sacred fire witness', 'seven lifetimes'],
    settings: ['mandap', 'sangeet night', 'vidaai', 'first night'],
  },
};

/**
 * Song structure templates
 */
const SONG_STRUCTURES = {
  standard: ['Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Chorus'],
  simple: ['Verse 1', 'Chorus', 'Verse 2', 'Chorus'],
  storytelling: ['Intro', 'Verse 1', 'Verse 2', 'Chorus', 'Verse 3', 'Chorus', 'Outro'],
  emotional: ['Soft Verse', 'Building Verse', 'Emotional Chorus', 'Quiet Verse', 'Powerful Chorus'],
};

/**
 * Generate a prompt for AI to create professional lyrics
 * This prompt is sent to an LLM to generate the actual lyrics
 */
export function generateLyricsPrompt(theme: RomanticTheme, title: string): string {
  const themeElements = THEME_LYRIC_ELEMENTS[theme.id] || THEME_LYRIC_ELEMENTS['deep-love'];
  
  // Select a random lyricist style
  const lyricistKeys = Object.keys(LYRICIST_STYLES);
  const randomLyricist = LYRICIST_STYLES[lyricistKeys[Math.floor(Math.random() * lyricistKeys.length)]];
  
  const prompt = `Write professional Hindi romantic song lyrics for a song titled "${title}".

THEME: ${theme.nameHindi} (${theme.name})
MOOD: ${theme.emotions.join(', ')}

LYRICIST INSPIRATION: Write in the style of ${randomLyricist.name}
- Style: ${randomLyricist.style}
- Techniques: ${randomLyricist.techniques.join('; ')}

IMAGERY TO USE:
- ${themeElements.imagery.join(', ')}

EMOTIONS TO CONVEY:
- ${themeElements.emotions.join(', ')}

METAPHORS TO INCORPORATE:
- ${themeElements.metaphors.join(', ')}

IMPORTANT RULES:
1. Write in HINGLISH (Hindi words in Roman/English script, NOT Devanagari)
2. Structure: [Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Final Chorus]
3. Keep lines short (6-10 words max per line)
4. Make the chorus catchy and memorable
5. Use poetic imagery but keep it relatable
6. Include 2-3 powerful hook lines
7. Total length: 16-24 lines

STRUCTURE EXAMPLE:
[Verse 1]
Line 1
Line 2
Line 3
Line 4

[Chorus]
Hook line 1 (most memorable)
Hook line 2
Hook line 3

...continue with Verse 2, Bridge, Final Chorus...

Generate the complete lyrics now:`;

  return prompt;
}

/**
 * Generate a quick lyrics placeholder for Suno
 * This provides structure and emotion hints
 * Suno will generate the actual lyrics based on this
 */
export function generateQuickLyricsHint(theme: RomanticTheme, title: string): string {
  const themeElements = THEME_LYRIC_ELEMENTS[theme.id] || THEME_LYRIC_ELEMENTS['deep-love'];
  
  // Pick a few key elements
  const emotion = theme.emotions[Math.floor(Math.random() * theme.emotions.length)];
  const imagery = themeElements.imagery[Math.floor(Math.random() * themeElements.imagery.length)];
  const metaphor = themeElements.metaphors[Math.floor(Math.random() * themeElements.metaphors.length)];
  
  // Create a short, evocative hint for Suno
  return `${emotion}, ${imagery}, ${metaphor}. ${theme.nameHindi} theme. Poetic Hindi romance.`;
}

/**
 * Pre-generated professional lyrics templates
 * These can be customized per theme
 */
export function getProfessionalLyricsTemplate(theme: RomanticTheme, title: string): string {
  // Select based on theme
  const templates = LYRICS_TEMPLATES[theme.id] || LYRICS_TEMPLATES['deep-love'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Replace title placeholder
  return template.replace(/\{TITLE\}/g, title);
}

/**
 * Pre-crafted professional lyrics templates
 * Written in the style of legendary Hindi lyricists
 * Each template follows proper song structure
 */
const LYRICS_TEMPLATES: Record<string, string[]> = {
  'first-love': [
    `[Verse 1]
Pehli baar jab ankhen mili
Dhadkan ne kuch keh diya
Tere naam ka ek khat likha
Dil ne khud ko samjhaya

[Chorus]
Pehla pyaar hai yeh mera
Tujhe jaane kaisa lagta hai
Sapno mein bhi tera chehra
Dil yeh pagal sa ho gaya hai

[Verse 2]
Teri hansi mein dhoop hai
Teri baaton mein bahaar
Tu mili toh laga mujhe
Duniya mein koi gham nahi

[Chorus]
Pehla pyaar hai yeh mera
Tujhe jaane kaisa lagta hai
Sapno mein bhi tera chehra
Dil yeh pagal sa ho gaya hai

[Bridge]
Kya yeh mohabbat hai
Ya bas ek ehsaas
Jo bhi hai yeh hona chahta hoon
Tere paas tere paas

[Final Chorus]
Pehla pyaar hai yeh mera
Tu jo paas hai toh sab hai yahan
Sapno mein bhi tera chehra
Dil yeh sirf tera ho gaya hai`,
  ],
  
  'deep-love': [
    `[Verse 1]
Saath tere itne saal guzre
Ab tu meri har saans mein hai
Teri aankhon mein apna ghar dekha
Tu hi mera asman hai

[Chorus]
Tujhme hi basta hai mera jahan
Tu meri subah tu meri shaam
Bina tere main adhura sa hoon
Tu hi meri har dua ka mukaam

[Verse 2]
Jhurriyan bhi teri pyaari lagti hain
Safed baalon mein bhi rang hai
Tera haath thaame hue janam janam
Yeh mera sabse pyaara sapna hai

[Chorus]
Tujhme hi basta hai mera jahan
Tu meri subah tu meri shaam
Bina tere main adhura sa hoon
Tu hi meri har dua ka mukaam

[Bridge]
Duniya badal jaaye
Mausam badal jaaye
Mera pyaar tere liye
Kabhi na badlega

[Final Chorus]
Tujhme hi basta hai mera jahan
Janam janam saath nibhaunga
Bina tere main adhura sa hoon
Har janam mein tujhe dhundhunga`,
  ],
  
  'heartbreak': [
    `[Verse 1]
Teri yaadein ab bhi aati hain
Jab raat ki siyaahi ho
Khali kamra goonjta hai
Teri hansi ki goonj se

[Chorus]
Tujhe bhulana seekh raha hoon
Par dil abhi tayyar nahi
Teri jagah koi aur nahi
Yeh dard mera saathi hai

[Verse 2]
Woh coffee shop ab band hai
Jahan hum milte the roz
Woh bench bhi udaas lagti hai
Jaise koi apna kho diya ho

[Chorus]
Tujhe bhulana seekh raha hoon
Par dil abhi tayyar nahi
Teri jagah koi aur nahi
Yeh dard mera saathi hai

[Bridge]
Kya galti thi meri
Ya kismat hi aisi thi
Jo bhi tha ab nahi hai
Bas yaadein baaki hain

[Final Chorus]
Tujhe bhulana seekh raha hoon
Ek din yeh aansoo thehm jaayenge
Teri jagah koi aur nahi
Par main bhi jeena seekh jaunga`,
  ],
  
  'monsoon-romance': [
    `[Verse 1]
Pehli baarish ki boondon mein
Tera chehra dikha mujhe
Bheegi sadkon pe chal raha hoon
Tere khayal mein kho gaya

[Chorus]
Baarish mein tere saath
Bheegna chahta hoon main
Is mousam ki tarah
Pyaar mein doob jaana chahta hoon

[Verse 2]
Badal garje toh tujhe yaad kiya
Bijli chamke toh teri muskaan
Yeh baarish hamari kahaani hai
Tu mera monsoon ka tohfa hai

[Chorus]
Baarish mein tere saath
Bheegna chahta hoon main
Is mousam ki tarah
Pyaar mein doob jaana chahta hoon

[Bridge]
Chai ki chuski
Pakore ki khushbu
Khidki ke paas baith ke
Bas tujhe dekhna

[Final Chorus]
Baarish mein tere saath
Har monsoon tujhe yaad karunga
Is mousam ki tarah
Mere pyaar mein tum rahoge hamesha`,
  ],
  
  'long-distance': [
    `[Verse 1]
Screen pe tera naam dekha
Dil fir se machal gaya
Tu wahan main yahan
Par pyaar hai dono jagah

[Chorus]
Doori toh hai magar
Dil paas hai tere
Ek hi chaand dekhte hain hum
Alag asman ke neeche

[Verse 2]
Teri awaaz sunte hi
Raat din ban jaati hai
Countdown shuru hai wapas milne ka
Yeh intezaar bhi pyaara hai

[Chorus]
Doori toh hai magar
Dil paas hai tere
Ek hi chaand dekhte hain hum
Alag asman ke neeche

[Bridge]
Miles door bhi
Dil se paas hoon
Jab milenge phir
Tab tak sapne hain

[Final Chorus]
Doori mitegi ek din
Phir kabhi alag nahi honge
Ek hi chaand ke neeche
Saath saath rahenge hamesha`,
  ],
  
  'night-romance': [
    `[Verse 1]
Raat ke is sukoon mein
Sirf tu aur main hain
Taaron ki roshnai mein
Hamari kahaani likhi hai

[Chorus]
Raat bhar jaag ke
Tere saath rehna hai
Chaand bhi sharmaya hai
Dekh ke humein yun

[Verse 2]
City lights ki chamak mein
Teri aankhein chamakti hain
Is raat ko ruk jaane do
Subah kabhi na aaye

[Chorus]
Raat bhar jaag ke
Tere saath rehna hai
Chaand bhi sharmaya hai
Dekh ke humein yun

[Bridge]
3 baje ki baat hai
Kuch alag hi hoti hai
Dil khul ke bolta hai
Jo din mein chhupta hai

[Final Chorus]
Raat bhar jaag ke
Har raat tere saath bitaunga
Chaand bhi gawah hai
Hamara pyaar sachcha hai`,
  ],
  
  'confession': [
    `[Verse 1]
Bahut din ho gaye
Yeh baat dil mein rakhe hue
Aaj keh doon tujhse
Jo chhupta aaya hoon

[Chorus]
Tujhse pyaar karta hoon
Haan main yeh kehta hoon
Darr lagta hai
Par aaj bol dena tha

[Verse 2]
Pata nahi tu kya kahegi
Par chup rehna mushkil tha
Tere bina sochna mushkil hai
Tere bina jeena adhura hai

[Chorus]
Tujhse pyaar karta hoon
Haan main yeh kehta hoon
Darr lagta hai
Par aaj bol dena tha

[Bridge]
Haan ya na jo bhi kaho
Main intezaar karunga
Par yeh ehsaas
Chhupana mushkil tha

[Final Chorus]
Tujhse pyaar karta hoon
Sachchi baat keh di maine
Jo bhi ho ab tere dil mein
Main hamesha tera rahunga`,
  ],
  
  'wedding-love': [
    `[Verse 1]
Mehendi rachi hai tere naam se
Chunariya hai laal pyaari
Aaj ki raat khas hai
Tu meri hone wali hai

[Chorus]
Saat pheron ke baad
Tu meri ho jaayegi
Zindagi bhar ka vaada
Aaj main karta hoon

[Verse 2]
Do parivaaron ki khushiyan
Ek ghar mein basi hain
Tera haath maanga maine
Zindagi bhar ke liye

[Chorus]
Saat pheron ke baad
Tu meri ho jaayegi
Zindagi bhar ka vaada
Aaj main karta hoon

[Bridge]
Har sukh dukh mein
Tere saath rahunga
Yeh agni gawah hai
Mera har wada

[Final Chorus]
Saat pheron ke baad
Tu meri ho gayi hai
Zindagi bhar ka vaada
Nibhaunga main hamesha`,
  ],
};

/**
 * Get lyrics for a theme (uses template)
 * This provides high-quality pre-written lyrics
 */
export function getLyricsForTheme(theme: RomanticTheme, title: string): string {
  return getProfessionalLyricsTemplate(theme, title);
}

/**
 * Export for use in pipeline
 */
export { LYRICIST_STYLES, THEME_LYRIC_ELEMENTS };
