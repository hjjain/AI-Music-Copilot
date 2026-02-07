# 🎵 YT Music Autopilot - Complete Documentation

> **Automated YouTube Music Channel Platform** - Generate AI songs, create animated videos with karaoke lyrics, and upload to YouTube automatically.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Flow](#architecture--flow)
3. [Features Implemented](#features-implemented)
4. [Technical Stack](#technical-stack)
5. [API Integrations](#api-integrations)
6. [Video Processing Pipeline](#video-processing-pipeline)
7. [File Structure](#file-structure)
8. [Environment Setup](#environment-setup)
9. [Current Capabilities](#current-capabilities)
10. [Technical Decisions](#technical-decisions)
11. [Future Brainstorming](#future-brainstorming)

---

## 🎯 Project Overview

### Goal
Create a fully automated YouTube music channel that:
- Generates **romantic Hindi/Hinglish songs** using AI (Suno)
- Creates **anime-style romantic couple visuals** (Replicate + Kling)
- Produces **karaoke-style lyric videos** with animated backgrounds
- Automatically cuts **3 YouTube Shorts** (9:16 vertical format)
- Uploads everything to YouTube with proper metadata

### Current Focus
**Niche:** Romantic Hindi songs with anime visuals
- **Lyrics:** Research-based, inspired by legendary lyricists (Gulzar, Javed Akhtar, etc.)
- **Music:** Reference top Hindi music directors' styles (A.R. Rahman, Pritam, etc.)
- **Visuals:** Anime romantic couple images (Studio Ghibli / Makoto Shinkai inspired)
- **Themes:** 8 rotating romantic sub-themes (First love, Deep love, Heartbreak, Monsoon romance, etc.)
- **Music Style:** 40% chance of anime-fusion style (Suzume/RADWIMPS inspired)

### Project Location
```
/Users/himanshujain/Desktop/personal/yt-music-autopilot
```

---

## 🏗️ Architecture & Flow

### High-Level Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATION PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

1. PROMPT GENERATION
   ├── Select romantic theme (8 themes, rotating)
   ├── Get lyricist reference (Gulzar, Javed Akhtar, etc.)
   ├── Get music director reference (A.R. Rahman, Pritam, etc.)
   ├── Generate title, music prompt, style, image prompt
   └── 40% chance: Add anime music fusion (Suzume/RADWIMPS style)

2. SONG GENERATION (Suno AI)
   ├── API: acedata.cloud/suno/audios
   ├── Request: title, prompt, style (Hinglish lyrics requested)
   ├── Download: MP3 audio file
   ├── Get lyrics timing: acedata.cloud/suno/timing
   └── Parse: Word-level timing → Line-level segments

3. IMAGE GENERATION (ByteDance Seedream 4.5)
   ├── Generate: 1920x1080 (16:9 aspect ratio)
   ├── Prompt: Anime romantic couple, theme-based scene
   ├── Quality: 2K resolution, high detail
   └── Download: Image file (PNG/WebP)

4. ANIMATED BACKGROUND (Kling 2.6 Motion Control) - PARALLEL
   ├── Generate 3 animated clips (PARALLEL for speed)
   ├── Motion Control: Uses reference video for smooth, natural movement
   ├── Each clip: Different animation prompt (petals, rain, lights, etc.)
   ├── Concatenate: 3 clips → with crossfade transitions
   └── Loop: Base video → Full song duration with smooth transitions

5. VIDEO CREATION (FFmpeg)
   ├── Input: Looped 15-second animated background
   ├── Input: Audio file (MP3)
   ├── Overlay: ASS subtitles (karaoke-style lyrics)
   └── Output: 1920x1080 MP4 (16:9 horizontal)

6. SHORTS CREATION (FFmpeg)
   ├── Cut: 3 segments from main video (25 seconds each)
   ├── Convert: 16:9 → 9:16 (crop center, fill frame)
   └── Output: 1080x1920 MP4 (vertical format)

7. YOUTUBE UPLOAD
   ├── Main video: Upload with description, tags, category
   ├── Shorts: Upload 3 videos with #Shorts tag
   └── Save: YouTube URLs to history

8. HISTORY STORAGE
   └── Save: Job data to data/history.json (persistent)
```

### Detailed Flow Diagram

```
User clicks "Generate Song"
    ↓
[Frontend] POST /api/generate/stream
    ↓
[Backend] GenerationPipeline.run()
    │
    ├─→ generateSong()
    │   ├─→ Suno API: Generate song (Hinglish lyrics)
    │   ├─→ Download: audio.mp3
    │   └─→ Get lyrics timing (word-level → line-level)
    │
    ├─→ generateImage()
    │   ├─→ Replicate: Generate 1820x1024 image
    │   └─→ Download: cover image
    │
    ├─→ generateAnimatedBackground() [PARALLEL]
    │   ├─→ Kling API: Generate clip 1 (5s) ─┐
    │   ├─→ Kling API: Generate clip 2 (5s) ─┼─→ Promise.all()
    │   └─→ Kling API: Generate clip 3 (5s) ─┘
    │   ├─→ Concatenate: 3 clips → 15s (with crossfade)
    │   └─→ Loop: 15s → full duration (with crossfade)
    │
    ├─→ createVideo()
    │   ├─→ FFmpeg: Loop animated background
    │   ├─→ FFmpeg: Add audio track
    │   └─→ FFmpeg: Overlay ASS subtitles (lyrics)
    │
    ├─→ createShorts()
    │   ├─→ FFmpeg: Cut segment 1 (25s, 9:16)
    │   ├─→ FFmpeg: Cut segment 2 (25s, 9:16)
    │   └─→ FFmpeg: Cut segment 3 (25s, 9:16)
    │
    └─→ uploadToYouTube() [if enabled]
        ├─→ Upload: Main video
        └─→ Upload: 3 shorts
```

---

## ✨ Features Implemented

### 1. **Romantic Song Generation**
- **8 Rotating Themes:**
  - Pehla Pyaar (First Love)
  - Gehri Mohabbat (Deep Love)
  - Dard-e-Dil (Heartbreak)
  - Baarish Ka Mausam (Monsoon Romance)
  - Dooriyan (Long Distance)
  - Raat Ki Baatein (Night Romance)
  - Dil Ki Baat (Confession)
  - Shaadi Ka Pyaar (Wedding Love)

- **Artist References:**
  - **Lyricists:** Gulzar, Javed Akhtar, Prasoon Joshi, Irshad Kamil
  - **Music Directors:** A.R. Rahman, Pritam, Vishal-Shekhar, Shankar-Ehsaan-Loy
  - **Anime Fusion:** 40% chance of Suzume/RADWIMPS-inspired style

### 2. **Hinglish Lyrics**
- Suno API configured to generate **Hinglish** (Hindi words in Roman script)
- Example: "Tujhe dekha toh yeh jaana sanam" instead of Devanagari
- Lyrics timing parsed from word-level to line-level for karaoke

### 3. **Animated Backgrounds (Kling 2.6 Motion Control)**
- **3 Parallel Generations:** Creates 3 different 5-second clips simultaneously
- **15-Second Base:** Concatenates clips with 0.5s crossfade transitions
- **Smooth Looping:** Loops 15s base to match song duration with crossfade
- **Theme-Based Animations:** Each theme has 3 unique animation prompts
  - Example: "gentle breeze, petals floating" → "sunlight flickering" → "hair flowing"

### 4. **Video Formats**
- **Main Video:** 1920x1080 (16:9 horizontal) - Full HD
- **Shorts:** 1080x1920 (9:16 vertical) - Fills entire frame, no black bars
- **Aspect Ratios:**
  - Image: 1920x1080 (native 16:9 from Seedream 4.5)
  - Main video: 1920x1080 (standard 16:9)
  - Shorts: 1080x1920 (standard 9:16)

### 5. **Karaoke-Style Lyrics**
- **ASS Subtitles:** Advanced SubStation Alpha format
- **Styling:** White text, black outline, centered, large font
- **Timing:** Synced with audio using word-level timing from Suno API
- **Fade Effects:** 200ms fade in/out for smooth appearance

### 6. **Real-Time Progress Streaming**
- **Server-Sent Events (SSE):** Live progress updates
- **Status Steps:**
  - Generating song
  - Generating image
  - Creating animated background
  - Creating video
  - Creating shorts
  - Uploading to YouTube
- **Visual Feedback:** Color-coded logs, icons, auto-scroll

### 7. **Video Preview**
- **Preview Mode:** Generate without uploading to YouTube
- **Video Player:** Preview main video and all 3 shorts
- **Actions:** Upload to YouTube or Discard
- **File Management:** Temp files preserved for preview

### 8. **Persistent History**
- **Storage:** JSON file at `data/history.json`
- **Tracking:**
  - Total songs generated
  - Successful uploads
  - Failed jobs
  - YouTube URLs
  - Timestamps, categories, prompts
- **Management:** View, delete, filter by status

### 9. **Retry Logic**
- **Exponential Backoff:** Automatic retry on API failures
- **Configurable:** Max attempts, delays, jitter
- **Error Handling:** Detailed logging, graceful fallbacks

### 10. **YouTube Integration**
- **OAuth 2.0:** Full authentication flow
- **Upload:** Main video + 3 shorts
- **Metadata:** Auto-generated descriptions, tags, categories
- **Privacy:** Configurable (private/unlisted/public)

---

## 🛠️ Technical Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** (Server Components, Client Components)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)
- **Zustand** (State management - if used)

### Backend
- **Next.js API Routes** (Server-side endpoints)
- **Server-Sent Events (SSE)** (Real-time streaming)
- **FFmpeg** (via `fluent-ffmpeg`) (Video processing)
- **Axios** (HTTP client)

### External APIs
- **Suno AI** (via AceData Cloud API)
- **Replicate** (Seedream 4.5 for images, Kling 2.6 Motion Control for video)
- **YouTube Data API v3** (via googleapis)

### Video Processing
- **FFmpeg** (Command-line tool)
  - Video encoding (H.264)
  - Audio encoding (AAC)
  - Subtitle overlay (ASS format)
  - Video concatenation
  - Aspect ratio conversion
  - Crossfade transitions

---

## 🔌 API Integrations

### 1. Suno AI (via AceData Cloud)

**Endpoint:** `https://api.acedata.cloud/suno/audios`

**Request:**
```json
{
  "action": "generate",
  "model": "chirp-v4",
  "custom": false,
  "prompt": "Romantic Hindi song about first love...",
  "title": "Pehla Pyaar",
  "style": "Hindi, Bollywood inspired, Hinglish lyrics in Roman script"
}
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "song-id",
    "title": "Pehla Pyaar",
    "audio_url": "https://cdn1.suno.ai/...mp3",
    "lyric": "[Verse 1]\nTujhe dekha toh yeh jaana sanam..."
  }]
}
```

**Lyrics Timing Endpoint:** `https://api.acedata.cloud/suno/timing`

**Request:**
```json
{
  "audio_id": "song-id"
}
```

**Response:**
```json
{
  "data": {
    "aligned_words": [
      {"word": "Tujhe", "start_s": 0.5, "end_s": 0.8},
      {"word": "dekha", "start_s": 0.8, "end_s": 1.2},
      ...
    ]
  }
}
```

**Key Features:**
- Hinglish lyrics (Roman script)
- Word-level timing → Line-level segments
- Retry logic with exponential backoff
- 5-minute timeout for generation

### 2. ByteDance Seedream 4.5 (Images)

**Model:** `bytedance/seedream-4.5`

**Request:**
```json
{
  "input": {
    "prompt": "anime romantic couple, cherry blossoms, Studio Ghibli style...",
    "size": "2K",
    "width": 1920,
    "height": 1080,
    "max_images": 1,
    "aspect_ratio": "16:9",
    "sequential_image_generation": "disabled"
  }
}
```

**Supported Dimensions:**
- `1920x1080` (16:9 horizontal - main video)
- `1080x1920` (9:16 vertical - shorts)
- `1024x1024` (1:1 square)

**Key Features:**
- High quality 2K resolution output
- Custom width/height support
- Native 16:9 aspect ratio
- Sequential image generation for multiple images
- Retry logic with 3-minute timeout

### 3. Kling 2.6 Motion Control (Video)

**Model:** `kwaivgi/kling-v2.6-motion-control`

**Request:**
```json
{
  "input": {
    "mode": "pro",
    "image": "https://replicate.delivery/.../image.png",
    "video": "https://replicate.delivery/.../motion-reference.mp4",
    "prompt": "gentle breeze moving hair, cherry blossom petals floating slowly",
    "keep_original_sound": false,
    "character_orientation": "image"
  }
}
```

**Key Features:**
- Image-to-video with motion control from reference video
- Pro mode for highest quality
- Character orientation preservation
- Motion reference videos for different themes (gentle, romantic)
- Parallel generation (3 clips simultaneously)
- Polling for completion (up to 5 minutes)

### 4. YouTube Data API v3

**OAuth 2.0 Flow:**
1. User clicks "Connect YouTube" → Redirects to Google
2. User authorizes → Redirects back with code
3. Exchange code for access token + refresh token
4. Store refresh token in `.env.local`

**Upload:**
```javascript
youtube.videos.insert({
  part: ['snippet', 'status'],
  requestBody: {
    snippet: {
      title: "Song Title",
      description: "Auto-generated description...",
      tags: ["Hindi", "Romantic", "Bollywood"],
      categoryId: "10" // Music
    },
    status: {
      privacyStatus: "private" // or "unlisted", "public"
    }
  },
  media: {
    body: fs.createReadStream(videoPath)
  }
})
```

**Key Features:**
- OAuth 2.0 authentication
- Video upload (main + shorts)
- Metadata generation
- Retry logic

---

## 🎬 Video Processing Pipeline

### Step 1: Image Generation
```bash
Replicate API → 1820x1024 image → Download → Save to temp/
```

### Step 2: Animated Background (3 Clips - Parallel)
```bash
# Clip 1
Kling API → 5s video (prompt 1) → Download → Save

# Clip 2 (parallel)
Kling API → 5s video (prompt 2) → Download → Save

# Clip 3 (parallel)
Kling API → 5s video (prompt 3) → Download → Save
```

### Step 3: Concatenate Clips
```bash
ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v1]; \
                   [v1][2:v]xfade=transition=fade:duration=0.5:offset=9.5[outv]" \
  -map "[outv]" -c:v libx264 -preset fast -crf 23 \
  -pix_fmt yuv420p -an base-15s.mp4
```

**Result:** 15-second video with smooth crossfades

### Step 4: Loop to Match Song Duration
```bash
ffmpeg -i base-15s.mp4 -stream_loop -1 -t 180 \
  -c:v libx264 -preset fast -crf 23 \
  -pix_fmt yuv420p -an looped.mp4
```

**Result:** Looped video matching song duration (with crossfade at loop point)

### Step 5: Add Audio + Lyrics
```bash
ffmpeg -i looped.mp4 -i audio.mp3 \
  -vf "ass=lyrics.ass" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 192k \
  -pix_fmt yuv420p -shortest final-video.mp4
```

**ASS File Format:**
```
[Script Info]
Title: Song Lyrics
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,2,2,50,50,80,1

[Events]
Dialogue: 0,0:00:05.00,0:00:08.50,Default,,0,0,0,,{\fad(200,200)}Tujhe dekha toh yeh jaana sanam
```

**Result:** Final video with animated background + audio + karaoke lyrics

### Step 6: Create Shorts (9:16)
```bash
ffmpeg -i final-video.mp4 -ss 10 -t 25 \
  -vf "scale=-2:1920,crop=1080:1920:(iw-1080)/2:0" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 192k \
  -pix_fmt yuv420p short-1.mp4
```

**Filter Breakdown:**
- `scale=-2:1920` - Scale height to 1920, width auto
- `crop=1080:1920:(iw-1080)/2:0` - Crop center 1080px width
- **Result:** 1080x1920 (9:16), fills entire frame

---

## 📁 File Structure

```
yt-music-autopilot/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── generate/
│   │   │   │   ├── route.ts          # POST: Trigger generation
│   │   │   │   └── stream/
│   │   │   │       └── route.ts      # POST: SSE streaming generation
│   │   │   ├── history/
│   │   │   │   └── route.ts          # GET/DELETE: History management
│   │   │   ├── preview/
│   │   │   │   ├── [...path]/
│   │   │   │   │   └── route.ts      # GET: Serve preview files
│   │   │   │   └── upload/
│   │   │   │       └── route.ts      # POST: Upload after preview
│   │   │   ├── romantic/
│   │   │   │   ├── prompt/
│   │   │   │   │   └── route.ts      # GET: Generate romantic prompt
│   │   │   │   └── themes/
│   │   │   │       └── route.ts      # GET: List romantic themes
│   │   │   ├── status/
│   │   │   │   └── route.ts          # GET: System status
│   │   │   └── youtube/
│   │   │       ├── auth/
│   │   │       │   └── route.ts      # GET: Start OAuth flow
│   │   │       └── callback/
│   │   │           └── route.ts      # GET: OAuth callback
│   │   ├── generate/
│   │   │   └── page.tsx              # Song generation UI
│   │   ├── history/
│   │   │   └── page.tsx              # History display
│   │   ├── settings/
│   │   │   └── page.tsx              # Settings & YouTube connect
│   │   ├── page.tsx                  # Dashboard
│   │   ├── layout.tsx                # Root layout with sidebar
│   │   └── globals.css               # Tailwind styles
│   │
│   ├── lib/                          # Core libraries
│   │   ├── kling/
│   │   │   └── client.ts            # Kling 2.6 Motion Control API client
│   │   ├── pipeline/
│   │   │   └── index.ts             # Main orchestration pipeline
│   │   ├── prompts/
│   │   │   ├── categories.ts        # Music categories (legacy)
│   │   │   ├── generator.ts         # Auto prompt generation (legacy)
│   │   │   ├── prompt-enhancer.ts   # MMS-style prompt enhancement
│   │   │   ├── romantic-config.ts   # Romantic themes & artist refs
│   │   │   └── romantic-generator.ts # Romantic prompt generation
│   │   ├── replicate/
│   │   │   └── client.ts            # Replicate API (images)
│   │   ├── storage/
│   │   │   └── history.ts           # Persistent JSON history
│   │   ├── suno/
│   │   │   └── client.ts            # Suno API client
│   │   ├── utils/
│   │   │   └── retry.ts             # Retry with exponential backoff
│   │   ├── video/
│   │   │   ├── create.ts            # Video creation + lyrics overlay
│   │   │   └── shorts.ts            # Shorts cutting logic
│   │   └── youtube/
│   │       ├── auth.ts              # OAuth helpers
│   │       └── client.ts            # YouTube upload API
│   │
│   └── types/
│       └── index.ts                 # TypeScript interfaces
│
├── data/                            # Persistent storage (gitignored)
│   └── history.json                 # Generation history
│
├── temp/                            # Temporary files (gitignored)
│   ├── job-*-audio.mp3
│   ├── job-*-cover.png
│   ├── job-*-animated-clip-*.mp4
│   ├── job-*-video.mp4
│   └── job-*-video-short-*.mp4
│
├── .env.example                     # Environment template
├── .env.local                       # Actual env vars (gitignored)
├── .eslintrc.json                   # ESLint config
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── README.md                        # This file
└── CURSOR_CONTEXT.md               # Cursor AI context
```

---

## ⚙️ Environment Setup

### Required Environment Variables

```env
# Suno AI (via AceData Cloud)
SUNO_API_KEY=your_acedata_api_key
SUNO_API_URL=https://api.acedata.cloud/suno/audios
SUNO_TIMING_URL=https://api.acedata.cloud/suno/timing
SUNO_MODEL=chirp-v4

# Replicate (Images + Video)
REPLICATE_API_TOKEN=your_replicate_token

# YouTube (Optional - for uploads)
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=  # Set after OAuth flow
```

### Installation

```bash
# 1. Clone/Navigate to project
cd /Users/himanshujain/Desktop/personal/yt-music-autopilot

# 2. Install dependencies
npm install

# 3. Install FFmpeg (required for video processing)
# macOS:
brew install ffmpeg

# Verify:
ffmpeg -version

# 4. Copy environment template
cp .env.example .env.local

# 5. Edit .env.local with your API keys

# 6. Start development server
npm run dev
```

### YouTube OAuth Setup

1. **Google Cloud Console:**
   - Create project
   - Enable "YouTube Data API v3"
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/youtube/callback`

2. **Add to .env.local:**
   ```env
   YOUTUBE_CLIENT_ID=your_client_id
   YOUTUBE_CLIENT_SECRET=your_client_secret
   ```

3. **Get Refresh Token:**
   - Visit: `http://localhost:3000/settings`
   - Click "Connect YouTube Channel"
   - Authorize with Google
   - Copy the refresh token shown
   - Add to `.env.local`: `YOUTUBE_REFRESH_TOKEN=...`

---

## 🎨 Current Capabilities

### What Works

✅ **Song Generation:**
- Romantic Hindi/Hinglish songs
- 8 rotating themes
- Artist-inspired prompts (Gulzar, A.R. Rahman, etc.)
- 40% anime-fusion music style
- Hinglish lyrics (Roman script)

✅ **Visual Generation:**
- Anime romantic couple images (1820x1024)
- 3 animated 5-second clips (parallel generation)
- 15-second base with crossfade transitions
- Smooth looping to match song duration

✅ **Video Production:**
- Main video: 1920x1080 (16:9) with karaoke lyrics
- Shorts: 1080x1920 (9:16) - fills frame, no black bars
- ASS subtitle overlay with timing sync
- Crossfade transitions between loops

✅ **YouTube Integration:**
- OAuth 2.0 authentication
- Upload main video + 3 shorts
- Auto-generated descriptions and tags
- Privacy status control

✅ **User Experience:**
- Real-time progress streaming (SSE)
- Video preview before upload
- Persistent history tracking
- Retry logic for API failures

### Limitations

⚠️ **Current Constraints:**
- Single YouTube channel (one account)
- No scheduling (manual generation only)
- JSON storage (not scalable for large history)
- No analytics (views, engagement)
- No queue system (one generation at a time)
- Fixed 3 shorts per song (25 seconds each)

---

## 🧠 Technical Decisions

### 1. **Why 3 Clips for 15 Seconds?**
- **Problem:** 5-second loop creates noticeable repetition
- **Solution:** 3 different clips = 15 seconds of unique content
- **Benefit:** Loop happens every 15s instead of 5s (less noticeable)
- **Trade-off:** 3x API calls, but parallelized for speed

### 2. **Why Crossfade Transitions?**
- **Problem:** Hard cuts between loops are jarring
- **Solution:** 0.5s crossfade blends end of one clip into start of next
- **Implementation:** FFmpeg `xfade` filter
- **Result:** Smooth, seamless transitions

### 3. **Why Hinglish Lyrics?**
- **Problem:** Devanagari script may not render well in videos
- **Solution:** Request Hinglish (Roman script) from Suno
- **Example:** "Tujhe dekha toh yeh jaana sanam" instead of "तुझे देखा तो ये जाना सनम"
- **Benefit:** Better subtitle rendering, wider audience

### 4. **Why Parallel Kling Generation?**
- **Problem:** Sequential generation takes 3x longer
- **Solution:** `Promise.all()` runs 3 API calls simultaneously
- **Speed:** ~2 minutes instead of ~6 minutes
- **Trade-off:** Higher API rate limit usage (but acceptable)

### 5. **Why JSON Storage?**
- **Problem:** Need persistent history without database
- **Solution:** Simple JSON file at `data/history.json`
- **Benefit:** No database setup, easy to inspect/debug
- **Trade-off:** Not scalable for thousands of jobs (but fine for now)

### 6. **Why ASS Subtitles?**
- **Problem:** Need karaoke-style lyrics with timing
- **Solution:** ASS format supports precise timing and styling
- **Features:** Fade effects, positioning, colors, outlines
- **FFmpeg:** Native support via `ass` filter

### 7. **Why Seedream 4.5 for Images?**
- **Previous:** recraft-v3 had limited size options (1820x1024 max)
- **Solution:** ByteDance Seedream 4.5 supports native 1920x1080 at 2K quality
- **Benefits:** Higher quality, custom dimensions, native 16:9 aspect ratio
- **Output:** Full HD resolution matching standard YouTube video dimensions

---

## 🚀 Future Brainstorming

### Feature Ideas

#### 1. **Scheduling & Automation**
- **Daily Auto-Generation:** Cron job to generate songs automatically
- **Time Slots:** Generate at specific times (e.g., 6 AM daily)
- **Theme Rotation:** Auto-rotate through 8 themes
- **Queue System:** Queue multiple generations

#### 2. **Content Variety**
- **Multiple Genres:** Expand beyond romantic (party, sad, motivational)
- **Language Options:** English, Punjabi, Tamil songs
- **Collaboration:** Duet songs, featured artists
- **Remixes:** Create remix versions of popular songs

#### 3. **Visual Enhancements**
- **Multiple Image Styles:** Real photos, abstract art, 3D renders
- **Scene Transitions:** Different scenes per verse/chorus
- **Effects:** Particle effects, color grading, filters
- **Thumbnails:** Auto-generate custom thumbnails

#### 4. **Analytics & Optimization**
- **YouTube Analytics:** Track views, engagement, retention
- **A/B Testing:** Test different titles, thumbnails, descriptions
- **Performance Tracking:** Which themes/genres perform best?
- **Recommendations:** Suggest optimal upload times

#### 5. **Multi-Channel Support**
- **Multiple Accounts:** Manage multiple YouTube channels
- **Channel-Specific Settings:** Different themes per channel
- **Bulk Operations:** Upload to multiple channels simultaneously

#### 6. **Advanced Video Features**
- **Multiple Shorts:** Generate 5-10 shorts instead of 3
- **Custom Short Durations:** User-defined short length
- **Hook Text:** Add engaging text overlays to shorts
- **Background Music:** Add instrumental tracks

#### 7. **User Interface**
- **Dashboard:** Visual analytics, charts, graphs
- **Batch Generation:** Generate multiple songs at once
- **Template System:** Save favorite prompt templates
- **Preview Editor:** Edit prompts before generation

#### 8. **Storage & Database**
- **SQLite Migration:** Move from JSON to SQLite
- **PostgreSQL:** For production scale
- **Cloud Storage:** Store videos in S3/Cloudflare R2
- **CDN:** Serve preview videos via CDN

#### 9. **API & Integrations**
- **Webhook Support:** Notify external services on completion
- **REST API:** External API for programmatic access
- **Zapier/Make:** Integration with automation tools
- **Discord Bot:** Generate songs via Discord commands

#### 10. **Quality Improvements**
- **Lyrics Translation:** Auto-translate to multiple languages
- **Vocal Enhancement:** Post-process audio for better quality
- **Video Compression:** Optimize file sizes
- **Thumbnail Generation:** AI-generated thumbnails

#### 11. **Monetization Features**
- **Ad Placement:** Suggest ad placement timing
- **Sponsor Integration:** Add sponsor segments
- **Merchandise Links:** Auto-add merch links in descriptions
- **Patreon Integration:** Link to Patreon in descriptions

#### 12. **Community Features**
- **User Submissions:** Allow users to submit prompts
- **Voting System:** Community votes on best songs
- **Playlists:** Auto-create playlists by theme/genre
- **Comments Analysis:** Analyze YouTube comments for feedback

### Technical Improvements

#### 1. **Performance**
- **Caching:** Cache generated images/clips for reuse
- **CDN:** Serve static assets via CDN
- **Optimization:** Optimize FFmpeg encoding settings
- **Parallel Processing:** Parallelize more operations

#### 2. **Reliability**
- **Queue System:** Job queue for failed retries
- **Health Checks:** Monitor API health
- **Fallbacks:** Fallback to static images if Kling fails
- **Error Recovery:** Better error handling and recovery

#### 3. **Scalability**
- **Database:** Migrate to PostgreSQL
- **Worker Processes:** Separate worker processes for generation
- **Load Balancing:** Multiple instances for high traffic
- **Cloud Deployment:** Deploy to Vercel/Railway/AWS

#### 4. **Developer Experience**
- **Testing:** Unit tests, integration tests
- **Documentation:** API documentation, code comments
- **Logging:** Structured logging (Winston, Pino)
- **Monitoring:** Error tracking (Sentry), metrics (Prometheus)

---

## 📝 Key Files Reference

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/lib/pipeline/index.ts` | Main orchestration | `GenerationPipeline.run()`, `generateSong()`, `createVideo()` |
| `src/lib/suno/client.ts` | Suno API | `generateSong()`, `getLyricsTiming()`, `downloadAudio()` |
| `src/lib/replicate/client.ts` | Replicate images | `generateImage()` (1820x1024, 1024x1820) |
| `src/lib/kling/client.ts` | Kling video | `generateVideoFromImage()`, `getAnimationPromptSet()` |
| `src/lib/video/create.ts` | Video processing | `createVideoFromAnimatedClips()`, `loopVideoToLength()` |
| `src/lib/video/shorts.ts` | Shorts creation | `cutShort()`, `createAllShorts()` |
| `src/lib/prompts/romantic-generator.ts` | Prompt generation | `generateRomanticPrompt()`, theme selection |
| `src/lib/storage/history.ts` | History storage | `addJobToHistory()`, `getHistoryStats()` |
| `src/app/api/generate/stream/route.ts` | SSE endpoint | Real-time progress streaming |
| `src/app/generate/page.tsx` | Generation UI | Preview, upload, discard |

---

## 🎯 Quick Start Guide

### Generate Your First Song

1. **Start Server:**
   ```bash
   npm run dev
   ```

2. **Open Browser:**
   ```
   http://localhost:3000/generate
   ```

3. **Click "Generate Song":**
   - System selects random romantic theme
   - Generates prompt with artist references
   - Shows progress in real-time

4. **Preview Video:**
   - Watch main video and shorts
   - Review lyrics and visuals

5. **Upload to YouTube:**
   - Click "Upload to YouTube"
   - Or "Discard" to try again

### Check History

```
http://localhost:3000/history
```

### Configure YouTube

```
http://localhost:3000/settings
```

---

## 🔍 Debugging Tips

### Check Logs
```bash
# Terminal output shows detailed logs
[Pipeline] Generating song...
[Suno] API Response status: 200
[Kling] Generating animated video...
```

### Inspect Temp Files
```bash
ls -la temp/
# Check generated files:
# - job-*-audio.mp3
# - job-*-cover.png
# - job-*-animated-clip-*.mp4
# - job-*-video.mp4
# - job-*-video-short-*.mp4
```

### Test Individual Components
```bash
# Test Suno API
curl -X POST https://api.acedata.cloud/suno/audios \
  -H "Authorization: Bearer $SUNO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"generate","model":"chirp-v4","custom":false,"prompt":"test","title":"Test"}'

# Check system status
curl http://localhost:3000/api/status
```

---

## 📚 Additional Resources

- **Suno API Docs:** https://platform.acedata.cloud/documents/suno-api
- **Replicate Docs:** https://replicate.com/docs
- **Kling Model:** https://replicate.com/kwaivgi/kling-v2.5-turbo-pro
- **FFmpeg Docs:** https://ffmpeg.org/documentation.html
- **YouTube API:** https://developers.google.com/youtube/v3

---

## 📄 License

Private project - All rights reserved

---

**Last Updated:** January 20, 2026  
**Version:** 1.0.0  
**Status:** Active Development

---

*This README is designed for AI assistants to understand the complete system architecture, features, and implementation details for future development and brainstorming.*
