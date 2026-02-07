import { google } from 'googleapis';
import fs from 'fs';
import { YouTubeUploadConfig, YouTubeUploadResult } from '@/types';
import { retryApiCall } from '@/lib/utils/retry';

/**
 * YouTube API Configuration
 */
const YOUTUBE_API_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
];

/**
 * Create OAuth2 client for YouTube API
 */
export function createOAuth2Client() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

  if (!clientId || !clientSecret) {
    throw new Error('YouTube OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get authorization URL for YouTube OAuth
 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: YOUTUBE_API_SCOPES,
    prompt: 'consent', // Force consent to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from YouTube');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Get authenticated YouTube client
 */
export function getAuthenticatedClient() {
  const oauth2Client = createOAuth2Client();
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error('YouTube refresh token not configured. Please authenticate first.');
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.youtube({ version: 'v3', auth: oauth2Client });
}

/**
 * Upload a video to YouTube
 */
export async function uploadVideo(config: YouTubeUploadConfig): Promise<YouTubeUploadResult> {
  const youtube = getAuthenticatedClient();

  console.log('[YouTube] Starting upload:', config.title);
  console.log('[YouTube] Video path:', config.videoPath);
  console.log('[YouTube] Is Short:', config.isShort);

  // Prepare video metadata
  const requestBody = {
    snippet: {
      title: config.title,
      description: config.description,
      tags: config.tags,
      categoryId: config.categoryId || '10', // Music category
    },
    status: {
      privacyStatus: config.privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  return retryApiCall(async () => {
    try {
      // Need to recreate stream for each retry attempt
      const mediaStream = {
        body: fs.createReadStream(config.videoPath),
      };

      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody,
        media: mediaStream,
      });

      const videoId = response.data.id;
      if (!videoId) {
        throw new Error('No video ID returned from YouTube');
      }

      const result: YouTubeUploadResult = {
        videoId,
        url: config.isShort 
          ? `https://youtube.com/shorts/${videoId}`
          : `https://youtube.com/watch?v=${videoId}`,
        title: config.title,
      };

      console.log('[YouTube] Upload successful:', result.url);
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown; status?: number } };
      console.error('[YouTube] Upload failed:', err.message);
      console.error('[YouTube] Error details:', err.response?.data);
      
      // Include status code in error message for retry logic
      const statusCode = err.response?.status;
      const errorMsg = statusCode 
        ? `YouTube upload failed (${statusCode}): ${err.message}`
        : `YouTube upload failed: ${err.message}`;
      throw new Error(errorMsg);
    }
  }, 'YouTube upload');
}

/**
 * Get channel info for the authenticated user
 */
export async function getChannelInfo(): Promise<{
  id: string;
  title: string;
  customUrl?: string;
  subscriberCount: string;
}> {
  const youtube = getAuthenticatedClient();

  const response = await youtube.channels.list({
    part: ['snippet', 'statistics'],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel) {
    throw new Error('No channel found for authenticated user');
  }

  return {
    id: channel.id || '',
    title: channel.snippet?.title || '',
    customUrl: channel.snippet?.customUrl || undefined,
    subscriberCount: channel.statistics?.subscriberCount || '0',
  };
}

/**
 * Check if YouTube is properly configured
 */
export function isYouTubeConfigured(): boolean {
  return !!(
    process.env.YOUTUBE_CLIENT_ID &&
    process.env.YOUTUBE_CLIENT_SECRET &&
    process.env.YOUTUBE_REFRESH_TOKEN
  );
}

/**
 * Generate video description with lyrics
 */
export function generateVideoDescription(params: {
  title: string;
  category: string;
  lyrics: string;
  isShort?: boolean;
}): string {
  const { title, category, lyrics, isShort } = params;

  if (isShort) {
    return `${title} - AI Generated Music

Category: ${category}

Full video on our channel!

#Shorts #AIMusic #${category.replace(/\s+/g, '')} #Music`;
  }

  return `${title} - AI Generated Music

Category: ${category}

--- LYRICS ---
${lyrics}

---

This song was generated using AI technology.
Subscribe for more AI-generated music!

#AIMusic #${category.replace(/\s+/g, '')} #Music #AI`;
}

/**
 * Generate tags for the video
 */
export function generateVideoTags(params: {
  title: string;
  category: string;
  genres: string[];
  moods: string[];
}): string[] {
  const { title, category, genres, moods } = params;

  const baseTags = [
    'AI Music',
    'AI Generated',
    'Music',
    title,
    category,
    'AI Song',
  ];

  const genreTags = genres.map((g) => g.replace(/\s+/g, ''));
  const moodTags = moods.map((m) => m.replace(/\s+/g, ''));

  // Combine and limit to 30 tags (YouTube limit)
  const allTags = [...new Set([...baseTags, ...genreTags, ...moodTags])];
  return allTags.slice(0, 30);
}

// ============================================
// PLAYLIST SUPPORT
// ============================================

/**
 * Cache for playlist IDs to avoid repeated API calls
 */
const playlistCache = new Map<string, string>();

/**
 * Find playlist by title
 * Returns playlist ID if found, null otherwise
 */
export async function findPlaylistByTitle(title: string): Promise<string | null> {
  // Check cache first
  const cached = playlistCache.get(title);
  if (cached) {
    return cached;
  }
  
  const youtube = getAuthenticatedClient();
  
  try {
    const response = await youtube.playlists.list({
      part: ['snippet'],
      mine: true,
      maxResults: 50,
    });
    
    const playlists = response.data.items || [];
    for (const playlist of playlists) {
      if (playlist.snippet?.title === title && playlist.id) {
        // Cache the result
        playlistCache.set(title, playlist.id);
        return playlist.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[YouTube] Error finding playlist:', error);
    return null;
  }
}

/**
 * Create a new playlist
 */
export async function createPlaylist(params: {
  title: string;
  description: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
}): Promise<string> {
  const { title, description, privacyStatus = 'public' } = params;
  
  const youtube = getAuthenticatedClient();
  
  console.log('[YouTube] Creating playlist:', title);
  
  const response = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus,
      },
    },
  });
  
  const playlistId = response.data.id;
  if (!playlistId) {
    throw new Error('Failed to create playlist - no ID returned');
  }
  
  // Cache the result
  playlistCache.set(title, playlistId);
  
  console.log('[YouTube] Playlist created:', playlistId);
  return playlistId;
}

/**
 * Get or create a playlist by title
 * If playlist exists, returns its ID; otherwise creates it
 */
export async function getOrCreatePlaylist(params: {
  title: string;
  description: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
}): Promise<string> {
  const { title, description, privacyStatus = 'public' } = params;
  
  // Try to find existing playlist
  const existingId = await findPlaylistByTitle(title);
  if (existingId) {
    console.log('[YouTube] Using existing playlist:', title, existingId);
    return existingId;
  }
  
  // Create new playlist
  return createPlaylist({ title, description, privacyStatus });
}

/**
 * Add a video to a playlist
 */
export async function addVideoToPlaylist(params: {
  videoId: string;
  playlistId: string;
}): Promise<void> {
  const { videoId, playlistId } = params;
  
  const youtube = getAuthenticatedClient();
  
  console.log('[YouTube] Adding video', videoId, 'to playlist', playlistId);
  
  try {
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
    });
    
    console.log('[YouTube] Video added to playlist successfully');
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    console.error('[YouTube] Failed to add video to playlist:', err.message);
    console.error('[YouTube] Error details:', err.response?.data);
    // Don't throw - playlist add is not critical
  }
}

/**
 * Auto-add video to appropriate playlist based on theme/playlist tag
 * Creates playlist if it doesn't exist
 */
export async function autoAddToPlaylist(params: {
  videoId: string;
  playlistInfo: { name: string; description: string };
}): Promise<void> {
  const { videoId, playlistInfo } = params;
  
  try {
    // Get or create the playlist
    const playlistId = await getOrCreatePlaylist({
      title: playlistInfo.name,
      description: playlistInfo.description,
      privacyStatus: 'public',
    });
    
    // Add video to playlist
    await addVideoToPlaylist({ videoId, playlistId });
  } catch (error) {
    console.error('[YouTube] Auto-add to playlist failed:', error);
    // Don't throw - playlist management is not critical
  }
}
