/**
 * Kling 2.6 API Client
 * 
 * Top-tier image-to-video with cinematic visuals, fluid motion
 * Generates video with native audio support
 * https://replicate.com/kwaivgi/kling-v2.6
 */

import axios from 'axios';
import { retryApiCall } from '@/lib/utils/retry';

// Using Kling 2.6 - Latest version with cinematic visuals and native audio
const KLING_API_URL = 'https://api.replicate.com/v1/models/kwaivgi/kling-v2.6/predictions';

export type AspectRatio = '16:9' | '9:16' | '1:1';

interface KlingPrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  urls?: {
    get: string;
  };
}

/**
 * Generate an animated video from an image using Kling 2.6
 * Creates cinematic videos with fluid motion from static images
 * 
 * @param imageUrl - URL of the source image (must be publicly accessible)
 * @param prompt - Motion/animation prompt describing scene, motion, and audio
 * @param aspectRatio - Output aspect ratio: '16:9' for main video, '9:16' for shorts
 * @param motionType - Kept for compatibility
 * @returns URL of the generated video
 */
export async function generateVideoFromImage(params: {
  imageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  motionType?: string;
}): Promise<string> {
  const { imageUrl, prompt, aspectRatio } = params;
  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  console.log('[Kling 2.6] Generating cinematic video');
  console.log('[Kling 2.6] Image URL:', imageUrl);
  console.log('[Kling 2.6] Aspect Ratio:', aspectRatio);
  console.log('[Kling 2.6] Animation Prompt:', prompt);

  // Build the request payload for Kling 2.6
  // Note: generate_audio is OFF since we use our own Suno music
  const requestBody = {
    input: {
      image: imageUrl,          // Source image to animate
      prompt: prompt,           // Cinematic prompt with scene/motion details
      duration: 5,              // 5 seconds per clip
      aspect_ratio: aspectRatio,
      generate_audio: false,    // We use Suno audio, not native
      negative_prompt: 'blurry, low quality, distorted, ugly, deformed, static, frozen',
    },
  };

  return retryApiCall(async () => {
    try {
      // Start the prediction
      const response = await axios.post(KLING_API_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          Prefer: 'wait', // Try to wait for result
        },
        timeout: 300000, // 5 minutes timeout
      });

      console.log('[Kling 2.6] Prediction response status:', response.status);

      // Check if we got output directly (synchronous response)
      if (response.data?.output) {
        const videoUrl = extractVideoUrl(response.data.output);
        if (videoUrl) {
          console.log('[Kling 2.6] Video generated (sync):', videoUrl);
          return videoUrl;
        }
      }

      // If no immediate output, poll for completion
      const statusUrl = response.data?.urls?.get;
      if (!statusUrl && response.data?.id) {
        const pollUrl = `https://api.replicate.com/v1/predictions/${response.data.id}`;
        return await pollForKlingResult(pollUrl, apiToken);
      }
      
      if (statusUrl) {
        return await pollForKlingResult(statusUrl, apiToken);
      }

      throw new Error('No status URL returned from Kling API');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string };
      console.error('[Kling 2.6] Generation failed:', axiosError.response?.data || axiosError.message);
      
      const statusCode = axiosError.response?.status;
      const errorMsg = statusCode
        ? `Kling video generation failed (${statusCode}): ${axiosError.message}`
        : `Kling video generation failed: ${axiosError.message}`;
      throw new Error(errorMsg);
    }
  }, 'Kling video generation');
}

/**
 * Poll for Kling prediction result
 */
async function pollForKlingResult(statusUrl: string, apiToken: string): Promise<string> {
  const maxAttempts = 120; // 4 minutes max (2s intervals) - Kling 2.6 has more processing
  const pollInterval = 2000;
  let attempts = 0;

  console.log('[Kling 2.6] Polling for result...');

  while (attempts < maxAttempts) {
    await sleep(pollInterval);
    attempts++;

    try {
      const statusResponse = await axios.get<KlingPrediction>(statusUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const status = statusResponse.data?.status;
      console.log(`[Kling 2.6] Poll attempt ${attempts}: ${status}`);

      if (status === 'succeeded') {
        const videoUrl = extractVideoUrl(statusResponse.data.output);
        if (videoUrl) {
          console.log('[Kling 2.6] Video generated (poll):', videoUrl);
          return videoUrl;
        }
        throw new Error('Prediction succeeded but no output URL found');
      }

      if (status === 'failed') {
        throw new Error(statusResponse.data?.error || 'Kling prediction failed');
      }

      if (status === 'canceled') {
        throw new Error('Kling prediction was canceled');
      }
    } catch (error: unknown) {
      const axiosError = error as { message?: string };
      if (axiosError.message?.includes('Prediction') || axiosError.message?.includes('Kling')) {
        throw error;
      }
      console.warn(`[Kling 2.6] Poll error (attempt ${attempts}):`, axiosError.message);
    }
  }

  throw new Error('Kling video generation timed out');
}

/**
 * Extract video URL from Kling output
 */
function extractVideoUrl(output: unknown): string | null {
  if (!output) return null;

  // Direct string URL
  if (typeof output === 'string') {
    return output;
  }

  // Array of URLs
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        if (typeof obj.url === 'string') return obj.url;
      }
    }
  }

  // Object with url property
  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
  }

  return null;
}

/**
 * Download video from URL
 */
export async function downloadVideo(videoUrl: string): Promise<Buffer> {
  console.log('[Kling 2.6] Downloading video from:', videoUrl);

  return retryApiCall(async () => {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minutes for video download
    });

    if (!response.data) {
      throw new Error('No data received from video download');
    }

    console.log('[Kling 2.6] Video downloaded, size:', response.data.length, 'bytes');
    return Buffer.from(response.data);
  }, 'Kling video download');
}

/**
 * Cinematic animation prompts for Kling 2.6
 * Optimized for fluid motion and cinematic visuals
 * Each theme has 3 distinct prompts for variety
 */
const ANIMATION_PROMPT_SETS: Record<string, string[]> = {
  'first-love': [
    'Cinematic slow-motion, cherry blossom petals falling through golden sunlight, gentle wind moving through hair, soft bokeh background, romantic atmosphere, Studio Ghibli aesthetic',
    'Dreamy soft-focus scene, characters slightly swaying, warm sunlight streaming through leaves creating dancing shadows, butterflies floating, magical first love feeling',
    'Gentle camera drift, hair flowing in soft breeze, flowers swaying, lens flare from setting sun, innocent romantic glow, anime movie quality',
  ],
  'deep-love': [
    'Intimate cinematic moment, soft breathing motion, candlelight flickering warmly, gentle shadows dancing on walls, cozy atmosphere, deep emotional connection',
    'Close-up romantic scene, subtle embrace movement, twinkling fairy lights in background, warm amber tones, tender loving gaze, cinematic depth',
    'Soft natural movement, intertwined fingers gently shifting, warm window light, floating dust particles, peaceful domestic intimacy, film-like quality',
  ],
  'heartbreak': [
    'Melancholic cinematic scene, rain streaming down window glass, droplets creating patterns, cold blue tones, character reflection barely visible, emotional rainfall',
    'Slow emotional movement, curtains gently swaying in night breeze, moonlight casting long shadows, empty chair, nostalgic photographs visible, bittersweet atmosphere',
    'Cinematic rain scene, wet streets reflecting city lights, lonely figure, rain falling in slow motion, emotional depth, art film aesthetic',
  ],
  'monsoon-romance': [
    'Beautiful monsoon rain falling, umbrella swaying gently, water splashing in puddles, romantic wet streets, warm despite rain, Bollywood rain song aesthetic',
    'Cinematic rain dance moment, droplets in slow motion, wet hair movement, puddle reflections, joyful romantic atmosphere, vibrant colors despite grey sky',
    'Cozy monsoon scene, rain on window, chai steam rising, two cups, comfortable intimacy, sound of rain, warm indoor lighting',
  ],
  'long-distance': [
    'Night city skyline, twinkling lights like stars, lonely figure by window, phone screen glowing blue, emotional distance visible, cinematic longing',
    'Split-scene feeling, train passing in background, nostalgic motion blur, looking at old photographs, memories floating, emotional depth',
    'Late night video call glow, tired but loving eyes, city lights outside window, digital connection across distance, intimate despite screens',
  ],
  'night-romance': [
    'Starry night sky, shooting star, soft breeze moving hair, rooftop silhouettes, city lights below, magical midnight moment, cinematic romance',
    'Moonlight on water, gentle ripples, night breeze, intimate stargazing, warm blanket visible, peaceful cosmic beauty, Makoto Shinkai style',
    'City night lights, gentle movement, intimate rooftop conversation, neon reflections, urban romance, cinematic night photography aesthetic',
  ],
  'confession': [
    'Golden hour confession scene, sunset painting sky orange and pink, nervous hands, deep breaths visible, emotional anticipation, cinematic tension',
    'Dramatic sunset moment, petals slowly falling, time slowing down, heartfelt gaze, hope and fear mixed, film climax feeling',
    'Beautiful twilight, warm golden light on faces, emotional vulnerability, gentle wind, romantic atmosphere building, anime confession scene',
  ],
  'wedding-love': [
    'Festive Indian wedding scene, marigold decorations swaying, fairy lights twinkling, joyful colors, traditional celebration, Bollywood wedding aesthetic',
    'Beautiful mandap scene, sacred fire flickering, flowers swaying gently, emotional ceremony moment, cultural richness, cinematic celebration',
    'Mehndi night atmosphere, colorful lights, dancing shadows, joyful movement, traditional music feeling, vibrant celebration energy',
  ],
};

/**
 * Get a single random animation prompt for a theme
 */
export function getAnimationPrompt(theme: string): string {
  const prompts = ANIMATION_PROMPT_SETS[theme] || ANIMATION_PROMPT_SETS['deep-love'];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Get 3 distinct animation prompts for a theme
 * Used for generating multiple Kling clips for variety
 */
export function getAnimationPromptSet(theme: string): string[] {
  const prompts = ANIMATION_PROMPT_SETS[theme] || ANIMATION_PROMPT_SETS['deep-love'];
  // Return all 3 prompts (or shuffle if we have more)
  return [...prompts].slice(0, 3);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
