import { NextRequest, NextResponse } from 'next/server';
import { 
  generateRomanticPrompt, 
  previewPrompt,
  regenerateTitle,
  regenerateImagePrompt,
  regenerateMusicPrompt,
} from '@/lib/prompts/romantic-generator';

/**
 * GET /api/romantic/prompt
 * Generate a new romantic prompt (random or by theme)
 * Enhanced with MMS_BACKEND style prompts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const themeId = searchParams.get('themeId') || undefined;
    
    const prompt = generateRomanticPrompt(themeId);
    
    return NextResponse.json({
      prompt: {
        title: prompt.title,
        theme: {
          id: prompt.theme.id,
          name: prompt.theme.name,
          nameHindi: prompt.theme.nameHindi,
          description: prompt.theme.description,
          emotions: prompt.theme.emotions,
          colorMood: prompt.theme.colorMood,
        },
        musicPrompt: prompt.musicPrompt,       // Short for Suno API
        fullPrompt: prompt.fullPrompt,         // Detailed for display
        style: prompt.style,
        imagePrompt: prompt.imagePrompt,
        emotionIntensity: prompt.emotionIntensity, // For video micro-variations
        playlistInfo: prompt.playlistInfo,         // For YouTube playlist auto-add
        references: prompt.references,
      },
    });
  } catch (error) {
    console.error('Failed to generate prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/romantic/prompt
 * Regenerate specific parts of a prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, themeId } = body;
    
    // Get current prompt
    const prompt = previewPrompt(themeId);
    
    let result = {
      title: prompt.title,
      musicPrompt: prompt.musicPrompt,
      imagePrompt: prompt.imagePrompt,
    };
    
    // Regenerate specific parts
    switch (action) {
      case 'title':
        result.title = regenerateTitle(prompt.theme);
        break;
      case 'music':
        result.musicPrompt = regenerateMusicPrompt(prompt.theme);
        break;
      case 'image':
        result.imagePrompt = regenerateImagePrompt(prompt.theme);
        break;
      case 'all':
        // Return full new prompt
        const newPrompt = generateRomanticPrompt(themeId);
        return NextResponse.json({ prompt: newPrompt });
    }
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to regenerate prompt:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate prompt' },
      { status: 500 }
    );
  }
}
