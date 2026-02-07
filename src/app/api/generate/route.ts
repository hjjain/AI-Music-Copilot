import { NextRequest, NextResponse } from 'next/server';
import { runGenerationPipeline } from '@/lib/pipeline';
import { SONG_CATEGORIES, getRandomCategory } from '@/lib/prompts/categories';

/**
 * POST /api/generate
 * Trigger song generation pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const {
      categoryId,
      uploadToYouTube = true,
      privacyStatus = 'private',
    } = body;

    // Validate category if provided
    if (categoryId) {
      const validCategory = SONG_CATEGORIES.find((c) => c.id === categoryId);
      if (!validCategory) {
        return NextResponse.json(
          { 
            error: 'Invalid category', 
            validCategories: SONG_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
          },
          { status: 400 }
        );
      }
    }

    // Validate privacy status
    if (!['private', 'unlisted', 'public'].includes(privacyStatus)) {
      return NextResponse.json(
        { error: 'Invalid privacy status. Must be: private, unlisted, or public' },
        { status: 400 }
      );
    }

    console.log('[API] Starting generation pipeline');
    console.log('[API] Category:', categoryId || 'random');
    console.log('[API] Upload to YouTube:', uploadToYouTube);
    console.log('[API] Privacy status:', privacyStatus);

    // Run the pipeline
    const job = await runGenerationPipeline({
      categoryId,
      uploadToYouTube,
      privacyStatus,
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        category: job.category.name,
        song: job.song ? {
          title: job.song.title,
          duration: job.song.duration,
        } : null,
        youtube: job.youtube,
        logs: job.logs,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[API] Generation failed:', err.message);
    
    return NextResponse.json(
      { 
        error: 'Generation failed',
        message: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate
 * Get available categories
 */
export async function GET() {
  const categories = SONG_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    genres: c.genres,
    moods: c.moods,
  }));

  const randomCategory = getRandomCategory();

  return NextResponse.json({
    categories,
    randomSuggestion: {
      id: randomCategory.id,
      name: randomCategory.name,
    },
  });
}
