import axios from 'axios';
import { ReplicatePrediction } from '@/types';
import { retryApiCall } from '@/lib/utils/retry';

/**
 * Replicate API Configuration for Seedream 4.5
 * ByteDance's advanced text-to-image model with high quality output
 * https://replicate.com/bytedance/seedream-4.5
 */
const SEEDREAM_API_URL = 'https://api.replicate.com/v1/models/bytedance/seedream-4.5/predictions';

export type ImageAspectRatio = '16:9' | '9:16' | '1:1';

/**
 * Get image dimensions for aspect ratio
 * Seedream 4.5 supports custom width/height with max 4K
 */
function getImageDimensions(aspectRatio: ImageAspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      // 16:9 horizontal for main video (high quality)
      return { width: 1920, height: 1080 };
    case '9:16':
      // 9:16 vertical for shorts
      return { width: 1080, height: 1920 };
    case '1:1':
    default:
      // Square for album cover
      return { width: 1024, height: 1024 };
  }
}

/**
 * Generate an image using Replicate's Seedream 4.5 model
 * ByteDance's high-quality text-to-image model
 * 
 * @param prompt - Image description prompt
 * @param aspectRatio - '16:9' for main video, '9:16' for shorts, '1:1' for square
 */
export async function generateImage(prompt: string, aspectRatio: ImageAspectRatio = '16:9'): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  // Ensure prompt is not too long
  const safePrompt = prompt.length > 1500 ? prompt.substring(0, 1500) : prompt;
  const dimensions = getImageDimensions(aspectRatio);

  console.log('[Seedream] Generating image with Seedream 4.5');
  console.log('[Seedream] Aspect Ratio:', aspectRatio, '-> Dimensions:', `${dimensions.width}x${dimensions.height}`);
  console.log('[Seedream] Prompt:', safePrompt.substring(0, 100) + '...');

  const requestBody = {
    input: {
      prompt: safePrompt,
      size: '2K', // High quality
      width: dimensions.width,
      height: dimensions.height,
      max_images: 1,
      aspect_ratio: aspectRatio,
      sequential_image_generation: 'disabled', // Single image
    },
  };

  return retryApiCall(async () => {
    try {
      // Make request with "Prefer: wait" header for synchronous response
      const response = await axios.post(SEEDREAM_API_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          Prefer: 'wait', // Wait for result instead of polling
        },
        timeout: 180000, // 3 minutes timeout for high quality
      });

      // Check if we got output directly (synchronous response)
      if (response.data?.output) {
        const imageUrl = extractImageUrl(response.data.output);
        if (imageUrl) {
          console.log('[Seedream] Image generated (sync):', imageUrl);
          return imageUrl;
        }
      }

      // If no immediate output, we need to poll
      const statusUrl = response.data?.urls?.get;
      if (!statusUrl && response.data?.id) {
        const pollUrl = `https://api.replicate.com/v1/predictions/${response.data.id}`;
        return await pollForResult(pollUrl, apiToken);
      }
      
      if (statusUrl) {
        return await pollForResult(statusUrl, apiToken);
      }

      throw new Error('No status URL returned from Seedream');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string };
      console.error('[Seedream] Generation failed:', axiosError.response?.data || axiosError.message);
      
      // Include status code in error message for retry logic
      const statusCode = axiosError.response?.status;
      const errorMsg = statusCode 
        ? `Image generation failed (${statusCode}): ${axiosError.message}`
        : `Image generation failed: ${axiosError.message}`;
      throw new Error(errorMsg);
    }
  }, 'Seedream image generation');
}

/**
 * Poll for prediction result
 */
async function pollForResult(statusUrl: string, apiToken: string): Promise<string> {
  const maxAttempts = 90; // Increased for Seedream 4.5
  const pollInterval = 2000; // 2 seconds
  let attempts = 0;

  console.log('[Seedream] Polling for result...');

  while (attempts < maxAttempts) {
    await sleep(pollInterval);
    attempts++;

    try {
      const statusResponse = await axios.get<ReplicatePrediction>(statusUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const status = statusResponse.data?.status;
      console.log(`[Seedream] Poll attempt ${attempts}: ${status}`);

      if (status === 'succeeded') {
        const imageUrl = extractImageUrl(statusResponse.data.output);
        if (imageUrl) {
          console.log('[Seedream] Image generated (poll):', imageUrl);
          return imageUrl;
        }
        throw new Error('Prediction succeeded but no output URL found');
      }

      if (status === 'failed') {
        throw new Error(statusResponse.data?.error || 'Prediction failed');
      }

      if (status === 'canceled') {
        throw new Error('Prediction was canceled');
      }
    } catch (error: unknown) {
      const axiosError = error as { message?: string };
      if (axiosError.message?.includes('Prediction')) {
        throw error;
      }
      console.warn(`[Seedream] Poll error (attempt ${attempts}):`, axiosError.message);
    }
  }

  throw new Error('Image generation timed out');
}

/**
 * Extract image URL from Replicate output
 */
function extractImageUrl(output: unknown): string | null {
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
 * Generate multiple images using Seedream 4.5 with sequential generation
 * Perfect for generating 3 different scene images for video clips
 * 
 * @param prompts - Array of image prompts (one for each scene)
 * @param aspectRatio - Aspect ratio for all images
 * @returns Array of image URLs
 */
export async function generateMultipleImages(
  prompts: string[], 
  aspectRatio: ImageAspectRatio = '16:9'
): Promise<string[]> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const dimensions = getImageDimensions(aspectRatio);
  const numImages = prompts.length;

  console.log(`[Seedream] Generating ${numImages} images with sequential generation`);
  console.log('[Seedream] Aspect Ratio:', aspectRatio, '-> Dimensions:', `${dimensions.width}x${dimensions.height}`);

  // Generate images in parallel (each with its own prompt)
  const imagePromises = prompts.map(async (prompt, index) => {
    const safePrompt = prompt.length > 1500 ? prompt.substring(0, 1500) : prompt;
    console.log(`[Seedream] Image ${index + 1} prompt:`, safePrompt.substring(0, 80) + '...');

    const requestBody = {
      input: {
        prompt: safePrompt,
        size: '2K',
        width: dimensions.width,
        height: dimensions.height,
        max_images: 1,
        aspect_ratio: aspectRatio,
        sequential_image_generation: 'disabled',
      },
    };

    return retryApiCall(async () => {
      try {
        const response = await axios.post(SEEDREAM_API_URL, requestBody, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            Prefer: 'wait',
          },
          timeout: 180000,
        });

        if (response.data?.output) {
          const imageUrl = extractImageUrl(response.data.output);
          if (imageUrl) {
            console.log(`[Seedream] Image ${index + 1} generated:`, imageUrl);
            return imageUrl;
          }
        }

        const statusUrl = response.data?.urls?.get;
        if (!statusUrl && response.data?.id) {
          const pollUrl = `https://api.replicate.com/v1/predictions/${response.data.id}`;
          return await pollForResult(pollUrl, apiToken);
        }
        
        if (statusUrl) {
          return await pollForResult(statusUrl, apiToken);
        }

        throw new Error(`No status URL for image ${index + 1}`);
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string };
        console.error(`[Seedream] Image ${index + 1} failed:`, axiosError.response?.data || axiosError.message);
        throw new Error(`Image ${index + 1} generation failed: ${axiosError.message}`);
      }
    }, `Seedream image ${index + 1} generation`);
  });

  // Wait for all images
  const imageUrls = await Promise.all(imagePromises);
  console.log(`[Seedream] All ${numImages} images generated successfully`);
  
  return imageUrls;
}

/**
 * Download image from URL
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  console.log('[Seedream] Downloading image from:', imageUrl);
  
  return retryApiCall(async () => {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    if (!response.data) {
      throw new Error('No data received from image download');
    }

    console.log('[Seedream] Image downloaded, size:', response.data.length, 'bytes');
    return Buffer.from(response.data);
  }, 'Seedream image download');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
