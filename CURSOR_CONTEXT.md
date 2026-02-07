# YT Music Autopilot - Project Context for Cursor AI

> **Use this file to provide context when continuing development in a new Cursor session.**

---

## Project Overview

**Goal:** Create an automated YouTube music channel platform that:
1. Generates AI songs daily using Suno AI
2. Creates cover art images using Replicate (recraft-v3 model)
3. Creates videos with 10-second looped images + karaoke-style lyrics overlay
4. Cuts 3 x 40-second YouTube Shorts from each video
5. Uploads everything (1 main video + 3 shorts) to YouTube automatically

**Project Location:** `/Users/himanshujain/Desktop/personal/yt-music-autopilot`

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- FFmpeg (via fluent-ffmpeg) for video processing
- googleapis for YouTube API

---

## What Was Built (Completed)

### 1. Project Structure
```
yt-music-autopilot/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes
│   │   │   ├── generate/
│   │   │   │   ├── route.ts      # POST: trigger generation
│   │   │   │   └── stream/route.ts # POST: SSE streaming generation
│   │   │   ├── history/route.ts  # GET/DELETE: history management
│   │   │   ├── preview/
│   │   │   │   ├── [...path]/route.ts # Serve preview files
│   │   │   │   └── upload/route.ts    # Upload after preview
│   │   │   ├── status/route.ts   # GET: system status
│   │   │   └── youtube/
│   │   │       ├── auth/route.ts    # Start OAuth
│   │   │       └── callback/route.ts # OAuth callback
│   │   ├── generate/page.tsx     # Song generation UI with preview
│   │   ├── history/page.tsx      # View past generations
│   │   ├── settings/page.tsx     # API config & YouTube connect
│   │   ├── page.tsx              # Dashboard
│   │   ├── layout.tsx            # Sidebar layout
│   │   └── globals.css           # Tailwind styles
│   ├── lib/
│   │   ├── suno/client.ts        # Suno API integration (with retry)
│   │   ├── replicate/client.ts   # Replicate recraft-v3 integration (with retry)
│   │   ├── video/
│   │   │   ├── create.ts         # Create video + karaoke lyrics
│   │   │   └── shorts.ts         # Cut 40-second shorts
│   │   ├── youtube/
│   │   │   ├── client.ts         # YouTube upload API (with retry)
│   │   │   └── auth.ts           # OAuth flow helpers
│   │   ├── storage/
│   │   │   └── history.ts        # Persistent JSON history storage
│   │   ├── prompts/
│   │   │   ├── categories.ts     # 5 music categories
│   │   │   └── generator.ts      # Auto prompt generation
│   │   ├── utils/
│   │   │   └── retry.ts          # Retry with exponential backoff
│   │   └── pipeline/index.ts     # Main orchestration pipeline
│   └── types/index.ts            # TypeScript interfaces
├── data/                         # History storage (gitignored)
│   └── history.json
├── temp/                         # Temporary files (gitignored)
├── .env.example                  # Environment template
├── .eslintrc.json
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

### 2. Music Categories (5 total)
| ID | Name | Genres | Moods |
|----|------|--------|-------|
| `love-ballad` | Love Ballad | pop ballad, R&B, soul | romantic, emotional, tender |
| `upbeat-pop` | Upbeat Pop | pop, dance-pop, synth-pop | happy, energetic, uplifting |
| `chill-lofi` | Chill Lo-Fi | lo-fi, chillhop, ambient | relaxed, calm, nostalgic |
| `motivational` | Motivational | hip-hop, pop-rock, electronic | inspiring, powerful, determined |
| `melancholic` | Melancholic | indie, acoustic, alternative | sad, reflective, bittersweet |

### 3. Features Implemented

#### Core Pipeline
- **Suno API:** Song generation with acedata.cloud endpoint
- **Replicate:** Image generation using recraft-ai/recraft-v3 model
- **FFmpeg:** Video creation with karaoke lyrics overlay (ASS subtitles)
- **Shorts:** Auto-cut 3 x 40-second YouTube Shorts (9:16 vertical)
- **YouTube:** Full OAuth 2.0 flow with refresh token storage

#### New Features (January 2026)
- **Persistent History:** JSON file storage at `data/history.json`
  - Stats tracking (total songs, uploads, shorts)
  - Filter by status, delete jobs, clear history
- **Real-time Progress Streaming:** Server-Sent Events (SSE)
  - Visual progress steps with icons
  - Color-coded log messages
  - Auto-scroll log view
- **Video Preview:** Preview before YouTube upload
  - Video player for main video and shorts
  - Upload/Discard buttons
  - Temp file management
- **Retry Logic:** Exponential backoff for API failures
  - Retries on timeout, rate limit, server errors
  - Configurable attempts, delays, jitter

### 4. Pipeline Flow
```
GenerationPipeline.run()
├── generateSong()     → Suno API (with retry) → download audio
├── generateImage()    → Replicate recraft-v3 (with retry) → download image
├── createVideo()      → FFmpeg: image loop + audio + ASS subtitles
├── createShorts()     → FFmpeg: cut 3 x 40s segments, convert to 9:16
├── [preview mode]     → Keep temp files, return preview URLs
├── uploadToYouTube()  → YouTube API (with retry) → upload main + shorts
├── saveToHistory()    → Save job to data/history.json
└── cleanup()          → Delete temp files (skipped in preview mode)
```

---

## Environment Variables Required

```env
# Required
SUNO_API_KEY=your_suno_key
SUNO_API_URL=https://api.acedata.cloud/suno/audios
SUNO_TIMING_URL=https://api.acedata.cloud/suno/timing
SUNO_MODEL=chirp-v4

REPLICATE_API_TOKEN=your_replicate_token

# Optional (for YouTube upload)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=  # Set after OAuth
```

---

## What Still Needs To Be Done

### Future Enhancements
1. **Scheduling** - Add cron job for daily auto-generation
2. **Custom Prompts** - Allow user to input custom lyrics/themes
3. **Multiple Channels** - Support multiple YouTube channels
4. **Analytics Dashboard** - Track views/engagement from uploaded videos
5. **Queue System** - Queue multiple generations
6. **Database Migration** - Move from JSON to SQLite/PostgreSQL for scale

---

## How to Continue Development

### 1. First Time Setup
```bash
cd /Users/himanshujain/Desktop/personal/yt-music-autopilot
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

### 2. FFmpeg Requirement
```bash
# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### 3. Test Individual Components
```bash
# Test generation with preview mode
curl -X POST http://localhost:3000/api/generate/stream \
  -H "Content-Type: application/json" \
  -d '{"categoryId": "upbeat-pop", "previewMode": true}'

# Check system status
curl http://localhost:3000/api/status

# Get history
curl http://localhost:3000/api/history
```

### 4. YouTube Setup
1. Go to Google Cloud Console
2. Create project, enable YouTube Data API v3
3. Create OAuth credentials (Web app)
4. Add redirect URI: `http://localhost:3000/api/youtube/callback`
5. Add credentials to `.env.local`
6. Visit `/settings` and click "Connect YouTube"

---

## Key Files to Review

| File | Purpose |
|------|---------|
| `src/lib/pipeline/index.ts` | Main orchestration - start here to understand flow |
| `src/lib/suno/client.ts` | Suno API calls |
| `src/lib/replicate/client.ts` | Image generation with recraft-v3 |
| `src/lib/video/create.ts` | Video creation + lyrics overlay |
| `src/lib/video/shorts.ts` | Shorts cutting logic |
| `src/lib/youtube/client.ts` | YouTube upload API |
| `src/lib/storage/history.ts` | Persistent history storage |
| `src/lib/utils/retry.ts` | Retry utility with backoff |
| `src/app/api/generate/stream/route.ts` | SSE streaming endpoint |
| `src/app/generate/page.tsx` | Generation UI with preview |

---

## User Preferences

- Follow best coding practices
- Don't change anything without permission
- Ask questions if confused
- Avoid linter errors
- Keep files under 500 lines
- This project is NOT related to muzic-service Git repo

---

## Commands Cheatsheet

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Build for production
npm run lint         # Run ESLint

# Testing
curl http://localhost:3000/api/status                    # Check config
curl http://localhost:3000/api/history?stats=true        # Get stats
curl -X POST http://localhost:3000/api/generate/stream \ # Generate with SSE
  -H "Content-Type: application/json" \
  -d '{"previewMode": true}'
```

---

*Last updated: January 17, 2026*
*Created by Cursor AI conversation*
