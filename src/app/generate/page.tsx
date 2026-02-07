'use client';

import { useState, useEffect, Suspense, useRef } from 'react';

interface RomanticTheme {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  emotions: string[];
  colorMood: string;
}

interface GeneratedPrompt {
  title: string;
  theme: RomanticTheme;
  musicPrompt: string;   // Short for Suno API
  fullPrompt: string;    // Detailed for display
  style: string;
  imagePrompt: string;
  emotionIntensity: 'high' | 'medium' | 'low'; // For video micro-variations
  playlistInfo?: { name: string; description: string }; // For YouTube playlist
  references: {
    lyricist: string;
    musicDirector: string;
  };
}

interface GenerationStatus {
  isGenerating: boolean;
  currentStep: string;
  currentStatus: string;
  logs: string[];
  error?: string;
  result?: {
    jobId: string;
    songTitle: string;
    duration: number;
    lyrics?: string;
    youtubeUrls?: {
      mainVideo?: string;
      shorts?: string[];
    };
    preview?: {
      video: string;
      shorts: string[];
      image: string;
      audio: string;
    };
  };
}

// Pipeline steps
const PIPELINE_STEPS = [
  { id: 'pending', label: 'Starting', icon: '🚀' },
  { id: 'generating_song', label: 'Generating Song', icon: '🎵' },
  { id: 'generating_image', label: 'Creating Anime Art', icon: '🎨' },
  { id: 'creating_video', label: 'Building Video', icon: '🎬' },
  { id: 'cutting_shorts', label: 'Cutting Shorts', icon: '✂️' },
  { id: 'uploading', label: 'Uploading', icon: '📤' },
  { id: 'completed', label: 'Complete', icon: '✅' },
];

function GeneratePageContent() {
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [themes, setThemes] = useState<RomanticTheme[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<GeneratedPrompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('private');
  const [isUploading, setIsUploading] = useState(false);
  
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    currentStep: '',
    currentStatus: '',
    logs: [],
  });

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [status.logs]);

  // Fetch themes on mount
  useEffect(() => {
    fetchThemes();
    fetchNewPrompt();
  }, []);

  const fetchThemes = async () => {
    try {
      const res = await fetch('/api/romantic/themes');
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const fetchNewPrompt = async (themeId?: string) => {
    setIsLoadingPrompt(true);
    try {
      const url = themeId 
        ? `/api/romantic/prompt?themeId=${themeId}` 
        : '/api/romantic/prompt';
      const res = await fetch(url);
      const data = await res.json();
      setCurrentPrompt(data.prompt);
    } catch (error) {
      console.error('Failed to fetch prompt:', error);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // Generate with the current prompt
  const handleGenerate = async () => {
    if (!currentPrompt) return;

    setStatus({
      isGenerating: true,
      currentStep: 'Connecting...',
      currentStatus: 'pending',
      logs: [],
    });

    try {
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualMode: true,
          manualTitle: currentPrompt.title,
          manualPrompt: currentPrompt.musicPrompt,
          manualStyle: currentPrompt.style,
          manualImagePrompt: currentPrompt.imagePrompt,
          themeId: currentPrompt.theme.id, // CRITICAL: needed for multi-image & animation
          emotionIntensity: currentPrompt.emotionIntensity, // For video micro-variations
          playlistInfo: currentPrompt.playlistInfo, // For YouTube playlist auto-add
          uploadToYouTube: false,
          privacyStatus,
          previewMode: true, // Always preview first
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);
                handleSSEEvent(currentEvent, data);
              } catch (e) {
                console.error('Failed to parse SSE:', e);
              }
              currentEvent = '';
              currentData = '';
            }
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setStatus((prev) => ({
        ...prev,
        isGenerating: false,
        currentStep: 'Failed',
        currentStatus: 'failed',
        error: err.message,
        logs: [...prev.logs, `❌ Error: ${err.message}`],
      }));
    }
  };

  const handleSSEEvent = (event: string, data: Record<string, unknown>) => {
    switch (event) {
      case 'connected':
        setStatus((prev) => ({
          ...prev,
          logs: [...prev.logs, `🔗 ${data.message}`],
        }));
        break;

      case 'progress':
        setStatus((prev) => ({
          ...prev,
          currentStep: data.message as string,
          currentStatus: data.status as string,
          logs: [...prev.logs, `[${new Date(data.timestamp as string).toLocaleTimeString()}] ${data.message}`],
        }));
        break;

      case 'complete':
        const job = data.job as {
          id: string;
          song?: { title: string; duration: number; lyrics?: string };
          youtube?: {
            mainVideo?: { url: string };
            shorts?: { url: string }[];
          };
          preview?: {
            video: string;
            shorts: string[];
            image: string;
            audio: string;
          };
        };
        setStatus((prev) => ({
          ...prev,
          isGenerating: false,
          currentStep: 'Preview ready!',
          currentStatus: 'completed',
          logs: [...prev.logs, '👁️ Preview ready - review before uploading'],
          result: {
            jobId: job?.id || '',
            songTitle: job?.song?.title || 'Unknown',
            duration: job?.song?.duration || 0,
            lyrics: job?.song?.lyrics,
            youtubeUrls: job?.youtube ? {
              mainVideo: job.youtube.mainVideo?.url,
              shorts: job.youtube.shorts?.map((s) => s.url),
            } : undefined,
            preview: job?.preview,
          },
        }));
        break;

      case 'error':
        setStatus((prev) => ({
          ...prev,
          isGenerating: false,
          currentStep: 'Failed',
          currentStatus: 'failed',
          error: data.error as string,
          logs: [...prev.logs, `❌ ${data.error}`],
        }));
        break;
    }
  };

  const getCurrentStepIndex = () => {
    const index = PIPELINE_STEPS.findIndex((s) => s.id === status.currentStatus);
    return index >= 0 ? index : 0;
  };

  const handleUploadAfterPreview = async () => {
    if (!status.result?.jobId) return;
    
    setIsUploading(true);
    setStatus((prev) => ({
      ...prev,
      logs: [...prev.logs, '📤 Starting YouTube upload...'],
    }));

    try {
      const response = await fetch('/api/preview/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: status.result.jobId,
          privacyStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setStatus((prev) => ({
        ...prev,
        logs: [...prev.logs, '✅ Videos uploaded to YouTube!'],
        result: prev.result ? {
          ...prev.result,
          preview: undefined,
          youtubeUrls: {
            mainVideo: data.youtube.mainVideo?.url,
            shorts: data.youtube.shorts?.map((s: { url: string }) => s.url),
          },
          } : undefined,
      }));
    } catch (error: unknown) {
      const err = error as { message?: string };
      setStatus((prev) => ({
        ...prev,
        logs: [...prev.logs, `❌ Upload failed: ${err.message}`],
        error: err.message,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDiscardAndNext = async () => {
    if (status.result?.jobId) {
      try {
        await fetch(`/api/preview/upload?jobId=${status.result.jobId}`, {
          method: 'DELETE',
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    setStatus({
      isGenerating: false,
      currentStep: '',
      currentStatus: '',
      logs: [],
    });
    
    // Fetch new prompt
    fetchNewPrompt();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">💕 Romantic Hindi Music</span>
        </h1>
        <p className="mt-2 text-white/60">
          Generate beautiful romantic Hindi songs with anime visuals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Panel - Prompt Preview & Controls */}
        <div className="space-y-6">
          {/* Current Prompt Card */}
          <div className="rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-pink-300">🎵 Generated Prompt</h2>
                <button
                onClick={() => fetchNewPrompt()}
                disabled={isLoadingPrompt || status.isGenerating}
                className="text-sm text-white/50 hover:text-white transition-colors disabled:opacity-30"
              >
                🔄 Regenerate
              </button>
            </div>

            {isLoadingPrompt ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500" />
              </div>
            ) : currentPrompt ? (
              <div className="space-y-4">
                {/* Title */}
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-white/40 mb-1">Song Title</p>
                  <p className="text-2xl font-bold text-white">{currentPrompt.title}</p>
                </div>

                {/* Theme */}
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-white/40 mb-1">Theme</p>
                  <p className="text-lg font-medium text-pink-300">{currentPrompt.theme.nameHindi}</p>
                  <p className="text-sm text-white/60">{currentPrompt.theme.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {currentPrompt.theme.emotions.slice(0, 3).map((emotion) => (
                      <span key={emotion} className="rounded-full bg-pink-500/20 px-2 py-0.5 text-xs text-pink-300">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full Production Prompt */}
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-white/40 mb-1">Production Prompt (MMS-Enhanced)</p>
                  <p className="text-sm text-white/80">{currentPrompt.fullPrompt}</p>
                  <details className="mt-2">
                    <summary className="text-xs text-white/40 cursor-pointer">Suno API Prompt (short)</summary>
                    <p className="mt-1 text-xs text-white/50">{currentPrompt.musicPrompt}</p>
                  </details>
                </div>

                {/* Style */}
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-white/40 mb-1">Style</p>
                  <p className="text-sm text-white/80">{currentPrompt.style}</p>
                </div>

                {/* Artist References */}
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-white/40 mb-2">Inspired By</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-white/40">Lyricist Style</p>
                      <p className="text-sm font-medium text-purple-300">{currentPrompt.references.lyricist}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Music Style</p>
                      <p className="text-sm font-medium text-purple-300">{currentPrompt.references.musicDirector}</p>
                    </div>
                  </div>
                </div>

                {/* Image Prompt (collapsed) */}
                <details className="rounded-lg bg-white/5 p-4">
                  <summary className="text-xs text-white/40 cursor-pointer">Anime Art Prompt</summary>
                  <p className="mt-2 text-xs text-white/60">{currentPrompt.imagePrompt}</p>
                </details>
              </div>
            ) : (
              <p className="text-white/50">Loading prompt...</p>
            )}
          </div>

          {/* Theme Selection */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold">Select Theme (or Random)</h2>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => fetchNewPrompt()}
                className={`rounded-lg border border-purple-500/50 bg-purple-500/10 p-3 text-left transition-all hover:bg-purple-500/20`}
              >
                <span className="text-lg">🎲</span>
                <p className="font-medium text-sm">Random</p>
              </button>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => fetchNewPrompt(theme.id)}
                  disabled={isLoadingPrompt}
                  className="rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-pink-500/50 hover:bg-pink-500/10"
                >
                  <p className="font-medium text-sm">{theme.nameHindi}</p>
                  <p className="text-xs text-white/40 truncate">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Settings */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold">Upload Settings</h2>
            <div>
                <label className="mb-2 block text-sm text-white/70">Privacy Status</label>
                <select
                  value={privacyStatus}
                  onChange={(e) => setPrivacyStatus(e.target.value as typeof privacyStatus)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
              </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={status.isGenerating || !currentPrompt}
            className={`w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-semibold transition-all ${
              status.isGenerating || !currentPrompt
                ? 'cursor-not-allowed opacity-50'
                : 'hover:from-pink-600 hover:to-purple-700'
            }`}
          >
            {status.isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              '💕 Generate Romantic Song'
            )}
          </button>
        </div>

        {/* Right Panel - Status & Preview */}
        <div className="space-y-6">
          {/* Progress Steps */}
          {status.isGenerating && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold">Progress</h2>
              <div className="space-y-3">
                {PIPELINE_STEPS.map((step, index) => {
                  const currentIndex = getCurrentStepIndex();
                  const isComplete = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30'
                          : isComplete
                          ? 'bg-green-500/10'
                          : 'bg-white/5 opacity-50'
                      }`}
                    >
                      <span className="text-xl">{step.icon}</span>
                      <span className={`flex-1 ${isCurrent ? 'font-medium' : ''}`}>{step.label}</span>
                      {isComplete && <span className="text-green-400">✓</span>}
                      {isCurrent && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-pink-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status / Result */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold">Generation Status</h2>
            
            {status.error ? (
              <div className="rounded-lg bg-red-500/10 p-4 text-red-400">
                <p className="font-medium">Error</p>
                <p className="mt-1 text-sm">{status.error}</p>
                <button
                  onClick={handleDiscardAndNext}
                  className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm hover:bg-red-500/30"
                >
                  Try Again with New Prompt
                </button>
              </div>
            ) : status.result ? (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 ${status.result.preview ? 'bg-pink-500/10 text-pink-300' : 'bg-green-500/10 text-green-400'}`}>
                  <p className="font-medium">{status.result.preview ? '👁️ Preview Ready!' : '✅ Uploaded!'}</p>
                  <p className="mt-1">&quot;{status.result.songTitle}&quot;</p>
                  <p className="text-sm opacity-70">Duration: {Math.round(status.result.duration)}s</p>
                </div>

                {/* Video Preview */}
                {status.result.preview && (
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <video
                        src={status.result.preview.video}
                        controls
                        className="w-full aspect-video bg-black"
                        poster={status.result.preview.image}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>

                    {/* Shorts Preview */}
                    <div>
                      <p className="mb-2 text-sm text-white/50">YouTube Shorts</p>
                      <div className="grid grid-cols-3 gap-2">
                        {status.result.preview.shorts.map((shortUrl, i) => (
                          <div key={i} className="rounded-lg overflow-hidden border border-white/10">
                            <video
                              src={shortUrl}
                              controls
                              className="w-full aspect-[9/16] bg-black"
                            />
                            <p className="text-center text-xs py-1 bg-white/5">Short {i + 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upload / Discard */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleUploadAfterPreview}
                        disabled={isUploading}
                        className={`flex-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 py-3 font-medium transition-all ${
                          isUploading ? 'cursor-not-allowed opacity-50' : 'hover:from-pink-600 hover:to-purple-700'
                        }`}
                      >
                        {isUploading ? 'Uploading...' : '📤 Upload to YouTube'}
                      </button>
                      <button
                        onClick={handleDiscardAndNext}
                        disabled={isUploading}
                        className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white/70 hover:bg-white/10"
                      >
                        Skip & Next
                      </button>
                    </div>
                  </div>
                )}
                
                {/* YouTube Links */}
                {status.result.youtubeUrls && (
                  <div className="space-y-2">
                    {status.result.youtubeUrls.mainVideo && (
                      <a
                        href={status.result.youtubeUrls.mainVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                      >
                        <span className="text-sm text-white/50">Main Video</span>
                        <p className="text-blue-400 hover:underline">{status.result.youtubeUrls.mainVideo}</p>
                      </a>
                    )}
                    {status.result.youtubeUrls.shorts?.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                      >
                        <span className="text-sm text-white/50">Short {i + 1}</span>
                        <p className="text-blue-400 hover:underline">{url}</p>
                      </a>
                    ))}
                    <button
                      onClick={handleDiscardAndNext}
                      className="w-full rounded-lg bg-white/10 py-2 text-sm hover:bg-white/20 mt-4"
                    >
                      Generate Another
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${status.isGenerating ? 'animate-pulse bg-pink-500' : 'bg-white/30'}`} />
                <span className="text-white/70">{status.currentStep || 'Ready to generate'}</span>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Logs</h2>
              {status.logs.length > 0 && (
                <span className="text-xs text-white/40">{status.logs.length} entries</span>
              )}
            </div>
            <div className="h-48 overflow-y-auto rounded-lg bg-black/50 p-4 font-mono text-xs">
              {status.logs.length === 0 ? (
                <span className="text-white/30">No logs yet...</span>
              ) : (
                status.logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`py-1 ${
                      log.includes('Error') || log.includes('❌')
                        ? 'text-red-400'
                        : log.includes('✅')
                        ? 'text-green-400'
                        : log.includes('🔗')
                        ? 'text-blue-400'
                        : 'text-white/70'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneratePageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-pink-500" />
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<GeneratePageLoading />}>
      <GeneratePageContent />
    </Suspense>
  );
}
