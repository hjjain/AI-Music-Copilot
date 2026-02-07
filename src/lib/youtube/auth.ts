import { createOAuth2Client, getAuthUrl, exchangeCodeForTokens, getChannelInfo } from './client';

/**
 * YouTube OAuth flow handler
 * 
 * Flow:
 * 1. User clicks "Connect YouTube" button
 * 2. User is redirected to Google OAuth consent screen
 * 3. After consent, user is redirected back with auth code
 * 4. We exchange the code for tokens
 * 5. Store refresh token in environment (for local) or database (for production)
 */

export interface AuthState {
  isAuthenticated: boolean;
  channelId?: string;
  channelName?: string;
  error?: string;
}

/**
 * Start the OAuth flow - returns the authorization URL
 */
export function startOAuthFlow(): string {
  return getAuthUrl();
}

/**
 * Complete the OAuth flow - exchange code for tokens
 */
export async function completeOAuthFlow(code: string): Promise<{
  refreshToken: string;
  channelInfo: {
    id: string;
    title: string;
    customUrl?: string;
  };
}> {
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Temporarily set the refresh token to get channel info
  process.env.YOUTUBE_REFRESH_TOKEN = tokens.refreshToken;

  // Get channel information
  const channelInfo = await getChannelInfo();

  return {
    refreshToken: tokens.refreshToken,
    channelInfo: {
      id: channelInfo.id,
      title: channelInfo.title,
      customUrl: channelInfo.customUrl,
    },
  };
}

/**
 * Check current authentication state
 */
export async function checkAuthState(): Promise<AuthState> {
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  // Check if credentials are configured
  if (!clientId || !clientSecret) {
    return {
      isAuthenticated: false,
      error: 'YouTube API credentials not configured',
    };
  }

  // Check if we have a refresh token
  if (!refreshToken) {
    return {
      isAuthenticated: false,
      error: 'Not authenticated with YouTube',
    };
  }

  // Try to get channel info to verify token is valid
  try {
    const channelInfo = await getChannelInfo();
    return {
      isAuthenticated: true,
      channelId: channelInfo.id,
      channelName: channelInfo.title,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      isAuthenticated: false,
      error: `Authentication failed: ${err.message}`,
    };
  }
}

/**
 * Instructions for setting up YouTube API credentials
 */
export const SETUP_INSTRUCTIONS = `
## YouTube API Setup Instructions

1. Go to Google Cloud Console: https://console.cloud.google.com/

2. Create a new project or select existing one

3. Enable YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "YT Music Autopilot"
   - Authorized redirect URIs: http://localhost:3000/api/youtube/callback
   - Click "Create"

5. Configure consent screen (if not done):
   - Go to "OAuth consent screen"
   - Choose "External" user type
   - Fill in app name, user support email
   - Add scopes: youtube.upload, youtube, youtube.readonly
   - Add your email as test user

6. Copy credentials to .env.local:
   YOUTUBE_CLIENT_ID=your_client_id
   YOUTUBE_CLIENT_SECRET=your_client_secret

7. Click "Connect YouTube" in the app to authenticate
`;
