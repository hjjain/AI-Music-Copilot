'use client';

import { useState, useEffect, useCallback } from 'react';
import { GenerationJob, JobStatus } from '@/types';

interface HistoryResponse {
  jobs: GenerationJob[];
  total: number;
  limit: number;
  offset: number;
  stats: {
    totalSongs: number;
    totalUploads: number;
    totalShorts: number;
    pendingJobs: number;
    completedJobs: number;
    failedJobs: number;
  };
}

interface UploadState {
  jobId: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({ jobId: '', status: 'idle' });
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '20');
      
      const res = await fetch(`/api/history?${params.toString()}`);
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || 'Failed to fetch history');
      }
      
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Check YouTube status
  useEffect(() => {
    const checkYouTube = async () => {
      try {
        const res = await fetch('/api/status');
        const status = await res.json();
        setYoutubeConnected(status.canUploadToYouTube || false);
      } catch {
        setYoutubeConnected(false);
      }
    };
    checkYouTube();
  }, []);

  // Delete a job
  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const res = await fetch(`/api/history?id=${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Clear all history
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL history? This cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/history?clearAll=true', { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  // Upload to YouTube
  const handleUploadToYouTube = async (jobId: string, privacyStatus: 'private' | 'unlisted' | 'public' = 'private') => {
    if (!youtubeConnected) {
      alert('Please connect your YouTube account in Settings first.');
      return;
    }

    setUploadState({ jobId, status: 'uploading', message: 'Uploading to YouTube...' });

    try {
      const res = await fetch('/api/preview/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, privacyStatus }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || result.error || 'Upload failed');
      }

      setUploadState({ 
        jobId, 
        status: 'success', 
        message: `Uploaded successfully! ${result.youtube?.shorts?.length || 0} shorts uploaded.` 
      });
      
      // Refresh history to show YouTube links
      fetchHistory();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadState({ jobId: '', status: 'idle' });
      }, 5000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setUploadState({ 
        jobId, 
        status: 'error', 
        message: e.message || 'Upload failed' 
      });
    }
  };

  // Check if job can be uploaded (completed, no YouTube yet, files might exist)
  const canUpload = (job: GenerationJob) => {
    return job.status === 'completed' && !job.youtube?.mainVideo;
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'uploading':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Generation History</span>
        </h1>
        <p className="mt-2 text-white/60">
          View your previously generated songs and YouTube uploads.
        </p>
      </div>

        {data && data.jobs.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Songs" value={data.stats.totalSongs} />
          <StatCard label="Completed" value={data.stats.completedJobs} color="text-green-400" />
          <StatCard label="Failed" value={data.stats.failedJobs} color="text-red-400" />
          <StatCard label="YouTube Uploads" value={data.stats.totalUploads} />
          <StatCard label="Shorts" value={data.stats.totalShorts} />
          <StatCard label="Pending" value={data.stats.pendingJobs} color="text-yellow-400" />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm text-white/60">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data?.jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-16">
          <svg
            className="h-16 w-16 text-white/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white/70">No Songs Generated Yet</h3>
          <p className="mt-2 text-sm text-white/50">
            Generate your first song to see it here.
          </p>
          <a
            href="/generate"
            className="mt-6 rounded-lg bg-gradient-to-r from-red-500 to-purple-600 px-6 py-2 font-medium text-white hover:from-red-600 hover:to-purple-700"
          >
            Generate First Song
          </a>
        </div>
      )}

      {/* History list */}
      {!loading && !error && data && data.jobs.length > 0 && (
        <div className="space-y-4">
          {data.jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">
                      {job.song?.title || job.prompt.title || 'Untitled Song'}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-medium ${getStatusColor(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">
                    {job.category.name} • 
                    {job.song?.duration ? ` ${Math.round(job.song.duration)}s • ` : ' '}
                    {formatDate(job.createdAt)}
                  </p>
                  
                  {/* Error message */}
                  {job.error && (
                    <p className="mt-2 text-sm text-red-400">
                      Error: {job.error}
                    </p>
                  )}

                  {/* YouTube links */}
                  {job.youtube && (
                <div className="mt-4 flex flex-wrap gap-2">
                      {job.youtube.mainVideo && (
                  <a
                          href={job.youtube.mainVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                      <polygon points="9.545,15.568 15.818,12 9.545,8.432" fill="white"/>
                    </svg>
                    Main Video
                  </a>
                      )}
                      {job.youtube.shorts?.map((short, i) => (
                    <a
                      key={i}
                          href={short.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-600/30"
                    >
                      Short {i + 1}
                    </a>
                  ))}
                </div>
              )}

                  {/* Upload to YouTube button */}
                  {canUpload(job) && (
                    <div className="mt-4">
                      {uploadState.jobId === job.id && uploadState.status !== 'idle' ? (
                        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                          uploadState.status === 'uploading' ? 'bg-blue-500/20 text-blue-400' :
                          uploadState.status === 'success' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {uploadState.status === 'uploading' && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          )}
                          {uploadState.status === 'success' && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {uploadState.status === 'error' && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span>{uploadState.message}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUploadToYouTube(job.id, 'private')}
                            disabled={!youtubeConnected}
                            className="flex items-center gap-2 rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            title={youtubeConnected ? 'Upload to YouTube (Private)' : 'Connect YouTube in Settings first'}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                              <polygon points="9.545,15.568 15.818,12 9.545,8.432" fill="white"/>
                            </svg>
                            Upload to YouTube
                          </button>
                          <select
                            onChange={(e) => handleUploadToYouTube(job.id, e.target.value as 'private' | 'unlisted' | 'public')}
                            disabled={!youtubeConnected}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue=""
                          >
                            <option value="" disabled>Visibility</option>
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="public">Public</option>
                          </select>
                        </div>
                      )}
                      {!youtubeConnected && (
                        <p className="mt-2 text-xs text-yellow-400/70">
                          ⚠️ <a href="/settings" className="underline hover:text-yellow-400">Connect YouTube</a> in Settings to upload
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(job.id)}
                  className="ml-4 rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                  title="Delete job"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              {/* Expandable details */}
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-white/50 hover:text-white/70">
                  View Details
                </summary>
                <div className="mt-3 space-y-2 rounded-lg bg-black/30 p-4 font-mono text-xs">
                  <p><span className="text-white/50">Job ID:</span> {job.id}</p>
                  <p><span className="text-white/50">Style:</span> {job.prompt.style}</p>
                  {job.song?.lyrics && (
                    <div>
                      <span className="text-white/50">Lyrics:</span>
                      <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap text-white/70">
                        {job.song.lyrics}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {data && data.total > data.limit && (
        <div className="mt-6 text-center text-sm text-white/50">
          Showing {data.jobs.length} of {data.total} jobs
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="font-medium">About History</h3>
        <p className="mt-2 text-sm text-white/60">
          Generation history is now stored persistently in a JSON file at <code className="rounded bg-white/10 px-1">data/history.json</code>.
          Up to 100 jobs are retained. Local file paths are not stored after processing completes.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}
