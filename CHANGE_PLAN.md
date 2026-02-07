# 🎯 Change Plan: YouTube Growth Optimization

> **Goal:** Optimize for early YouTube growth through emotional clarity, retention, and consistency  
> **Status:** Planning Phase - No changes implemented yet

---

## 📋 Table of Contents

1. [Theme Weighting System](#1-theme-weighting-system)
2. [Emotion Intensity Flag](#2-emotion-intensity-flag)
3. [Lyric Prompt Guidance](#3-lyric-prompt-guidance)
4. [Video Micro-Variations](#4-video-micro-variations)
5. [Shorts Selection Improvements](#5-shorts-selection-improvements)
6. [Playlist Support](#6-playlist-support)
7. [Comment Automation](#7-comment-automation)

---

## 1. Theme Weighting System

### Current State
- **File:** `src/lib/prompts/romantic-config.ts`
- **Function:** `getRandomTheme()` (line 323-326)
- **Current Behavior:** Equal probability for all 8 themes (12.5% each)

### Required Changes

**Target Distribution:**
- Sad/Heartbreak/Longing → **45%**
- Soft/Night Romance → **30%**
- First Love → **15%**
- Other Romantic Themes → **10%**

### Implementation Plan

#### Step 1: Add Weight Property to Themes
**File:** `src/lib/prompts/romantic-config.ts`

```typescript
// Add to RomanticTheme interface (line 100)
export interface RomanticTheme {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  emotions: string[];
  settings: string[];
  colorMood: string;
  animeScenes: string[];
  weight: number; // NEW: Weight for selection (0-100)
  emotionIntensity: 'high' | 'medium' | 'low'; // NEW: For later use
  playlistTag: 'sad' | 'night' | 'first_love' | 'other'; // NEW: For playlist support
}
```

#### Step 2: Update Theme Definitions
**File:** `src/lib/prompts/romantic-config.ts`

```typescript
// Update ROMANTIC_THEMES array (line 111)
export const ROMANTIC_THEMES: RomanticTheme[] = [
  // SAD/HEARTBREAK/LONGING (45% total)
  {
    id: 'heartbreak',
    // ... existing fields ...
    weight: 25, // 25% of total
    emotionIntensity: 'high',
    playlistTag: 'sad',
  },
  {
    id: 'long-distance',
    // ... existing fields ...
    weight: 20, // 20% of total (45% combined with heartbreak)
    emotionIntensity: 'high',
    playlistTag: 'sad',
  },
  
  // SOFT/NIGHT ROMANCE (30% total)
  {
    id: 'night-romance',
    // ... existing fields ...
    weight: 20, // 20% of total
    emotionIntensity: 'medium',
    playlistTag: 'night',
  },
  {
    id: 'deep-love',
    // ... existing fields ...
    weight: 10, // 10% of total (30% combined with night-romance)
    emotionIntensity: 'medium',
    playlistTag: 'night',
  },
  
  // FIRST LOVE (15%)
  {
    id: 'first-love',
    // ... existing fields ...
    weight: 15, // 15% of total
    emotionIntensity: 'low',
    playlistTag: 'first_love',
  },
  
  // OTHER ROMANTIC (10% total)
  {
    id: 'monsoon-romance',
    weight: 3,
    emotionIntensity: 'medium',
    playlistTag: 'other',
  },
  {
    id: 'confession',
    weight: 4,
    emotionIntensity: 'low',
    playlistTag: 'other',
  },
  {
    id: 'wedding-love',
    weight: 3,
    emotionIntensity: 'low',
    playlistTag: 'other',
  },
];
```

#### Step 3: Implement Weighted Random Selection
**File:** `src/lib/prompts/romantic-config.ts`

```typescript
// Replace getRandomTheme() function (line 323)
export function getRandomTheme(): RomanticTheme {
  // Calculate cumulative weights
  const totalWeight = ROMANTIC_THEMES.reduce((sum, theme) => sum + theme.weight, 0);
  let random = Math.random() * totalWeight;
  
  // Select theme based on weighted probability
  for (const theme of ROMANTIC_THEMES) {
    random -= theme.weight;
    if (random <= 0) {
      return theme;
    }
  }
  
  // Fallback (should never reach here)
  return ROMANTIC_THEMES[0];
}
```

### Files to Modify
- ✅ `src/lib/prompts/romantic-config.ts` (add weight, emotionIntensity, playlistTag properties)
- ✅ `src/lib/prompts/romantic-config.ts` (update getRandomTheme() function)

### Testing
- Generate 100 songs and verify distribution matches targets (±5% tolerance)
- Ensure all themes are still selectable (no zero weights)

---

## 2. Emotion Intensity Flag

### Current State
- **File:** `src/lib/prompts/romantic-generator.ts`
- **Current Behavior:** No intensity flag, uniform prompt generation

### Required Changes

**Add `emotionIntensity` flag that affects:**
- Suno prompt tone (sad/slow vs romantic/calm vs soft/hopeful)
- Tempo/style wording adjustments
- Lyric prompt guidance (see section 3)

### Implementation Plan

#### Step 1: Use Intensity from Theme
**File:** `src/lib/prompts/romantic-generator.ts`

```typescript
// Modify generateRomanticPrompt() function (line 42)
export function generateRomanticPrompt(themeId?: string): RomanticPrompt {
  const theme = themeId ? getThemeById(themeId) || getRandomTheme() : getRandomTheme();
  
  // Get intensity from theme (already added in step 1)
  const emotionIntensity = theme.emotionIntensity; // 'high' | 'medium' | 'low'
  
  // ... rest of function ...
}
```

#### Step 2: Adjust Suno Prompt Based on Intensity
**File:** `src/lib/prompts/prompt-enhancer.ts`

```typescript
// Modify generateSunoPrompt() function (line 54)
export function generateSunoPrompt(
  theme: string,
  emotion: string,
  style: string,
  intensity?: 'high' | 'medium' | 'low' // NEW parameter
): string {
  let tempoDescription: string;
  let emotionTone: string;
  
  switch (intensity) {
    case 'high':
      tempoDescription = 'slow tempo, raw emotions, melancholic';
      emotionTone = 'sad, heartbreak, longing, emotional pain';
      break;
    case 'medium':
      tempoDescription = 'romantic, calm, mid-tempo';
      emotionTone = 'romantic, intimate, deep feelings';
      break;
    case 'low':
      tempoDescription = 'soft, hopeful, gentle';
      emotionTone = 'soft, hopeful, innocent, dreamy';
      break;
    default:
      tempoDescription = 'romantic, emotional';
      emotionTone = emotion;
  }
  
  // Use intensity-adjusted descriptions in prompt
  const prompt = `Hindi romantic song about ${emotionTone}. ${style}. ${tempoDescription}, soulful vocals.`;
  
  return prompt.substring(0, 200);
}
```

#### Step 3: Pass Intensity to Prompt Generation
**File:** `src/lib/prompts/romantic-generator.ts`

```typescript
// In generateRomanticPrompt() function
const musicPrompt = generateSunoPrompt(
  theme.nameHindi,
  emotion,
  musicStyle.description,
  theme.emotionIntensity // NEW: Pass intensity
);
```

### Files to Modify
- ✅ `src/lib/prompts/romantic-config.ts` (already done in step 1)
- ✅ `src/lib/prompts/prompt-enhancer.ts` (add intensity parameter to generateSunoPrompt)
- ✅ `src/lib/prompts/romantic-generator.ts` (pass intensity to generateSunoPrompt)

### Testing
- Verify high intensity songs have slower tempo descriptions
- Verify low intensity songs have softer, hopeful tones
- Check prompt length still under 200 chars

---

## 3. Lyric Prompt Guidance

### Current State
- **File:** `src/lib/prompts/prompt-enhancer.ts`, `src/lib/prompts/romantic-generator.ts`
- **Current Behavior:** Generic prompts without structure guidance

### Required Changes

**Rule:** First 15-20 seconds → direct, relatable emotion  
**Later lyrics:** Poetic, metaphorical allowed

**Examples to encourage:**
- Unanswered messages
- Silence
- Long distance
- Late night thoughts
- One-sided feelings

**Avoid:**
- Heavy abstraction at the start
- Vague metaphors without context

### Implementation Plan

#### Step 1: Create Structured Lyric Prompt Templates
**File:** `src/lib/prompts/prompt-enhancer.ts`

```typescript
// Add new function for structured lyric prompts
export function generateStructuredLyricPrompt(
  theme: string,
  emotion: string,
  intensity: 'high' | 'medium' | 'low'
): string {
  // Direct, relatable opening examples (first 15-20 seconds)
  const openingExamples = {
    high: [
      'Unanswered messages on phone, waiting for reply',
      'Silence after goodbye, empty room, memories',
      'Late night thoughts, can\'t sleep, missing you',
      'One-sided love, unrequited feelings, pain',
      'Long distance, counting days, phone calls',
    ],
    medium: [
      'Late night conversation, deep talks, connection',
      'Missing you in silence, thinking of you',
      'Distance between us, but love remains',
      'Night time thoughts, intimate moments',
    ],
    low: [
      'First message, nervous excitement, butterflies',
      'Hoping you feel the same, gentle feelings',
      'Soft glances, shy smiles, innocent love',
    ],
  };
  
  // Poetic/metaphorical examples (later in song)
  const poeticExamples = [
    'Like rain washing away pain',
    'Stars in your eyes, moon in mine',
    'Ocean of emotions, waves of love',
    'Garden of memories, flowers of hope',
  ];
  
  const openings = openingExamples[intensity];
  const opening = openings[Math.floor(Math.random() * openings.length)];
  const poetic = poeticExamples[Math.floor(Math.random() * poeticExamples.length)];
  
  return `Hindi romantic song. Opening (first 15-20 seconds): Direct, relatable emotion about ${opening}. Later lyrics: Can be poetic like ${poetic}. Theme: ${theme}, Emotion: ${emotion}.`;
}
```

#### Step 2: Integrate into Prompt Generation
**File:** `src/lib/prompts/romantic-generator.ts`

```typescript
// Modify generateRomanticPrompt() to use structured prompts
const musicPrompt = generateStructuredLyricPrompt(
  theme.nameHindi,
  emotion,
  theme.emotionIntensity
);
```

### Files to Modify
- ✅ `src/lib/prompts/prompt-enhancer.ts` (add generateStructuredLyricPrompt function)
- ✅ `src/lib/prompts/romantic-generator.ts` (use structured prompts)

### Testing
- Verify prompts emphasize direct emotion in opening
- Check prompts are still under 200 chars
- Ensure relatable examples are included

---

## 4. Video Micro-Variations

### Current State
- **File:** `src/lib/video/create.ts`
- **Function:** `generateASSFile()` (line 273-306)
- **Current Behavior:** Fixed subtitle styling (position, font size, outline, color)

### Required Changes

**Add per-song rotation of:**
- Subtitle vertical position (3 presets)
- Font size (±10%)
- Outline thickness (thin/medium)
- Text color tone based on emotion

**Purpose:** Reduce perceived repetition, increase retention

### Implementation Plan

#### Step 1: Create Variation Config
**File:** `src/lib/video/create.ts`

```typescript
// Add interface for subtitle variations
interface SubtitleVariation {
  verticalPosition: number; // Y position (50, 60, 70 for 3 presets)
  fontSize: number; // Base 72, ±10% = 65-79
  outlineThickness: number; // 2 (thin) or 3 (medium)
  textColor: string; // Based on emotion intensity
}

// Function to generate variation based on theme
function getSubtitleVariation(theme: RomanticTheme): SubtitleVariation {
  // Rotate through 3 vertical positions
  const positions = [50, 60, 70];
  const verticalPosition = positions[Math.floor(Math.random() * positions.length)];
  
  // Font size variation (±10%)
  const baseFontSize = 72;
  const fontSizeVariation = (Math.random() * 0.2 - 0.1); // -10% to +10%
  const fontSize = Math.round(baseFontSize * (1 + fontSizeVariation));
  
  // Outline thickness (thin or medium)
  const outlineThickness = Math.random() < 0.5 ? 2 : 3;
  
  // Text color based on emotion intensity
  const textColors = {
    high: '&H00FFFFFF', // White (sad/heartbreak)
    medium: '&H00FFFFCC', // Soft yellow (romantic)
    low: '&H00FFE6FF', // Soft pink (first love)
  };
  const textColor = textColors[theme.emotionIntensity] || '&H00FFFFFF';
  
  return {
    verticalPosition,
    fontSize,
    outlineThickness,
    textColor,
  };
}
```

#### Step 2: Update ASS File Generation
**File:** `src/lib/video/create.ts`

```typescript
// Modify generateASSFile() function (line 273)
async function generateASSFile(
  lyrics: LyricSegment[],
  outputPath: string,
  variation?: SubtitleVariation // NEW parameter
): Promise<void> {
  const variation = variation || {
    verticalPosition: 50,
    fontSize: 72,
    outlineThickness: 3,
    textColor: '&H00FFFFFF',
  };
  
  // Use variation in ASS header
  const assHeader = `[Script Info]
Title: Song Lyrics
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${variation.fontSize},${variation.textColor},&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,${variation.outlineThickness},2,2,50,50,${variation.verticalPosition},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  
  // ... rest of function ...
}
```

#### Step 3: Pass Variation from Pipeline
**File:** `src/lib/pipeline/index.ts`

```typescript
// In createVideo() method, pass theme to video creation
const variation = getSubtitleVariation(this.job.prompt.theme);
await createVideoFromAnimatedClips({
  // ... existing params ...
  subtitleVariation: variation, // NEW
});
```

### Files to Modify
- ✅ `src/lib/video/create.ts` (add SubtitleVariation interface and getSubtitleVariation function)
- ✅ `src/lib/video/create.ts` (modify generateASSFile to accept variation)
- ✅ `src/lib/pipeline/index.ts` (pass variation to video creation)

### Testing
- Generate 10 videos and verify subtitle variations differ
- Check all variations are readable
- Verify colors match emotion intensity

---

## 5. Shorts Selection Improvements

### Current State
- **File:** `src/lib/video/shorts.ts`
- **Function:** `calculateShortStartTimes()` (line 23-68)
- **Current Behavior:** Purely time-based cuts (even distribution)

### Required Changes

**Improve selection logic:**
- Prefer chorus or emotionally strongest lines
- Bias lines that:
  - Repeat
  - Appear after first 15-20 seconds
  - Have longer duration

### Implementation Plan

#### Step 1: Analyze Lyrics for Best Segments
**File:** `src/lib/video/shorts.ts`

```typescript
// Add interface for lyric analysis
interface LyricSegment {
  start: number;
  end: number;
  text: string;
  score: number; // NEW: Emotional/importance score
}

// Function to score lyric segments
function scoreLyricSegment(
  segment: LyricSegment,
  allSegments: LyricSegment[],
  totalDuration: number
): number {
  let score = 0;
  
  // 1. Prefer segments after 15-20 seconds (avoid intro)
  if (segment.start >= 15 && segment.start <= 20) {
    score += 30; // High bonus
  } else if (segment.start >= 20) {
    score += 20; // Medium bonus
  }
  
  // 2. Prefer longer segments (more impactful)
  const duration = segment.end - segment.start;
  score += duration * 2; // 1 second = 2 points
  
  // 3. Check for repetition (chorus detection)
  const repeatedText = allSegments.filter(s => 
    s.text.toLowerCase() === segment.text.toLowerCase()
  ).length;
  if (repeatedText > 1) {
    score += 40; // High bonus for repeated lines (likely chorus)
  }
  
  // 4. Emotional keywords boost
  const emotionalKeywords = [
    'pyaar', 'mohabbat', 'dil', 'yaad', 'tanha', 'dard',
    'raat', 'sapna', 'khwaab', 'aankhein', 'hasi', 'ansu'
  ];
  const hasEmotionalKeyword = emotionalKeywords.some(keyword =>
    segment.text.toLowerCase().includes(keyword)
  );
  if (hasEmotionalKeyword) {
    score += 15;
  }
  
  return score;
}
```

#### Step 2: Select Best Segments for Shorts
**File:** `src/lib/video/shorts.ts`

```typescript
// Replace calculateShortStartTimes() with smart selection
export function calculateShortStartTimes(
  totalDuration: number,
  lyrics: LyricSegment[], // NEW: Pass lyrics
  shortsCount: number = SHORTS_COUNT,
  shortDuration: number = SHORTS_DURATION
): number[] {
  if (!lyrics || lyrics.length === 0) {
    // Fallback to time-based if no lyrics
    return calculateTimeBasedStartTimes(totalDuration, shortsCount, shortDuration);
  }
  
  // Score all segments
  const scoredSegments = lyrics.map(seg => ({
    ...seg,
    score: scoreLyricSegment(seg, lyrics, totalDuration),
  }));
  
  // Sort by score (highest first)
  scoredSegments.sort((a, b) => b.score - a.score);
  
  // Select top segments that fit duration
  const selectedStartTimes: number[] = [];
  for (const segment of scoredSegments) {
    // Check if segment fits in remaining duration
    if (segment.start + shortDuration <= totalDuration) {
      // Check if it doesn't overlap with already selected
      const overlaps = selectedStartTimes.some(start =>
        Math.abs(start - segment.start) < shortDuration
      );
      
      if (!overlaps && selectedStartTimes.length < shortsCount) {
        selectedStartTimes.push(segment.start);
      }
    }
  }
  
  // Fill remaining slots with time-based if needed
  if (selectedStartTimes.length < shortsCount) {
    const timeBased = calculateTimeBasedStartTimes(
      totalDuration,
      shortsCount - selectedStartTimes.length,
      shortDuration
    );
    selectedStartTimes.push(...timeBased);
  }
  
  return selectedStartTimes.sort((a, b) => a - b);
}

// Keep old function as fallback
function calculateTimeBasedStartTimes(
  totalDuration: number,
  shortsCount: number,
  shortDuration: number
): number[] {
  // ... existing logic from calculateShortStartTimes ...
}
```

#### Step 3: Pass Lyrics to Shorts Creation
**File:** `src/lib/pipeline/index.ts`

```typescript
// In createShorts() method
const shorts = await createAllShorts({
  // ... existing params ...
  lyrics: this.job.song.lyricsTimming?.segments || [], // NEW: Pass lyrics
});
```

### Files to Modify
- ✅ `src/lib/video/shorts.ts` (add scoreLyricSegment function)
- ✅ `src/lib/video/shorts.ts` (replace calculateShortStartTimes with smart selection)
- ✅ `src/lib/video/shorts.ts` (update createAllShorts to accept lyrics)
- ✅ `src/lib/pipeline/index.ts` (pass lyrics to createAllShorts)

### Testing
- Verify shorts start at high-scoring segments
- Check shorts avoid intro (first 15 seconds)
- Ensure no overlapping shorts
- Test fallback when lyrics unavailable

---

## 6. Playlist Support

### Current State
- **File:** `src/lib/youtube/client.ts`
- **Current Behavior:** No playlist support

### Required Changes

**Add logic to:**
- Tag each song with playlist category (sad, night, first_love)
- Auto-add video to correct playlist on upload
- Don't duplicate across playlists early

### Implementation Plan

#### Step 1: Create/Get Playlists
**File:** `src/lib/youtube/client.ts`

```typescript
// Add playlist management functions
export async function getOrCreatePlaylist(
  playlistName: string,
  description: string
): Promise<string> {
  const youtube = getAuthenticatedClient();
  
  // First, try to find existing playlist
  const searchResponse = await youtube.playlists.list({
    part: ['snippet'],
    mine: true,
    maxResults: 50,
  });
  
  const existingPlaylist = searchResponse.data.items?.find(
    p => p.snippet?.title === playlistName
  );
  
  if (existingPlaylist?.id) {
    return existingPlaylist.id;
  }
  
  // Create new playlist if not found
  const createResponse = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: playlistName,
        description: description,
      },
      status: {
        privacyStatus: 'public',
      },
    },
  });
  
  return createResponse.data.id!;
}

// Playlist configurations
const PLAYLIST_CONFIG = {
  sad: {
    name: 'Sad Hindi Love Songs 💔',
    description: 'Emotional Hindi songs about heartbreak, longing, and unrequited love',
  },
  night: {
    name: 'Late Night Romantic Songs 🌙',
    description: 'Perfect for late night listening - romantic Hindi songs',
  },
  first_love: {
    name: 'First Love Hindi Songs ❤️',
    description: 'Songs about first love, innocent romance, and new beginnings',
  },
};
```

#### Step 2: Add Video to Playlist After Upload
**File:** `src/lib/youtube/client.ts`

```typescript
// Add function to add video to playlist
export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string
): Promise<void> {
  const youtube = getAuthenticatedClient();
  
  await youtube.playlistItems.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId,
        },
      },
    },
  });
  
  console.log('[YouTube] Added video to playlist:', videoId);
}
```

#### Step 3: Integrate into Upload Pipeline
**File:** `src/lib/pipeline/index.ts`

```typescript
// In uploadToYouTube() method, after uploading main video
const playlistTag = this.job.prompt.theme.playlistTag; // 'sad' | 'night' | 'first_love' | 'other'

if (playlistTag !== 'other') {
  const playlistConfig = PLAYLIST_CONFIG[playlistTag];
  const playlistId = await getOrCreatePlaylist(
    playlistConfig.name,
    playlistConfig.description
  );
  
  await addVideoToPlaylist(mainVideo.videoId, playlistId);
  console.log('[Pipeline] Added to playlist:', playlistConfig.name);
}
```

### Files to Modify
- ✅ `src/lib/youtube/client.ts` (add getOrCreatePlaylist function)
- ✅ `src/lib/youtube/client.ts` (add addVideoToPlaylist function)
- ✅ `src/lib/pipeline/index.ts` (integrate playlist addition after upload)

### Testing
- Verify playlists are created correctly
- Check videos are added to correct playlists
- Ensure no duplicates in playlists
- Test with 'other' tag (should not add to playlist)

---

## 7. Comment Automation

### Current State
- **File:** `src/lib/youtube/client.ts`
- **Current Behavior:** No comment posting

### Required Changes

**After upload:**
- Post and pin a comment automatically
- Examples:
  - "Which line hurt the most? 💔" (for sad songs)
  - "Late night headphones recommended 🌙" (for night songs)
  - "First love memories? ❤️" (for first love songs)

**Goal:** Increase early comments, improve engagement signals

### Implementation Plan

#### Step 1: Create Comment Templates
**File:** `src/lib/youtube/client.ts`

```typescript
// Comment templates based on playlist tag
const COMMENT_TEMPLATES = {
  sad: [
    'Which line hurt the most? 💔',
    'This hits different at 3 AM 😢',
    'Who else is crying? 💔',
    'Unanswered messages vibes 💔',
  ],
  night: [
    'Late night headphones recommended 🌙',
    'Perfect for midnight thoughts 🌙',
    'This hits different at night 🌙',
    '3 AM vibes 🌙',
  ],
  first_love: [
    'First love memories? ❤️',
    'Remember your first crush? ❤️',
    'This brings back memories ❤️',
    'First love never fades ❤️',
  ],
  other: [
    'What do you think? 💕',
    'Drop your favorite line below 💕',
    'This song hits different 💕',
  ],
};

// Function to get random comment
function getCommentForPlaylist(playlistTag: string): string {
  const templates = COMMENT_TEMPLATES[playlistTag] || COMMENT_TEMPLATES.other;
  return templates[Math.floor(Math.random() * templates.length)];
}
```

#### Step 2: Post and Pin Comment
**File:** `src/lib/youtube/client.ts`

```typescript
// Add function to post and pin comment
export async function postAndPinComment(
  videoId: string,
  commentText: string
): Promise<void> {
  const youtube = getAuthenticatedClient();
  
  // Post comment
  const commentResponse = await youtube.commentThreads.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        videoId: videoId,
        topLevelComment: {
          snippet: {
            textOriginal: commentText,
          },
        },
      },
    },
  });
  
  const commentId = commentResponse.data.id;
  if (!commentId) {
    console.warn('[YouTube] Failed to get comment ID');
    return;
  }
  
  // Pin comment (requires moderator access - may need channel owner)
  try {
    await youtube.comments.setModerationStatus({
      id: commentId,
      moderationStatus: 'published',
    });
    console.log('[YouTube] Comment posted and pinned:', commentText);
  } catch (error) {
    // Pinning may fail if not channel owner - just post comment
    console.log('[YouTube] Comment posted (pinning may require channel owner):', commentText);
  }
}
```

#### Step 3: Integrate into Upload Pipeline
**File:** `src/lib/pipeline/index.ts`

```typescript
// In uploadToYouTube() method, after uploading main video
const playlistTag = this.job.prompt.theme.playlistTag;
const commentText = getCommentForPlaylist(playlistTag);

await postAndPinComment(mainVideo.videoId, commentText);
console.log('[Pipeline] Posted comment:', commentText);
```

### Files to Modify
- ✅ `src/lib/youtube/client.ts` (add COMMENT_TEMPLATES and getCommentForPlaylist)
- ✅ `src/lib/youtube/client.ts` (add postAndPinComment function)
- ✅ `src/lib/pipeline/index.ts` (integrate comment posting after upload)

### Testing
- Verify comments are posted correctly
- Check comment text matches playlist tag
- Test pinning (may require channel owner permissions)
- Ensure comments are appropriate for each theme

---

## 📊 Implementation Priority

### Phase 1: Core Changes (High Impact)
1. ✅ **Theme Weighting** - Direct impact on content distribution
2. ✅ **Emotion Intensity** - Affects song quality and tone
3. ✅ **Lyric Prompt Guidance** - Improves relatability and retention

### Phase 2: Visual & Selection (Medium Impact)
4. ✅ **Video Micro-Variations** - Reduces repetition perception
5. ✅ **Shorts Selection** - Improves short quality and engagement

### Phase 3: Growth Features (Engagement)
6. ✅ **Playlist Support** - Organizes content, improves discoverability
7. ✅ **Comment Automation** - Boosts early engagement signals

---

## 🧪 Testing Strategy

### For Each Change:
1. **Unit Tests:** Test individual functions with mock data
2. **Integration Tests:** Test full pipeline with sample data
3. **Distribution Tests:** Generate 100+ songs and verify distributions
4. **Visual Tests:** Manually review generated videos for quality
5. **YouTube Tests:** Upload test videos and verify playlists/comments

### Success Metrics:
- **Theme Distribution:** Within ±5% of target weights
- **Shorts Quality:** 80%+ start at high-scoring segments
- **Playlist Accuracy:** 100% videos in correct playlists
- **Comment Engagement:** Comments posted within 5 seconds of upload

---

## 📝 Notes

### Scope Limitations (DO NOT ADD):
- ❌ New genres (party, rap, rock, comedy)
- ❌ New visual generation steps
- ❌ Increase Shorts count (keep at 3)
- ❌ Change upload timing logic
- ❌ Analytics dashboards
- ❌ Complex UI changes

### Focus Areas:
- ✅ Emotional clarity
- ✅ Retention optimization
- ✅ Consistency across uploads
- ✅ Early engagement signals

---

**Status:** Planning Complete - Ready for Implementation  
**Last Updated:** January 20, 2026
