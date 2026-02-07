import { NextRequest, NextResponse } from 'next/server';
import { completeOAuthFlow } from '@/lib/youtube/auth';

/**
 * GET /api/youtube/callback
 * OAuth callback handler
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('[YouTube] OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate code
  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=No+authorization+code+received', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const result = await completeOAuthFlow(code);

    console.log('[YouTube] OAuth successful!');
    console.log('[YouTube] Channel:', result.channelInfo.title);
    console.log('[YouTube] Refresh Token:', result.refreshToken.substring(0, 20) + '...');

    // In production, you'd store this in a database
    // For now, redirect with success message and show the token to copy
    const params = new URLSearchParams({
      success: 'true',
      channelName: result.channelInfo.title,
      channelId: result.channelInfo.id,
      // In development, we show the refresh token so user can add it to .env
      refreshToken: result.refreshToken,
    });

    return NextResponse.redirect(
      new URL(`/settings?${params.toString()}`, request.url)
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[YouTube] OAuth callback error:', err.message);
    
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(err.message || 'Authentication failed')}`, request.url)
    );
  }
}
