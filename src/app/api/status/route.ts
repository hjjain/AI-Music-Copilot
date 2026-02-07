import { NextResponse } from 'next/server';
import { isYouTubeConfigured } from '@/lib/youtube/client';
import { checkAuthState } from '@/lib/youtube/auth';

/**
 * GET /api/status
 * Get system status and configuration
 */
export async function GET() {
  // Check environment variables
  const envStatus = {
    suno: {
      configured: !!process.env.SUNO_API_KEY,
      apiUrl: process.env.SUNO_API_URL || 'https://api.acedata.cloud/suno/audios',
    },
    replicate: {
      configured: !!process.env.REPLICATE_API_TOKEN,
    },
    youtube: {
      clientConfigured: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
      authenticated: !!process.env.YOUTUBE_REFRESH_TOKEN,
    },
  };

  // Check YouTube auth state
  let youtubeState = null;
  if (envStatus.youtube.clientConfigured && envStatus.youtube.authenticated) {
    try {
      youtubeState = await checkAuthState();
    } catch {
      youtubeState = { isAuthenticated: false, error: 'Failed to verify YouTube connection' };
    }
  }

  // Overall status
  const isReady = envStatus.suno.configured && envStatus.replicate.configured;
  const canUpload = isYouTubeConfigured();

  return NextResponse.json({
    status: isReady ? 'ready' : 'not_configured',
    canGenerate: isReady,
    canUploadToYouTube: canUpload,
    services: {
      suno: envStatus.suno,
      replicate: envStatus.replicate,
      youtube: {
        ...envStatus.youtube,
        channel: youtubeState?.isAuthenticated ? {
          id: youtubeState.channelId,
          name: youtubeState.channelName,
        } : null,
      },
    },
    missingConfig: [
      !envStatus.suno.configured && 'SUNO_API_KEY',
      !envStatus.replicate.configured && 'REPLICATE_API_TOKEN',
      !envStatus.youtube.clientConfigured && 'YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET',
      !envStatus.youtube.authenticated && 'YOUTUBE_REFRESH_TOKEN (need to authenticate)',
    ].filter(Boolean),
  });
}
