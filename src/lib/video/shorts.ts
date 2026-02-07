import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { ensureTempDir } from './create';
import { HOOK_TEXTS, getRandomItem } from '@/lib/prompts/categories';
import { LyricSegment } from '@/types';

/**
 * Configuration for shorts
 */
const SHORTS_DURATION = 25; // 25 seconds per short (more engaging)
const SHORTS_COUNT = 3;

/**
 * Emotional keywords for scoring lyrics (Hindi/Hinglish)
 * Higher score = more emotional/engaging
 */
const EMOTIONAL_KEYWORDS: Record<string, number> = {
  // Heartbreak/sad keywords (high engagement)
  'dard': 3, 'aansoo': 3, 'rona': 3, 'tanha': 3, 'akela': 3,
  'alvida': 3, 'judai': 3, 'dil': 2, 'yaad': 2,
  'raat': 2, 'khamoshi': 2, 'intezaar': 2, 'tadap': 3,
  // Love keywords
  'pyaar': 2, 'mohabbat': 2, 'ishq': 2, 'chahat': 2,
  'jaan': 2, 'saathi': 2, 'humsafar': 2, 'bewafa': 3,
  // Emotional intensity
  'kyun': 1, 'kaise': 1, 'kabhi': 1, 'phir': 1, 'sirf': 1,
  // Night/romantic
  'chandni': 2, 'sitara': 2, 'aasmaan': 1, 'chaand': 2,
};

/**
 * Score a lyric line based on emotional content
 */
function scoreLyricLine(text: string, startTime: number, duration: number): number {
  let score = 0;
  const lowerText = text.toLowerCase();
  
  // 1. After 15-20 seconds bias (chorus usually comes later)
  if (startTime >= 15 && startTime <= 60) {
    score += 2; // Middle section often has chorus
  } else if (startTime > 60) {
    score += 1; // Later sections still good
  }
  
  // 2. Longer duration lines (usually more emotional/important)
  if (duration >= 4) {
    score += 2;
  } else if (duration >= 3) {
    score += 1;
  }
  
  // 3. Emotional keywords
  for (const [keyword, keywordScore] of Object.entries(EMOTIONAL_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      score += keywordScore;
    }
  }
  
  // 4. Exclamation marks indicate emotional delivery
  if (text.includes('!')) {
    score += 1;
  }
  
  // 5. Shorter text lines are often hooks (catchy)
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= 5 && wordCount >= 2) {
    score += 1; // Short punchy lines
  }
  
  return score;
}

/**
 * Score a time window based on lyrics contained within
 */
function scoreTimeWindow(
  startTime: number,
  duration: number,
  lyrics: LyricSegment[],
  usedRanges: Array<{start: number; end: number}>
): number {
  const endTime = startTime + duration;
  let score = 0;
  
  // Check if this range overlaps with already used ranges
  for (const used of usedRanges) {
    if (startTime < used.end && endTime > used.start) {
      return -100; // Heavy penalty for overlap
    }
  }
  
  // Score based on lyrics in this window
  for (const lyric of lyrics) {
    if (lyric.start >= startTime && lyric.end <= endTime) {
      // Lyric is fully within this window
      const lineDuration = lyric.end - lyric.start;
      score += scoreLyricLine(lyric.text, lyric.start, lineDuration);
    } else if (lyric.start < endTime && lyric.end > startTime) {
      // Partial overlap - count with reduced weight
      const lineDuration = lyric.end - lyric.start;
      score += scoreLyricLine(lyric.text, lyric.start, lineDuration) * 0.5;
    }
  }
  
  return score;
}

/**
 * Detect repeated lyrics (likely chorus)
 */
function findRepeatedLyrics(lyrics: LyricSegment[]): Set<string> {
  const lyricCounts = new Map<string, number>();
  const repeated = new Set<string>();
  
  for (const lyric of lyrics) {
    const normalized = lyric.text.toLowerCase().trim();
    if (normalized.length < 5) continue; // Skip very short lines
    
    const count = (lyricCounts.get(normalized) || 0) + 1;
    lyricCounts.set(normalized, count);
    
    if (count >= 2) {
      repeated.add(normalized);
    }
  }
  
  return repeated;
}

/**
 * Find optimal start times for shorts based on lyrics analysis
 * Smart selection: prefers chorus, emotional lines, after 15-20s
 */
export function calculateSmartShortStartTimes(
  totalDuration: number,
  lyrics: LyricSegment[],
  shortsCount: number = SHORTS_COUNT,
  shortDuration: number = SHORTS_DURATION
): number[] {
  // If no lyrics or very short video, fall back to even distribution
  if (!lyrics.length || totalDuration <= shortDuration * 2) {
    return calculateShortStartTimes(totalDuration, shortsCount, shortDuration);
  }
  
  console.log('[Shorts] Using smart lyrics-based selection');
  
  // Find repeated lyrics (chorus)
  const repeatedLyrics = findRepeatedLyrics(lyrics);
  console.log('[Shorts] Found', repeatedLyrics.size, 'repeated lyric patterns (likely chorus)');
  
  // Generate candidate start times (every 5 seconds)
  const candidates: Array<{startTime: number; score: number}> = [];
  const maxStart = totalDuration - shortDuration;
  
  for (let start = 5; start <= maxStart; start += 5) {
    // Check if this window contains repeated lyrics
    let hasRepeat = false;
    for (const lyric of lyrics) {
      if (lyric.start >= start && lyric.end <= start + shortDuration) {
        const normalized = lyric.text.toLowerCase().trim();
        if (repeatedLyrics.has(normalized)) {
          hasRepeat = true;
          break;
        }
      }
    }
    
    // Calculate base score
    let score = scoreTimeWindow(start, shortDuration, lyrics, []);
    
    // Bonus for containing chorus/repeated lyrics
    if (hasRepeat) {
      score += 5;
    }
    
    candidates.push({ startTime: start, score });
  }
  
  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);
  
  // Select top shorts while avoiding overlap
  const selectedTimes: number[] = [];
  const usedRanges: Array<{start: number; end: number}> = [];
  
  for (const candidate of candidates) {
    if (selectedTimes.length >= shortsCount) break;
    
    // Check for overlap with selected times
    const overlaps = usedRanges.some(range => 
      candidate.startTime < range.end && candidate.startTime + shortDuration > range.start
    );
    
    if (!overlaps) {
      selectedTimes.push(candidate.startTime);
      usedRanges.push({
        start: candidate.startTime,
        end: candidate.startTime + shortDuration,
      });
      console.log(`[Shorts] Selected t=${candidate.startTime}s (score: ${candidate.score})`);
    }
  }
  
  // If we couldn't find enough non-overlapping times, fill with evenly distributed
  if (selectedTimes.length < shortsCount) {
    console.log('[Shorts] Filling remaining with even distribution');
    const evenTimes = calculateShortStartTimes(totalDuration, shortsCount, shortDuration);
    for (const time of evenTimes) {
      if (selectedTimes.length >= shortsCount) break;
      if (!selectedTimes.includes(time)) {
        selectedTimes.push(time);
      }
    }
  }
  
  // Sort by time for sequential creation
  selectedTimes.sort((a, b) => a - b);
  
  console.log('[Shorts] Final smart start times:', selectedTimes);
  return selectedTimes;
}

/**
 * Get a random engaging hook for the category
 */
export function getEngagingHook(categoryId: string): string {
  const hooks = HOOK_TEXTS[categoryId] || HOOK_TEXTS['quiet-motivation'];
  return getRandomItem(hooks);
}

/**
 * Calculate optimal start times for shorts to cover different parts of the song
 */
export function calculateShortStartTimes(
  totalDuration: number,
  shortsCount: number = SHORTS_COUNT,
  shortDuration: number = SHORTS_DURATION
): number[] {
  // If video is shorter than one short, start at 0
  if (totalDuration <= shortDuration) {
    return [0];
  }

  const startTimes: number[] = [];
  
  // Calculate available space for shorts
  const availableDuration = totalDuration - shortDuration;
  
  // Distribute shorts evenly across the song
  if (shortsCount === 1) {
    // Single short - start at the beginning or middle
    startTimes.push(Math.min(10, availableDuration)); // Start after 10s intro
  } else if (shortsCount === 2) {
    // Two shorts - beginning and end
    startTimes.push(10); // After intro
    startTimes.push(Math.max(0, availableDuration - 10)); // Before outro
  } else {
    // Multiple shorts - distribute evenly
    const interval = availableDuration / (shortsCount - 1);
    
    for (let i = 0; i < shortsCount; i++) {
      let startTime = i * interval;
      
      // Add small offset to avoid starting exactly at 0
      if (i === 0 && startTime < 5) {
        startTime = Math.min(10, availableDuration);
      }
      
      // Ensure we don't exceed bounds
      startTime = Math.min(startTime, availableDuration);
      startTime = Math.max(0, startTime);
      
      startTimes.push(Math.floor(startTime));
    }
  }

  console.log('[Shorts] Calculated start times:', startTimes);
  return startTimes;
}

/**
 * Cut a short video from the main video with optional hook text
 */
export async function cutShort(params: {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration?: number;
  hookText?: string;
}): Promise<string> {
  const { inputPath, outputPath, startTime, duration = SHORTS_DURATION, hookText } = params;

  console.log(`[Shorts] Cutting short: start=${startTime}s, duration=${duration}s`);
  if (hookText) {
    console.log(`[Shorts] Hook text: "${hookText}" (disabled for compatibility)`);
  }

  // Build the video filter for 9:16 vertical format (FILL, no black bars)
  // 1. Scale to make HEIGHT 1920 (width will be larger than 1080 for 16:9 input)
  // 2. Crop the center 1080 pixels to get exactly 1080x1920
  // This fills the entire frame without black bars
  const videoFilter = 'scale=-2:1920,crop=1080:1920:(iw-1080)/2:0';

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-vf', videoFilter,
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Shorts] FFmpeg command:', cmd.substring(0, 300) + '...');
      })
      .on('end', () => {
        console.log('[Shorts] Short created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[Shorts] FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Create all shorts from a main video
 * Now supports smart lyrics-based selection for better engagement
 */
export async function createAllShorts(params: {
  inputVideoPath: string;
  outputDir?: string;
  totalDuration: number;
  shortsCount?: number;
  shortDuration?: number;
  categoryId?: string;
  lyrics?: LyricSegment[]; // Optional lyrics for smart selection
}): Promise<{ path: string; index: number; startTime: number; hookText?: string }[]> {
  const {
    inputVideoPath,
    totalDuration,
    shortsCount = SHORTS_COUNT,
    shortDuration = SHORTS_DURATION,
    categoryId = 'love-ballad',
    lyrics,
  } = params;

  const tempDir = params.outputDir || await ensureTempDir();
  const baseName = path.basename(inputVideoPath, path.extname(inputVideoPath));
  
  // Calculate start times - use smart selection if lyrics available
  const startTimes = lyrics && lyrics.length > 0
    ? calculateSmartShortStartTimes(totalDuration, lyrics, shortsCount, shortDuration)
    : calculateShortStartTimes(totalDuration, shortsCount, shortDuration);
  
  console.log(`[Shorts] Creating ${startTimes.length} shorts from video (${shortDuration}s each)`);

  const results: { path: string; index: number; startTime: number; hookText?: string }[] = [];

  for (let i = 0; i < startTimes.length; i++) {
    const startTime = startTimes[i];
    const outputPath = path.join(tempDir, `${baseName}-short-${i + 1}.mp4`);
    
    // Get an engaging hook for this short
    const hookText = getEngagingHook(categoryId);

    await cutShort({
      inputPath: inputVideoPath,
      outputPath,
      startTime,
      duration: shortDuration,
      hookText,
    });

    results.push({
      path: outputPath,
      index: i + 1,
      startTime,
      hookText,
    });
  }

  console.log(`[Shorts] Successfully created ${results.length} shorts with engaging hooks`);
  return results;
}

/**
 * Get video duration using FFmpeg
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}
