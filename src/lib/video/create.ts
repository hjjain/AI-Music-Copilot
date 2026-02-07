import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { LyricSegment } from '@/types';

/**
 * Video Style Variation Configuration
 * Rotates subtitle position, font size, outline, and color for visual variety
 */
export interface VideoStyleVariation {
  // Subtitle vertical position (margin from bottom)
  position: 'bottom' | 'center' | 'lower-center';
  // Font size variation (base is 72)
  fontSizeMultiplier: number; // 0.9 to 1.1
  // Outline thickness
  outlineThickness: 'thin' | 'medium' | 'thick';
  // Text color based on emotion
  colorTone: 'warm' | 'cool' | 'neutral';
}

/**
 * Cinematic Micro-Variations Configuration
 * Makes videos more engaging and professional
 */
export interface CinematicEffects {
  // Ken Burns zoom (slow zoom in/out)
  enableZoom: boolean;
  zoomIntensity: 'subtle' | 'moderate'; // 2% or 5% zoom
  // Slow pan movement
  enablePan: boolean;
  panDirection: 'horizontal' | 'vertical' | 'diagonal';
  // Light flicker (subtle brightness variation)
  enableLightFlicker: boolean;
  flickerIntensity: 'subtle' | 'moderate'; // 2% or 5% variation
  // Film grain (cinematic texture)
  enableGrain: boolean;
  grainIntensity: 'light' | 'medium'; // Film-like grain
}

// Default cinematic effects (all enabled with subtle settings)
const DEFAULT_CINEMATIC_EFFECTS: CinematicEffects = {
  enableZoom: true,
  zoomIntensity: 'subtle',
  enablePan: true,
  panDirection: 'horizontal',
  enableLightFlicker: true,
  flickerIntensity: 'subtle',
  enableGrain: true,
  grainIntensity: 'light',
};

/**
 * Generate random cinematic effects for variety
 */
export function getRandomCinematicEffects(): CinematicEffects {
  const panDirections: CinematicEffects['panDirection'][] = ['horizontal', 'vertical', 'diagonal'];
  
  return {
    enableZoom: true,
    zoomIntensity: Math.random() > 0.5 ? 'subtle' : 'moderate',
    enablePan: true,
    panDirection: panDirections[Math.floor(Math.random() * panDirections.length)],
    enableLightFlicker: true,
    flickerIntensity: 'subtle', // Always subtle to avoid distraction
    enableGrain: true,
    grainIntensity: Math.random() > 0.7 ? 'medium' : 'light',
  };
}

/**
 * Build FFmpeg filter for cinematic micro-variations
 * Creates Ken Burns zoom, pan, light flicker, and grain effects
 * 
 * @param duration - Video duration in seconds
 * @param effects - Cinematic effects configuration
 * @returns FFmpeg filter string
 */
function buildCinematicFilter(duration: number, effects: CinematicEffects): string {
  const filters: string[] = [];
  
  // 1. Ken Burns Zoom Effect (zoom in then out, cycles every 30 seconds)
  if (effects.enableZoom) {
    // Zoom intensity: subtle = 1.02x, moderate = 1.05x
    const maxZoom = effects.zoomIntensity === 'subtle' ? 1.02 : 1.05;
    const cycleDuration = 30; // 30 seconds per zoom cycle
    
    // zoompan: zoom oscillates between 1.0 and maxZoom using sine wave
    // z='1+0.02*sin(on/fps/30*PI)' means zoom from 1.0 to 1.02 over 30s cycle
    const zoomAmount = maxZoom - 1;
    filters.push(
      `zoompan=z='1+${zoomAmount}*sin(on/(fps*${cycleDuration})*PI*2)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30`
    );
  }
  
  // 2. Slow Pan Effect (subtle horizontal/vertical drift)
  if (effects.enablePan && !effects.enableZoom) {
    // Only apply if zoom is disabled (they conflict)
    const panPixels = 20; // Max pan distance in pixels
    const panDuration = 45; // Pan cycle duration
    
    if (effects.panDirection === 'horizontal') {
      filters.push(
        `crop=in_w-${panPixels}:in_h:${panPixels/2}+${panPixels/2}*sin(t/${panDuration}*PI*2):0`
      );
    } else if (effects.panDirection === 'vertical') {
      filters.push(
        `crop=in_w:in_h-${panPixels}:0:${panPixels/2}+${panPixels/2}*sin(t/${panDuration}*PI*2)`
      );
    }
  }
  
  // 3. Light Flicker Effect (subtle brightness oscillation)
  if (effects.enableLightFlicker) {
    // Brightness variation: subtle = 2%, moderate = 5%
    const brightnessVar = effects.flickerIntensity === 'subtle' ? 0.02 : 0.05;
    
    // Use eq filter with slight brightness variation
    // Creates subtle "breathing" light effect
    filters.push(
      `eq=brightness=${brightnessVar}*sin(t*0.5):saturation=1+0.02*sin(t*0.3)`
    );
  }
  
  // 4. Film Grain Effect (cinematic texture)
  if (effects.enableGrain) {
    // Grain intensity: light = 5, medium = 10
    const grainStrength = effects.grainIntensity === 'light' ? 5 : 10;
    
    // Add subtle noise for film grain look
    filters.push(
      `noise=alls=${grainStrength}:allf=t+u`
    );
  }
  
  return filters.join(',');
}

// Position presets (MarginV values in ASS)
const POSITION_PRESETS: Record<VideoStyleVariation['position'], number> = {
  'bottom': 80,        // Near bottom (default)
  'lower-center': 300, // Lower third area
  'center': 500,       // Center of screen
};

// Font size variation (base 72)
const FONT_SIZES: Record<number, number> = {
  0.9: 65,  // -10%
  1.0: 72,  // Base
  1.1: 80,  // +10%
};

// Outline thickness
const OUTLINE_SIZES: Record<VideoStyleVariation['outlineThickness'], number> = {
  'thin': 2,
  'medium': 3,
  'thick': 4,
};

// Color tones (ASS format: &HBBGGRR)
const COLOR_TONES: Record<VideoStyleVariation['colorTone'], { primary: string; outline: string }> = {
  'warm': { primary: '&H00C0FFFF', outline: '&H00000040' },   // Warm yellow/cream
  'cool': { primary: '&H00FFFFC0', outline: '&H00400000' },   // Cool blue-white
  'neutral': { primary: '&H00FFFFFF', outline: '&H00000000' }, // Pure white
};

/**
 * Get random style variation for video
 * Creates visual variety across different songs
 */
export function getRandomStyleVariation(emotionIntensity?: 'high' | 'medium' | 'low'): VideoStyleVariation {
  // Positions rotate randomly
  const positions: VideoStyleVariation['position'][] = ['bottom', 'lower-center', 'center'];
  const position = positions[Math.floor(Math.random() * positions.length)];
  
  // Font size variations
  const fontMultipliers = [0.9, 1.0, 1.1];
  const fontSizeMultiplier = fontMultipliers[Math.floor(Math.random() * fontMultipliers.length)];
  
  // Outline thickness (weighted towards medium)
  const outlines: VideoStyleVariation['outlineThickness'][] = ['thin', 'medium', 'medium', 'thick'];
  const outlineThickness = outlines[Math.floor(Math.random() * outlines.length)];
  
  // Color based on emotion intensity (if provided)
  let colorTone: VideoStyleVariation['colorTone'];
  if (emotionIntensity === 'high') {
    // Sad/intense songs get cool tones (60%) or warm (40%)
    colorTone = Math.random() < 0.6 ? 'cool' : 'warm';
  } else if (emotionIntensity === 'low') {
    // Sweet/soft songs get warm tones (70%) or neutral (30%)
    colorTone = Math.random() < 0.7 ? 'warm' : 'neutral';
  } else {
    // Medium intensity - mostly neutral
    const colors: VideoStyleVariation['colorTone'][] = ['neutral', 'neutral', 'warm', 'cool'];
    colorTone = colors[Math.floor(Math.random() * colors.length)];
  }
  
  return { position, fontSizeMultiplier, outlineThickness, colorTone };
}

/**
 * Ensure temp directory exists
 */
export async function ensureTempDir(): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Loop a short video to match a target duration with smooth crossfade transitions
 * Used for looping Kling's 5-second animated clips
 */
export async function loopVideoToLength(params: {
  inputVideoPath: string;
  outputPath: string;
  targetDuration: number;
  crossfadeDuration?: number; // Duration of crossfade in seconds
}): Promise<string> {
  const { inputVideoPath, outputPath, targetDuration, crossfadeDuration = 0.5 } = params;

  console.log('[Video] Looping video to', targetDuration, 'seconds with crossfade');
  console.log('[Video] Input:', inputVideoPath);
  console.log('[Video] Crossfade duration:', crossfadeDuration, 'seconds');

  // Get the duration of the input clip
  const clipDuration = await getVideoDuration(inputVideoPath);
  console.log('[Video] Clip duration:', clipDuration, 'seconds');

  // Calculate how many loops we need
  const effectiveClipDuration = clipDuration - crossfadeDuration; // Account for crossfade overlap
  const loopsNeeded = Math.ceil(targetDuration / effectiveClipDuration) + 1;
  console.log('[Video] Loops needed:', loopsNeeded);

  // For smooth looping, we'll use a complex filter that:
  // 1. Creates multiple inputs of the same clip
  // 2. Applies xfade (crossfade) between each pair
  // This creates seamless transitions
  
  // Build the filter complex for crossfade looping
  // Each xfade blends the end of one clip with the start of the next
  const inputs: string[] = [];
  const filterParts: string[] = [];
  
  // Add input options for each loop
  for (let i = 0; i < loopsNeeded; i++) {
    inputs.push('-i', inputVideoPath);
  }

  // Build xfade chain: [0][1]xfade -> [v01], [v01][2]xfade -> [v012], etc.
  if (loopsNeeded === 1) {
    // Just one clip, no crossfade needed
    filterParts.push('[0:v]copy[outv]');
  } else {
    let lastOutput = '0:v';
    for (let i = 1; i < loopsNeeded; i++) {
      const outputLabel = i === loopsNeeded - 1 ? 'outv' : `v${i}`;
      const offset = (clipDuration - crossfadeDuration) * i;
      filterParts.push(
        `[${lastOutput}][${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset.toFixed(2)}[${outputLabel}]`
      );
      lastOutput = outputLabel;
    }
  }

  const filterComplex = filterParts.join(';');
  console.log('[Video] Filter complex:', filterComplex.substring(0, 200) + '...');

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    
    // Add all inputs
    for (let i = 0; i < loopsNeeded; i++) {
      command.input(inputVideoPath);
    }
    
    command
      .complexFilter(filterComplex, 'outv')
      .outputOptions([
        '-t', String(targetDuration),
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-an', // No audio
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Video] Crossfade loop command:', cmd.substring(0, 300) + '...');
      })
      .on('end', () => {
        console.log('[Video] Crossfade looped video created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[Video] Crossfade loop error:', err.message);
        // Fallback to simple loop if crossfade fails
        console.log('[Video] Falling back to simple loop...');
        simpleLoopVideo(inputVideoPath, outputPath, targetDuration)
          .then(resolve)
          .catch(reject);
      })
      .run();
  });
}

/**
 * Simple loop without crossfade (fallback)
 */
async function simpleLoopVideo(
  inputVideoPath: string,
  outputPath: string,
  targetDuration: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputVideoPath)
      .inputOptions(['-stream_loop', '-1'])
      .outputOptions([
        '-t', String(targetDuration),
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-an',
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('[Video] Simple looped video created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[Video] Simple loop error:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Get video duration using ffprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 5);
    });
  });
}

/**
 * Combine looped video with audio
 */
export async function combineVideoAndAudio(params: {
  videoPath: string;
  audioPath: string;
  outputPath: string;
}): Promise<string> {
  const { videoPath, audioPath, outputPath } = params;

  console.log('[Video] Combining video and audio');
  console.log('[Video] Video:', videoPath);
  console.log('[Video] Audio:', audioPath);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v', 'copy', // Copy video stream (no re-encoding)
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Video] Combine command:', cmd);
      })
      .on('end', () => {
        console.log('[Video] Combined video created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[Video] Combine error:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Convert WebP or other image formats to PNG for FFmpeg compatibility
 * FFmpeg's -loop 1 option has issues with WebP images
 */
async function ensurePngFormat(imagePath: string): Promise<{ path: string; needsCleanup: boolean }> {
  const ext = path.extname(imagePath).toLowerCase();
  
  // If already PNG or JPG, use as-is
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    return { path: imagePath, needsCleanup: false };
  }

  // Convert to PNG
  const tempDir = await ensureTempDir();
  const pngPath = path.join(tempDir, `converted-${Date.now()}.png`);

  console.log(`[Video] Converting ${ext} to PNG for FFmpeg compatibility`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .outputOptions([
        '-y', // Overwrite output file
      ])
      .output(pngPath)
      .on('end', () => {
        console.log('[Video] Image converted to PNG:', pngPath);
        resolve({ path: pngPath, needsCleanup: true });
      })
      .on('error', (err: Error) => {
        console.error('[Video] Image conversion error:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Create a video from an image and audio file
 * The image is looped to match the audio duration
 */
export async function createVideoFromImage(params: {
  imagePath: string;
  audioPath: string;
  outputPath: string;
  duration: number;
}): Promise<string> {
  const { imagePath, audioPath, outputPath, duration } = params;

  console.log('[Video] Creating video from image');
  console.log('[Video] Image:', imagePath);
  console.log('[Video] Audio:', audioPath);
  console.log('[Video] Duration:', duration, 'seconds');

  // Convert image to PNG if needed (FFmpeg has issues with WebP -loop 1)
  const imageInfo = await ensurePngFormat(imagePath);

  // Scale filter to ensure even dimensions (libx264 requires width/height divisible by 2)
  const scaleFilter = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';

  return new Promise((resolve, reject) => {
    ffmpeg()
      // Input image - loop it
      .input(imageInfo.path)
      .inputOptions([
        '-loop', '1', // Loop the image
        '-framerate', '30', // 30 fps
      ])
      // Input audio
      .input(audioPath)
      // Output options
      .outputOptions([
        '-c:v', 'libx264', // Video codec
        '-tune', 'stillimage', // Optimize for still image
        '-c:a', 'aac', // Audio codec
        '-b:a', '192k', // Audio bitrate
        '-pix_fmt', 'yuv420p', // Pixel format for compatibility
        '-shortest', // End when shortest input ends
        '-t', String(duration), // Explicit duration
        '-vf', scaleFilter, // Ensure even dimensions for libx264
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Video] FFmpeg command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[Video] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', async () => {
        console.log('[Video] Video created successfully:', outputPath);
        // Cleanup converted image if needed
        if (imageInfo.needsCleanup) {
          try {
            await fs.unlink(imageInfo.path);
          } catch {
            // Ignore cleanup errors
          }
        }
        resolve(outputPath);
      })
      .on('error', async (err: Error) => {
        console.error('[Video] FFmpeg error:', err.message);
        // Cleanup converted image if needed
        if (imageInfo.needsCleanup) {
          try {
            await fs.unlink(imageInfo.path);
          } catch {
            // Ignore cleanup errors
          }
        }
        reject(err);
      })
      .run();
  });
}

/**
 * Escape path for FFmpeg filter (handles special characters)
 * On macOS/Linux, we mainly need to handle single quotes and backslashes
 */
function escapeFilterPath(filePath: string): string {
  // For the ass filter, we need to escape: \ ' [ ]
  // Note: Colons don't need escaping on macOS/Linux (only Windows drive letters)
  return filePath
    .replace(/\\/g, '/')           // Convert backslashes to forward slashes
    .replace(/'/g, "'\\''")        // Escape single quotes for shell
    .replace(/\[/g, '\\[')         // Escape brackets
    .replace(/\]/g, '\\]');
}

/**
 * Create a video with lyrics overlay (karaoke style)
 */
export async function createVideoWithLyrics(params: {
  imagePath: string;
  audioPath: string;
  outputPath: string;
  duration: number;
  lyrics: LyricSegment[];
}): Promise<string> {
  const { imagePath, audioPath, outputPath, duration, lyrics } = params;

  console.log('[Video] Creating video with lyrics overlay');
  console.log('[Video] Lyrics segments:', lyrics.length);

  // If no lyrics, create video without subtitles
  if (lyrics.length === 0) {
    console.log('[Video] No lyrics provided, creating video without subtitles');
    return createVideoFromImage({ imagePath, audioPath, outputPath, duration });
  }

  // Convert image to PNG if needed (FFmpeg has issues with WebP -loop 1)
  const imageInfo = await ensurePngFormat(imagePath);

  // Verify the image file exists and has content
  const imageStats = await fs.stat(imageInfo.path);
  console.log('[Video] Image file:', imageInfo.path, 'Size:', imageStats.size, 'bytes');
  if (imageStats.size === 0) {
    throw new Error('Image file is empty');
  }

  // Verify the audio file exists and has content
  const audioStats = await fs.stat(audioPath);
  console.log('[Video] Audio file:', audioPath, 'Size:', audioStats.size, 'bytes');
  if (audioStats.size === 0) {
    throw new Error('Audio file is empty');
  }

  // Generate ASS subtitle file for karaoke effect
  const tempDir = await ensureTempDir();
  const assPath = path.join(tempDir, `lyrics-${Date.now()}.ass`);
  await generateASSFile(lyrics, assPath);

  // Verify the ASS file exists and has content
  const assStats = await fs.stat(assPath);
  console.log('[Video] ASS file:', assPath, 'Size:', assStats.size, 'bytes');

  // Log first few lines of ASS file for debugging
  const assContent = await fs.readFile(assPath, 'utf-8');
  console.log('[Video] ASS file preview (first 500 chars):');
  console.log(assContent.substring(0, 500));

  // Escape the path for FFmpeg filter
  const escapedAssPath = escapeFilterPath(assPath);
  console.log('[Video] Escaped ASS path:', escapedAssPath);

  // Build the video filter chain:
  // 1. Scale to even dimensions (libx264 requires width/height divisible by 2)
  // 2. Apply ASS subtitles
  const videoFilter = `scale=trunc(iw/2)*2:trunc(ih/2)*2,ass=${escapedAssPath}`;
  console.log('[Video] Video filter:', videoFilter);

  return new Promise((resolve, reject) => {
    let ffmpegStderr = '';
    
    const command = ffmpeg()
      // Input image (converted to PNG if needed)
      .input(imageInfo.path)
      .inputOptions([
        '-loop', '1',
        '-framerate', '30',
      ])
      // Input audio
      .input(audioPath)
      // Output options with subtitle filter
      .outputOptions([
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-t', String(duration),
        '-vf', videoFilter, // Scale to even dimensions + ASS subtitles
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Video] FFmpeg command:', cmd);
      })
      .on('stderr', (stderrLine) => {
        ffmpegStderr += stderrLine + '\n';
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[Video] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', async () => {
        console.log('[Video] Video with lyrics created successfully');
        // Clean up temporary files
        const cleanupTasks = [fs.unlink(assPath)];
        if (imageInfo.needsCleanup) {
          cleanupTasks.push(fs.unlink(imageInfo.path));
        }
        await Promise.all(cleanupTasks.map(p => p.catch(() => { /* Ignore cleanup errors */ })));
        resolve(outputPath);
      })
      .on('error', async (err: Error) => {
        console.error('[Video] FFmpeg error:', err.message);
        console.error('[Video] FFmpeg stderr (last 50 lines):');
        const stderrLines = ffmpegStderr.split('\n');
        stderrLines.slice(-50).forEach(line => console.error('  ', line));
        // DON'T clean up on error so we can debug
        console.error('[Video] Keeping temp files for debugging:');
        console.error('[Video]   Image:', imageInfo.path);
        console.error('[Video]   ASS:', assPath);
        reject(err);
      });
    
    command.run();
  });
}

/**
 * Dynamic position configuration for subtitle position changes
 * Changes position every 15 seconds to keep viewer engaged
 */
const DYNAMIC_POSITIONS = [
  { name: 'Bottom', marginV: 80, alignment: 2 },      // Bottom center
  { name: 'LowerThird', marginV: 300, alignment: 2 }, // Lower third
  { name: 'Center', marginV: 500, alignment: 5 },     // Center
  { name: 'TopThird', marginV: 750, alignment: 8 },   // Upper third (top area)
];

const POSITION_CHANGE_INTERVAL = 15; // Change position every 15 seconds

/**
 * Get position style name based on timestamp
 * Cycles through positions every 15 seconds
 */
function getPositionStyleForTime(seconds: number): string {
  const positionIndex = Math.floor(seconds / POSITION_CHANGE_INTERVAL) % DYNAMIC_POSITIONS.length;
  return DYNAMIC_POSITIONS[positionIndex].name;
}

/**
 * Generate ASS (Advanced SubStation Alpha) subtitle file for karaoke effect
 * Now supports dynamic position changes every 15 seconds to hook viewers
 */
async function generateASSFile(
  lyrics: LyricSegment[],
  outputPath: string,
  styleVariation?: VideoStyleVariation
): Promise<void> {
  // Get style values (use defaults if no variation provided)
  const variation = styleVariation || getRandomStyleVariation();
  
  // Calculate ASS style values
  const fontSize = FONT_SIZES[variation.fontSizeMultiplier] || 72;
  const outlineSize = OUTLINE_SIZES[variation.outlineThickness];
  const colors = COLOR_TONES[variation.colorTone];
  
  console.log('[Video] Style variation:', {
    fontSize,
    outline: variation.outlineThickness,
    color: variation.colorTone,
  });
  console.log('[Video] Dynamic position enabled: changes every', POSITION_CHANGE_INTERVAL, 'seconds');
  
  // Generate styles for all 4 positions (for dynamic switching)
  const styleDefinitions = DYNAMIC_POSITIONS.map(pos => 
    `Style: ${pos.name},Arial,${fontSize},${colors.primary},&H000000FF,${colors.outline},&H80000000,1,0,0,0,100,100,0,0,1,${outlineSize},2,${pos.alignment},50,50,${pos.marginV},1`
  ).join('\n');
  
  // ASS header with multiple position styles
  const assHeader = `[Script Info]
Title: Song Lyrics
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleDefinitions}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Convert lyrics to ASS dialogue events with dynamic position based on timestamp
  const events = lyrics.map((segment) => {
    const startTime = formatASSTime(segment.start);
    const endTime = formatASSTime(segment.end);
    // Get position style based on segment start time
    const styleName = getPositionStyleForTime(segment.start);
    // Escape special characters and add karaoke effect
    const text = escapeASSText(segment.text);
    return `Dialogue: 0,${startTime},${endTime},${styleName},,0,0,0,,{\\fad(200,200)}${text}`;
  });

  const assContent = assHeader + events.join('\n') + '\n';
  await fs.writeFile(outputPath, assContent, 'utf-8');
  console.log('[Video] ASS file generated with dynamic positions:', outputPath);
}

/**
 * Format time in ASS format (h:mm:ss.cc)
 */
function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Escape special characters for ASS format
 */
function escapeASSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, '\\N');
}

/**
 * Get audio duration using FFmpeg
 */
export async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 180;
      resolve(duration);
    });
  });
}

/**
 * Create video from 3 animated Kling clips (15 seconds base) with lyrics overlay
 * Concatenates 3 clips with crossfades, then loops to match song duration
 * Now supports style variations and cinematic micro-effects
 */
export async function createVideoFromAnimatedClips(params: {
  animatedClipPaths: string[];  // 3 x 5-second Kling videos
  audioPath: string;
  outputPath: string;
  duration: number;
  lyrics: LyricSegment[];
  styleVariation?: VideoStyleVariation; // Optional style variation
  cinematicEffects?: CinematicEffects; // Optional cinematic micro-variations
}): Promise<string> {
  const { animatedClipPaths, audioPath, outputPath, duration, lyrics, styleVariation, cinematicEffects } = params;

  console.log('[Video] Creating video from 3 animated Kling clips');
  console.log('[Video] Clips:', animatedClipPaths);
  console.log('[Video] Target duration:', duration, 'seconds');
  console.log('[Video] Lyrics segments:', lyrics.length);

  const tempDir = await ensureTempDir();

  // Step 1: Concatenate 3 clips with crossfades into 15-second base video
  const baseVideoPath = path.join(tempDir, `base-15s-${Date.now()}.mp4`);
  await concatenateClipsWithCrossfade({
    clipPaths: animatedClipPaths,
    outputPath: baseVideoPath,
    crossfadeDuration: 0.5,
  });
  console.log('[Video] Base 15-second video created');

  // Step 2: Loop the 15-second base to match audio duration
  const loopedVideoPath = path.join(tempDir, `looped-${Date.now()}.mp4`);
  await loopVideoToLength({
    inputVideoPath: baseVideoPath,
    outputPath: loopedVideoPath,
    targetDuration: duration,
    crossfadeDuration: 0.5,
  });
  console.log('[Video] Looped video created');

  // Cleanup base video
  await fs.unlink(baseVideoPath).catch(() => {});

  // Step 3: Apply cinematic micro-effects (zoom, grain, light flicker)
  const effects = cinematicEffects || getRandomCinematicEffects();
  const cinematicFilter = buildCinematicFilter(duration, effects);
  console.log('[Video] Cinematic effects:', {
    zoom: effects.enableZoom ? effects.zoomIntensity : 'disabled',
    lightFlicker: effects.enableLightFlicker ? effects.flickerIntensity : 'disabled',
    grain: effects.enableGrain ? effects.grainIntensity : 'disabled',
  });
  
  let effectsVideoPath = loopedVideoPath;
  
  // Apply cinematic effects if any are enabled
  if (cinematicFilter) {
    effectsVideoPath = path.join(tempDir, `cinematic-${Date.now()}.mp4`);
    await applyCinematicEffects({
      inputPath: loopedVideoPath,
      outputPath: effectsVideoPath,
      filter: cinematicFilter,
    });
    console.log('[Video] Cinematic effects applied');
    await fs.unlink(loopedVideoPath).catch(() => {});
  }

  // Step 4: If no lyrics, just combine with audio
  if (lyrics.length === 0) {
    console.log('[Video] No lyrics, combining video and audio');
    await combineVideoAndAudio({
      videoPath: effectsVideoPath,
      audioPath,
      outputPath,
    });
    if (effectsVideoPath !== loopedVideoPath) {
      await fs.unlink(effectsVideoPath).catch(() => {});
    }
    return outputPath;
  }

  // Step 5: Add lyrics overlay with dynamic positions
  const assPath = path.join(tempDir, `lyrics-${Date.now()}.ass`);
  await generateASSFile(lyrics, assPath, styleVariation);

  const escapedAssPath = escapeFilterPath(assPath);
  const videoFilter = `ass=${escapedAssPath}`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(effectsVideoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-vf', videoFilter,
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Video] FFmpeg command:', cmd.substring(0, 300) + '...');
      })
      .on('end', async () => {
        console.log('[Video] Animated video with lyrics created:', outputPath);
        // Cleanup temp files
        await Promise.all([
          effectsVideoPath !== loopedVideoPath ? fs.unlink(effectsVideoPath) : Promise.resolve(),
          fs.unlink(assPath),
        ].map(p => p.catch(() => {})));
        resolve(outputPath);
      })
      .on('error', async (err: Error) => {
        console.error('[Video] FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Apply cinematic micro-effects (zoom, grain, light flicker) to video
 */
async function applyCinematicEffects(params: {
  inputPath: string;
  outputPath: string;
  filter: string;
}): Promise<void> {
  const { inputPath, outputPath, filter } = params;

  console.log('[Video] Applying cinematic effects filter:', filter.substring(0, 100) + '...');

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-vf', filter,
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('[Video] Cinematic effects applied successfully');
        resolve();
      })
      .on('error', (err: Error) => {
        console.error('[Video] Cinematic effects error:', err.message);
        // If filter fails, just copy the input to output
        console.log('[Video] Falling back to original video without cinematic effects');
        fs.copyFile(inputPath, outputPath)
          .then(() => resolve())
          .catch(reject);
      })
      .run();
  });
}

/**
 * Concatenate multiple clips with crossfade transitions
 */
async function concatenateClipsWithCrossfade(params: {
  clipPaths: string[];
  outputPath: string;
  crossfadeDuration: number;
}): Promise<string> {
  const { clipPaths, outputPath, crossfadeDuration } = params;

  console.log('[Video] Concatenating', clipPaths.length, 'clips with crossfade');

  if (clipPaths.length === 1) {
    // Just copy the single clip
    await fs.copyFile(clipPaths[0], outputPath);
    return outputPath;
  }

  // Get duration of first clip to calculate offsets
  const clipDuration = await getVideoDuration(clipPaths[0]);
  
  // Build xfade filter chain
  const filterParts: string[] = [];
  let lastOutput = '0:v';

  for (let i = 1; i < clipPaths.length; i++) {
    const outputLabel = i === clipPaths.length - 1 ? 'outv' : `v${i}`;
    const offset = (clipDuration - crossfadeDuration) * i;
    filterParts.push(
      `[${lastOutput}][${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset.toFixed(2)}[${outputLabel}]`
    );
    lastOutput = outputLabel;
  }

  const filterComplex = filterParts.join(';');
  console.log('[Video] Concat filter:', filterComplex);

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    
    // Add all inputs
    for (const clipPath of clipPaths) {
      command.input(clipPath);
    }
    
    command
      .complexFilter(filterComplex, 'outv')
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-an',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[Video] Concat command:', cmd.substring(0, 300) + '...');
      })
      .on('end', () => {
        console.log('[Video] Concatenated video created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[Video] Concat error:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Resize/crop video for YouTube Shorts (9:16 aspect ratio)
 */
export async function convertToShortsFormat(params: {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
}): Promise<string> {
  const { inputPath, outputPath, startTime, duration } = params;

  console.log('[Video] Converting to Shorts format (9:16)');
  console.log('[Video] Start:', startTime, 'Duration:', duration);

  // Scale and crop to 9:16 (1080x1920)
  // First scale to fit width, then crop height
  const videoFilter = 'scale=1080:-2,crop=1080:1920:0:(ih-1920)/2';

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .inputOptions([
        '-ss', String(startTime),
      ])
      .outputOptions([
        '-t', String(duration),
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
        console.log('[Video] Shorts conversion command:', cmd);
      })
      .on('end', () => {
        console.log('[Video] Shorts video created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[Video] Shorts conversion error:', err.message);
        reject(err);
      })
      .run();
  });
}
