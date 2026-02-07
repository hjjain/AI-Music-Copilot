'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalSongs: number;
  totalUploads: number;
  totalShorts: number;
  pendingJobs: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSongs: 0,
    totalUploads: 0,
    totalShorts: 0,
    pendingJobs: 0,
  });

  // Fetch stats from history API
  useEffect(() => {
    fetch('/api/history?stats=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setStats({
            totalSongs: data.stats.totalSongs,
            totalUploads: data.stats.totalUploads,
            totalShorts: data.stats.totalShorts,
            pendingJobs: data.stats.pendingJobs,
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-2 text-white/60">
          Welcome to YT Music Autopilot. Generate AI songs and upload them to YouTube automatically.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Songs"
          value={stats.totalSongs}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
          color="from-red-500 to-pink-500"
        />
        <StatCard
          title="YouTube Uploads"
          value={stats.totalUploads}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          }
          color="from-purple-500 to-indigo-500"
        />
        <StatCard
          title="Shorts Created"
          value={stats.totalShorts}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="from-yellow-500 to-orange-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/generate"
            className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-red-500/50 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-red-400">Generate New Song</h3>
              <p className="text-sm text-white/60">Create a new AI song with video</p>
            </div>
          </Link>

          <Link
            href="/generate?random=true"
            className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-purple-500/50 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-400">Random Generation</h3>
              <p className="text-sm text-white/60">Auto-generate with random category</p>
            </div>
          </Link>

          <Link
            href="/settings"
            className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-green-500/50 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-green-400">Connect YouTube</h3>
              <p className="text-sm text-white/60">Setup YouTube API credentials</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold">How It Works</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <PipelineStep
            step={1}
            title="Generate Prompt"
            description="Random category selection & AI enhancement"
          />
          <PipelineStep
            step={2}
            title="Create Song"
            description="Suno AI generates music + lyrics"
          />
          <PipelineStep
            step={3}
            title="Generate Image"
            description="Replicate creates themed artwork"
          />
          <PipelineStep
            step={4}
            title="Create Video"
            description="FFmpeg loops image + karaoke lyrics"
          />
          <PipelineStep
            step={5}
            title="Cut Shorts"
            description="Extract 3x 40-second YouTube Shorts"
          />
          <PipelineStep
            step={6}
            title="Upload"
            description="Upload video + 3 shorts to YouTube"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-purple-600 text-sm font-bold">
        {step}
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs text-white/50">{description}</p>
      {step < 6 && (
        <div className="absolute right-0 top-5 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-purple-500/50 to-transparent md:block" style={{ left: '50%', width: '100%' }} />
      )}
    </div>
  );
}
