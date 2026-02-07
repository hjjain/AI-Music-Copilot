'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SystemStatus {
  status: string;
  canGenerate: boolean;
  canUploadToYouTube: boolean;
  services: {
    suno: { configured: boolean };
    replicate: { configured: boolean };
    youtube: {
      clientConfigured: boolean;
      authenticated: boolean;
      channel?: { id: string; name: string };
    };
  };
  missingConfig: string[];
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // OAuth callback results
  const success = searchParams.get('success') === 'true';
  const channelName = searchParams.get('channelName');
  const refreshToken = searchParams.get('refreshToken');
  const error = searchParams.get('error');

  // Fetch system status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then(setSystemStatus)
      .catch(console.error);
  }, [success]);

  // Handle YouTube connection
  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/youtube/auth?action=start');
      const data = await res.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert(data.error || 'Failed to start authentication');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      alert('Failed to connect to YouTube');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="mt-2 text-white/60">
          Configure your API keys and YouTube connection.
        </p>
      </div>

      {/* OAuth Success Message */}
      {success && refreshToken && (
        <div className="mb-6 rounded-xl border border-green-500/50 bg-green-500/10 p-6">
          <h3 className="text-lg font-semibold text-green-400">
            YouTube Connected Successfully!
          </h3>
          <p className="mt-1 text-white/70">Connected to channel: {channelName}</p>
          <div className="mt-4">
            <p className="text-sm text-white/50">
              Add this refresh token to your <code className="rounded bg-white/10 px-1">.env.local</code> file:
            </p>
            <div className="mt-2 overflow-x-auto rounded-lg bg-black/50 p-4">
              <code className="text-xs text-green-400">
                YOUTUBE_REFRESH_TOKEN={refreshToken}
              </code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(`YOUTUBE_REFRESH_TOKEN=${refreshToken}`)}
              className="mt-2 rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* OAuth Error Message */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-6">
          <h3 className="text-lg font-semibold text-red-400">Authentication Failed</h3>
          <p className="mt-1 text-white/70">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Status */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">System Status</h2>
          
          {systemStatus ? (
            <div className="space-y-4">
              {/* Suno Status */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${systemStatus.services.suno.configured ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">Suno API</p>
                    <p className="text-xs text-white/50">Song generation</p>
                  </div>
                </div>
                <span className={`text-sm ${systemStatus.services.suno.configured ? 'text-green-400' : 'text-red-400'}`}>
                  {systemStatus.services.suno.configured ? 'Configured' : 'Not configured'}
                </span>
              </div>

              {/* Replicate Status */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${systemStatus.services.replicate.configured ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">Replicate API</p>
                    <p className="text-xs text-white/50">Image generation</p>
                  </div>
                </div>
                <span className={`text-sm ${systemStatus.services.replicate.configured ? 'text-green-400' : 'text-red-400'}`}>
                  {systemStatus.services.replicate.configured ? 'Configured' : 'Not configured'}
                </span>
              </div>

              {/* YouTube Status */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${systemStatus.services.youtube.authenticated ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium">YouTube</p>
                    <p className="text-xs text-white/50">
                      {systemStatus.services.youtube.channel
                        ? systemStatus.services.youtube.channel.name
                        : 'Video upload'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${systemStatus.services.youtube.authenticated ? 'text-green-400' : 'text-yellow-400'}`}>
                  {systemStatus.services.youtube.authenticated ? 'Connected' : 'Not connected'}
                </span>
              </div>

              {/* Missing Config */}
              {systemStatus.missingConfig.length > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <p className="text-sm font-medium text-yellow-400">Missing Configuration</p>
                  <ul className="mt-2 space-y-1">
                    {systemStatus.missingConfig.map((config, i) => (
                      <li key={i} className="text-xs text-white/60">
                        • {config}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-white/10" />
              ))}
            </div>
          )}
        </div>

        {/* YouTube Connection */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">YouTube Connection</h2>
          
          {systemStatus?.services.youtube.authenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-400">Connected</p>
                  <p className="text-sm text-white/60">
                    {systemStatus.services.youtube.channel?.name || 'YouTube Channel'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/50">
                Your YouTube channel is connected. You can now upload videos automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-white/70">
                Connect your YouTube channel to automatically upload generated songs.
              </p>
              
              {!systemStatus?.services.youtube.clientConfigured && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
                  <p className="font-medium text-yellow-400">Setup Required</p>
                  <p className="mt-1 text-white/60">
                    First, add your YouTube API credentials to <code className="rounded bg-white/10 px-1">.env.local</code>:
                  </p>
                  <div className="mt-2 overflow-x-auto rounded bg-black/50 p-3 font-mono text-xs text-white/70">
                    YOUTUBE_CLIENT_ID=your_client_id<br />
                    YOUTUBE_CLIENT_SECRET=your_client_secret
                  </div>
                </div>
              )}

              <button
                onClick={handleConnectYouTube}
                disabled={isConnecting || !systemStatus?.services.youtube.clientConfigured}
                className={`flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors ${
                  isConnecting || !systemStatus?.services.youtube.clientConfigured
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-red-700'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {isConnecting ? 'Connecting...' : 'Connect YouTube Channel'}
              </button>
            </div>
          )}
        </div>

        {/* Environment Variables Reference */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Environment Variables</h2>
          <p className="mb-4 text-sm text-white/60">
            Create a <code className="rounded bg-white/10 px-1">.env.local</code> file in the project root with these variables:
          </p>
          <div className="overflow-x-auto rounded-lg bg-black/50 p-4 font-mono text-sm">
            <pre className="text-white/70">{`# Suno API (Required)
SUNO_API_KEY=your_suno_api_key
SUNO_API_URL=https://api.acedata.cloud/suno/audios
SUNO_TIMING_URL=https://api.acedata.cloud/suno/timing
SUNO_MODEL=chirp-v4

# Replicate API (Required)
REPLICATE_API_TOKEN=your_replicate_token

# YouTube API (Optional - for auto-upload)
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=your_refresh_token_after_oauth`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageLoading />}>
      <SettingsPageContent />
    </Suspense>
  );
}
