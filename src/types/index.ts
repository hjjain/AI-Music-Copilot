// Song generation types
export interface SongCategory {
  id: string;
  name: string;
  description: string;
  genres: string[];
  moods: string[];
  imagePromptHints: string[];
}

export interface GeneratedPrompt {
  category: SongCategory;
  title: string;
  lyrics: string;
  style: string;
  imagePrompt: string;
}

// Suno API types
export interface SunoGenerateRequest {
  action: 'generate';
  model: string;
  custom: boolean;
  lyric: string;
  title: string;
  style?: string;
}

export interface SunoResponse {
  data: SunoSongData[];
}

export interface SunoSongData {
  id: string;
  title: string;
  audio_url: string;
  image_url?: string;
  duration?: number;
  style?: string;
  lyric?: string;
}

export interface SunoLyricsTiming {
  segments: LyricSegment[];
}

export interface LyricSegment {
  start: number;
  end: number;
  text: string;
}

// Replicate API types
export interface ReplicateRequest {
  input: {
    prompt: string;
    size?: string;
    style?: string;
    aspect_ratio?: string;
  };
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  urls?: {
    get: string;
    cancel: string;
  };
}

// Video processing types
export interface VideoConfig {
  imagePath: string;
  audioPath: string;
  outputPath: string;
  duration: number;
  lyrics?: LyricSegment[];
}

export interface ShortConfig {
  inputVideoPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
  index: number;
}

// YouTube API types
export interface YouTubeUploadConfig {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'private' | 'unlisted' | 'public';
  isShort?: boolean;
}

export interface YouTubeUploadResult {
  videoId: string;
  url: string;
  title: string;
}

export interface YouTubeCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

// Job/Pipeline types
export type JobStatus = 'pending' | 'generating_song' | 'generating_image' | 'creating_video' | 'cutting_shorts' | 'uploading' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  category: SongCategory;
  prompt: GeneratedPrompt;
  
  // Generated content
  song?: {
    id: string;
    title: string;
    audioUrl: string;
    lyrics: string;
    lyricsTimming?: SunoLyricsTiming;
    duration: number;
  };
  
  image?: {
    url: string;
    prompt: string;
  };
  
  video?: {
    path: string;
    duration: number;
  };
  
  shorts?: {
    path: string;
    index: number;
    startTime: number;
  }[];
  
  youtube?: {
    mainVideo?: YouTubeUploadResult;
    shorts?: YouTubeUploadResult[];
  };
  
  error?: string;
  logs: string[];
}

// History/Storage types
export interface SongHistory {
  jobs: GenerationJob[];
  lastUpdated: Date;
}

// Settings types
export interface AppSettings {
  youtube: {
    connected: boolean;
    channelId?: string;
    channelName?: string;
  };
  categories: {
    enabled: string[];
    custom: SongCategory[];
  };
  videoSettings: {
    shortDuration: number;
    shortsCount: number;
    defaultPrivacy: 'private' | 'unlisted' | 'public';
  };
}
