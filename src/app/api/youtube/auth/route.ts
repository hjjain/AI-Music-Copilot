import { NextRequest, NextResponse } from 'next/server';
import { startOAuthFlow, checkAuthState, SETUP_INSTRUCTIONS } from '@/lib/youtube/auth';

/**
 * GET /api/youtube/auth
 * Get authentication status or start OAuth flow
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Check if requesting auth URL
  if (action === 'start') {
    try {
      const authUrl = startOAuthFlow();
      return NextResponse.json({ authUrl });
    } catch (error: unknown) {
      const err = error as { message?: string };
      return NextResponse.json(
        { 
          error: 'Failed to generate auth URL',
          message: err.message,
          setupInstructions: SETUP_INSTRUCTIONS,
        },
        { status: 500 }
      );
    }
  }

  // Return current auth state
  const state = await checkAuthState();
  
  return NextResponse.json({
    ...state,
    setupInstructions: !state.isAuthenticated ? SETUP_INSTRUCTIONS : undefined,
  });
}
