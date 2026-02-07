import { NextResponse } from 'next/server';
import { getAllThemes, getThemeStats } from '@/lib/prompts/romantic-generator';

/**
 * GET /api/romantic/themes
 * Get all available romantic themes
 */
export async function GET() {
  try {
    const themes = getAllThemes();
    const stats = getThemeStats();
    
    return NextResponse.json({
      themes: themes.map(t => ({
        id: t.id,
        name: t.name,
        nameHindi: t.nameHindi,
        description: t.description,
        emotions: t.emotions,
        colorMood: t.colorMood,
      })),
      stats,
    });
  } catch (error) {
    console.error('Failed to get themes:', error);
    return NextResponse.json(
      { error: 'Failed to get themes' },
      { status: 500 }
    );
  }
}
