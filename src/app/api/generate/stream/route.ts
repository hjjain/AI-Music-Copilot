import { NextRequest } from 'next/server';
import { runGenerationPipeline, ManualPromptOptions } from '@/lib/pipeline';
import { SONG_CATEGORIES } from '@/lib/prompts/categories';
import { JobStatus } from '@/types';

/**
 * POST /api/generate/stream
 * Trigger song generation pipeline with SSE streaming progress updates
 * 
 * Supports two modes:
 * 1. Auto mode: Pass categoryId to generate from AI prompts
 * 2. Manual mode: Pass manualMode=true with custom prompts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const {
      // Auto mode params
      categoryId,
      // Manual mode params
      manualMode = false,
      manualTitle,
      manualPrompt,
      manualStyle,
      manualImagePrompt,
      themeId, // For Kling animation prompts & multi-image generation
      emotionIntensity, // For video micro-variations (high, medium, low)
      playlistInfo, // For YouTube playlist auto-add
      // Common params
      uploadToYouTube = true,
      privacyStatus = 'private',
      previewMode = false,
      useKlingAnimation = true, // Use Kling for animated backgrounds
    } = body;

    // Validate inputs based on mode
    if (manualMode) {
      // Manual mode requires at least a prompt
      if (!manualPrompt || typeof manualPrompt !== 'string' || !manualPrompt.trim()) {
        return new Response(
          JSON.stringify({ error: 'Manual mode requires a music prompt' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (categoryId) {
      // Auto mode - validate category if provided
      const validCategory = SONG_CATEGORIES.find((c) => c.id === categoryId);
      if (!validCategory) {
        return new Response(
          JSON.stringify({ error: 'Invalid category' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build manual prompt options if in manual mode
    const manualPromptOptions: ManualPromptOptions | undefined = manualMode ? {
      title: manualTitle?.trim() || undefined,
      prompt: manualPrompt.trim(),
      style: manualStyle?.trim() || undefined,
      imagePrompt: manualImagePrompt?.trim() || undefined,
      themeId: themeId || undefined, // For Kling animation prompts & multi-image
      emotionIntensity: emotionIntensity || undefined, // For video micro-variations
      playlistInfo: playlistInfo || undefined, // For YouTube playlist auto-add
    } : undefined;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Helper to send SSE messages
        const sendEvent = (event: string, data: object) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Send initial connection message
        sendEvent('connected', { message: 'Pipeline started' });

        try {
          // Run the pipeline with progress callback
          const job = await runGenerationPipeline({
            categoryId: manualMode ? undefined : categoryId,
            manualPrompt: manualPromptOptions,
            uploadToYouTube: previewMode ? false : uploadToYouTube,
            privacyStatus,
            previewMode,
            useKlingAnimation, // Use Kling for animated backgrounds
            onStatusChange: (status: JobStatus, message: string) => {
              sendEvent('progress', {
                status,
                message,
                timestamp: new Date().toISOString(),
              });
            },
          });

          // Build preview URLs if in preview mode
          const preview = previewMode ? {
            video: `/api/preview/temp/${job.id}-video.mp4`,
            shorts: [
              `/api/preview/temp/${job.id}-video-short-1.mp4`,
              `/api/preview/temp/${job.id}-video-short-2.mp4`,
              `/api/preview/temp/${job.id}-video-short-3.mp4`,
            ],
            image: `/api/preview/temp/${job.id}-cover.png`,
            audio: `/api/preview/temp/${job.id}-audio.mp3`,
          } : null;

          // Send completion event
          sendEvent('complete', {
            success: true,
            previewMode,
            job: {
              id: job.id,
              status: job.status,
              category: job.category.name,
              song: job.song ? {
                title: job.song.title,
                duration: job.song.duration,
                lyrics: job.song.lyrics,
              } : null,
              youtube: job.youtube,
              preview,
            },
          });
        } catch (error: unknown) {
          const err = error as { message?: string };
          sendEvent('error', {
            success: false,
            error: err.message || 'Generation failed',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return new Response(
      JSON.stringify({ error: 'Failed to start generation', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
