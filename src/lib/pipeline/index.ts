import path from 'path';
import fs from 'fs/promises';
import { GenerationJob, JobStatus, GeneratedPrompt, SongCategory } from '@/types';
import { generatePrompt, getAllCategories } from '@/lib/prompts/generator';
import { generateSong, downloadAudio, getLyricsTiming, parsePlainLyrics } from '@/lib/suno/client';
import { generateImage, generateMultipleImages, downloadImage, ImageAspectRatio } from '@/lib/replicate/client';
import { 
  createVideoWithLyrics, 
  createVideoFromAnimatedClips,
  ensureTempDir, 
  getAudioDuration,
  getRandomStyleVariation,
  getRandomCinematicEffects,
  VideoStyleVariation,
  CinematicEffects,
} from '@/lib/video/create';
import { createAllShorts } from '@/lib/video/shorts';
import { 
  uploadVideo, 
  generateVideoDescription, 
  generateVideoTags, 
  isYouTubeConfigured,
  autoAddToPlaylist,
} from '@/lib/youtube/client';
import { addJobToHistory } from '@/lib/storage/history';
import { generateVideoFromImage, downloadVideo, getAnimationPromptSet } from '@/lib/kling/client';
import { generateMultiSceneImagePrompts, getAnimationPromptsForScenes } from '@/lib/prompts/romantic-generator';
import { getThemeById } from '@/lib/prompts/romantic-config';

/**
 * Options for manual prompt mode
 */
export interface ManualPromptOptions {
  title?: string;
  prompt: string;
  style?: string;
  imagePrompt?: string;
  themeId?: string; // For animation prompt generation
  emotionIntensity?: 'high' | 'medium' | 'low'; // For video style variations
  playlistInfo?: { name: string; description: string }; // For auto-playlist
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  useKlingAnimation?: boolean; // Use Kling for animated backgrounds (default: true)
}

/**
 * Main pipeline for generating a song and uploading to YouTube
 */
export class GenerationPipeline {
  private job: GenerationJob;
  private tempDir: string = '';
  private onStatusChange?: (status: JobStatus, message: string) => void;
  private config: PipelineConfig;
  private themeId?: string; // For Kling animation prompts
  private animatedClipPaths?: string[]; // Paths to 3 Kling animated clips (15 seconds total)
  private imageUrlForKling?: string; // Public URL for Kling (single image fallback)
  private imageUrlsForKling?: string[]; // 3 different scene images for Kling (Option B)
  private emotionIntensity?: 'high' | 'medium' | 'low'; // For video style variations
  private styleVariation?: VideoStyleVariation; // Cached style variation for consistency
  private cinematicEffects?: CinematicEffects; // Cinematic micro-effects (zoom, grain, flicker)
  private playlistInfo?: { name: string; description: string }; // For auto-playlist

  constructor(
    categoryIdOrManual?: string | ManualPromptOptions,
    onStatusChange?: (status: JobStatus, message: string) => void,
    config: PipelineConfig = {}
  ) {
    this.onStatusChange = onStatusChange;
    this.config = {
      useKlingAnimation: config.useKlingAnimation ?? true, // Default to using Kling
    };
    
    let prompt: GeneratedPrompt;
    
    // Check if manual mode
    if (typeof categoryIdOrManual === 'object' && categoryIdOrManual !== null) {
      // Manual mode - create custom prompt
      prompt = this.createManualPrompt(categoryIdOrManual);
      this.themeId = categoryIdOrManual.themeId;
      this.emotionIntensity = categoryIdOrManual.emotionIntensity;
      this.playlistInfo = categoryIdOrManual.playlistInfo;
    } else {
      // Auto mode - generate prompt from category
      prompt = generatePrompt(categoryIdOrManual);
      this.themeId = categoryIdOrManual;
    }
    
    // Generate style variation based on emotion intensity (for video micro-variations)
    this.styleVariation = getRandomStyleVariation(this.emotionIntensity);
    
    // Generate cinematic micro-effects (zoom, grain, light flicker)
    this.cinematicEffects = getRandomCinematicEffects();
    
    // Initialize job
    this.job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      category: prompt.category,
      prompt,
      logs: [],
    };
  }

  /**
   * Create prompt from manual inputs
   */
  private createManualPrompt(options: ManualPromptOptions): GeneratedPrompt {
    // Create a "custom" category for manual prompts
    const customCategory: SongCategory = {
      id: 'manual',
      name: 'Custom / Manual',
      description: 'Manually created prompt',
      genres: ['custom'],
      moods: ['custom'],
      imagePromptHints: [],
    };

    // Generate a title if not provided
    const title = options.title || `Custom Song ${new Date().toLocaleDateString('en-IN')}`;

    // Default style if not provided
    const style = options.style || 'Hindi, Bollywood inspired, emotional';

    // Default image prompt if not provided
    const imagePrompt = options.imagePrompt || 
      'Beautiful abstract album cover, warm colors, cinematic lighting, professional quality, Indian aesthetic, no text';

    return {
      category: customCategory,
      title,
      lyrics: options.prompt, // In manual mode, this is the full music prompt
      style,
      imagePrompt,
    };
  }

  /**
   * Update job status
   */
  private updateStatus(status: JobStatus, message: string): void {
    this.job.status = status;
    this.job.updatedAt = new Date();
    this.job.logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(`[Pipeline] ${message}`);
    
    if (this.onStatusChange) {
      this.onStatusChange(status, message);
    }
  }

  /**
   * Get current job state
   */
  getJob(): GenerationJob {
    return { ...this.job };
  }

  /**
   * Run the full pipeline
   */
  async run(options: {
    uploadToYouTube?: boolean;
    privacyStatus?: 'private' | 'unlisted' | 'public';
    previewMode?: boolean;
  } = {}): Promise<GenerationJob> {
    const { uploadToYouTube = true, privacyStatus = 'private', previewMode = false } = options;

    try {
      // Setup
      this.tempDir = await ensureTempDir();
      this.updateStatus('pending', 'Pipeline started');

      // Step 1: Generate song
      await this.generateSong();

      // Step 2: Generate image
      await this.generateImage();

      // Step 3: Create video with lyrics
      await this.createVideo();

      // Step 4: Create shorts
      await this.createShorts();

      // Step 5: Upload to YouTube (if enabled and not in preview mode)
      if (previewMode) {
        this.updateStatus('completed', 'Preview ready - files available for review');
        // Don't cleanup in preview mode - keep files for preview
      } else if (uploadToYouTube && isYouTubeConfigured()) {
        await this.uploadToYouTube(privacyStatus);
        // Keep files locally - don't cleanup
        console.log('[Pipeline] Files saved locally (cleanup disabled)');
      } else if (uploadToYouTube) {
        this.updateStatus('completed', 'Skipped YouTube upload - not configured');
        // Keep files locally - don't cleanup
        console.log('[Pipeline] Files saved locally (cleanup disabled)');
      } else {
        // Keep files locally - don't cleanup
        console.log('[Pipeline] Files saved locally (cleanup disabled)');
      }
      
      // Log where files are saved
      console.log('[Pipeline] Output files:');
      if (this.job.video?.path) {
        console.log('[Pipeline]   Main video:', this.job.video.path);
      }
      if (this.job.shorts) {
        this.job.shorts.forEach((short, i) => {
          console.log(`[Pipeline]   Short ${i + 1}:`, short.path);
        });
      }

      this.updateStatus('completed', 'Pipeline completed successfully');
      
      // Save job to history
      await this.saveToHistory();
      
      return this.job;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.job.status = 'failed';
      this.job.error = err.message || 'Unknown error';
      this.updateStatus('failed', `Pipeline failed: ${err.message}`);
      
      // Save failed job to history
      await this.saveToHistory();
      
      // SKIP cleanup on failure for debugging
      console.log('[Pipeline] Skipping cleanup on failure for debugging. Temp files preserved.');
      console.log('[Pipeline] Temp dir:', this.tempDir);
      console.log('[Pipeline] Audio:', this.job.song?.audioUrl);
      console.log('[Pipeline] Image:', this.job.image?.url);
      
      throw error;
    }
  }

  /**
   * Save job to persistent history
   */
  private async saveToHistory(): Promise<void> {
    try {
      // Create a serializable copy of the job (remove local file paths for storage)
      const jobForStorage: GenerationJob = {
        ...this.job,
        song: this.job.song ? {
          ...this.job.song,
          audioUrl: '', // Don't store local file paths
        } : undefined,
        image: this.job.image ? {
          ...this.job.image,
          url: '', // Don't store local file paths
        } : undefined,
        video: this.job.video ? {
          ...this.job.video,
          path: '', // Don't store local file paths
        } : undefined,
        shorts: this.job.shorts?.map((s) => ({
          ...s,
          path: '', // Don't store local file paths
        })),
      };
      
      await addJobToHistory(jobForStorage);
      console.log('[Pipeline] Job saved to history:', this.job.id);
    } catch (error) {
      console.warn('[Pipeline] Failed to save job to history:', error);
    }
  }

  /**
   * Step 1: Generate song using Suno
   * 
   * IMPORTANT: We let Suno generate lyrics (custom=false) for two reasons:
   * 1. The timing API only provides accurate word-level timing for Suno-generated lyrics
   * 2. This ensures perfect lyrics-to-audio synchronization for the video
   * 
   * The prompt guides Suno to create professional-quality Hindi lyrics with:
   * - Music styles: Anirudh, Coldplay, Anime OST, A.R. Rahman
   * - Hinglish (Hindi words in Roman script)
   */
  private async generateSong(): Promise<void> {
    this.updateStatus('generating_song', 'Generating song with Suno AI...');

    const { title, lyrics, style } = this.job.prompt;

    // DO NOT use custom lyrics - let Suno generate for proper timing sync
    // The style prompt guides Suno to create quality Hindi lyrics
    const songData = await generateSong({ 
      title, 
      lyrics, 
      style,
      // customLyrics is NOT passed - Suno generates lyrics for timing API to work
    });

    // Download the audio
    const audioBuffer = await downloadAudio(songData.audio_url);
    const audioPath = path.join(this.tempDir, `${this.job.id}-audio.mp3`);
    await fs.writeFile(audioPath, audioBuffer);

    // Get duration
    const duration = await getAudioDuration(audioPath);

    // Get lyrics timing from Suno API (word-level accuracy)
    console.log('[Pipeline] Fetching lyrics timing from Suno API...');
    let lyricsTiming = await getLyricsTiming(songData.id);
    
    if (lyricsTiming && lyricsTiming.segments.length > 0) {
      console.log('[Pipeline] ✓ Got accurate timing:', lyricsTiming.segments.length, 'segments');
    } else if (songData.lyric) {
      // Fallback: estimate timing from lyrics (less accurate)
      console.log('[Pipeline] ⚠ Using fallback timing estimation');
      lyricsTiming = parsePlainLyrics(songData.lyric, duration);
    }

    // Store song data
    this.job.song = {
      id: songData.id,
      title: songData.title || title,
      audioUrl: audioPath, // Local path
      lyrics: songData.lyric || lyrics,
      lyricsTimming: lyricsTiming || undefined,
      duration,
    };

    this.updateStatus('generating_song', `Song generated: ${this.job.song.title} (${Math.round(duration)}s)`);
  }

  /**
   * Step 2: Generate images using Replicate (16:9 for main video)
   * Now generates 3 different scene images for visual variety
   */
  private async generateImage(): Promise<void> {
    this.updateStatus('generating_image', 'Generating 3 scene images with Seedream 4.5 (16:9)...');

    // Try to get theme for multi-scene prompts
    const theme = this.themeId ? getThemeById(this.themeId) : null;
    
    if (theme && this.config.useKlingAnimation) {
      // Generate 3 different scene images for visual storytelling
      console.log('[Pipeline] Generating 3 different scene images for visual variety');
      
      // Get 3 scene-specific prompts
      const scenePrompts = generateMultiSceneImagePrompts(theme);
      console.log('[Pipeline] Scene prompts:', scenePrompts.map(p => p.substring(0, 60) + '...'));
      
      // Generate all 3 images in parallel
      const imageUrls = await generateMultipleImages(scenePrompts, '16:9');
      
      // Store URLs for Kling animation
      this.imageUrlsForKling = imageUrls;
      
      // Download first image as the cover/thumbnail
      const coverBuffer = await downloadImage(imageUrls[0]);
      const urlPath = new URL(imageUrls[0]).pathname;
      const ext = path.extname(urlPath).toLowerCase() || '.png';
      const imagePath = path.join(this.tempDir, `${this.job.id}-cover${ext}`);
      await fs.writeFile(imagePath, coverBuffer);
      
      this.job.image = {
        url: imagePath,
        prompt: scenePrompts[0],
      };
      
      this.updateStatus('generating_image', '3 scene images generated (16:9)');
      
      // Generate animated backgrounds from all 3 images
      await this.generateAnimatedBackground();
    } else {
      // Fallback: Single image mode
      const { imagePrompt } = this.job.prompt;
      const imageUrl = await generateImage(imagePrompt, '16:9');
      
      const imageBuffer = await downloadImage(imageUrl);
      const urlPath = new URL(imageUrl).pathname;
      const ext = path.extname(urlPath).toLowerCase() || '.png';
      const imagePath = path.join(this.tempDir, `${this.job.id}-cover${ext}`);
      await fs.writeFile(imagePath, imageBuffer);
      
      this.job.image = {
        url: imagePath,
        prompt: imagePrompt,
      };
      
      this.imageUrlForKling = imageUrl;
      this.updateStatus('generating_image', 'Cover image generated (16:9)');
      
      if (this.config.useKlingAnimation) {
        await this.generateAnimatedBackground();
      }
    }
  }

  /**
   * Step 2b: Generate animated background using Kling 2.6 Motion Control
   * Now uses 3 DIFFERENT images for maximum visual variety
   * Each image gets its own animation, creating unique scenes
   * Runs all 3 generations in PARALLEL for faster processing
   */
  private async generateAnimatedBackground(): Promise<void> {
    // Determine which mode to use
    const hasMultipleImages = this.imageUrlsForKling && this.imageUrlsForKling.length === 3;
    const hasSingleImage = this.imageUrlForKling;
    
    if (!hasMultipleImages && !hasSingleImage) {
      console.log('[Pipeline] No image URLs for Kling, skipping animation');
      return;
    }

    try {
      // Determine motion type based on theme emotion intensity
      const motionType = this.emotionIntensity === 'high' ? 'gentle' : 'romantic';

      if (hasMultipleImages) {
        // Option B: 3 different images → 3 animations (more visual variety)
        this.updateStatus('generating_image', 'Animating 3 different scene images with Kling 2.6 (parallel)...');
        console.log('[Pipeline] Using 3 DIFFERENT images for maximum visual variety');
        
        // Get scene-specific animation prompts
        const animationPrompts = getAnimationPromptsForScenes();
        
        // Generate all 3 clips in parallel (each with different image)
        const clipPromises = this.imageUrlsForKling!.map(async (imageUrl, i) => {
          const prompt = animationPrompts[i];
          console.log(`[Pipeline] Scene ${i + 1}: ${prompt.substring(0, 50)}...`);
          
          const videoUrl = await generateVideoFromImage({
            imageUrl: imageUrl,
            prompt: prompt,
            aspectRatio: '16:9',
            motionType: motionType,
          });

          const videoBuffer = await downloadVideo(videoUrl);
          const clipPath = path.join(this.tempDir, `${this.job.id}-animated-clip-${i + 1}.mp4`);
          await fs.writeFile(clipPath, videoBuffer);
          
          console.log(`[Pipeline] Scene ${i + 1} animated:`, clipPath);
          return clipPath;
        });

        const clipPaths = await Promise.all(clipPromises);
        this.animatedClipPaths = clipPaths;
        this.updateStatus('generating_image', '3 unique scenes animated (Kling 2.6 Motion Control)');
        
      } else {
        // Fallback: Single image → 3 different animations
        this.updateStatus('generating_image', 'Animating single image with 3 styles (Kling 2.6)...');
        console.log('[Pipeline] Fallback: Using single image with 3 animation styles');
        
        const animationPrompts = getAnimationPromptSet(this.themeId || 'deep-love');
        
        const clipPromises = animationPrompts.map(async (prompt, i) => {
          console.log(`[Pipeline] Clip ${i + 1}:`, prompt.substring(0, 50) + '...');
          
          const videoUrl = await generateVideoFromImage({
            imageUrl: this.imageUrlForKling!,
            prompt: prompt,
            aspectRatio: '16:9',
            motionType: motionType,
          });

          const videoBuffer = await downloadVideo(videoUrl);
          const clipPath = path.join(this.tempDir, `${this.job.id}-animated-clip-${i + 1}.mp4`);
          await fs.writeFile(clipPath, videoBuffer);
          
          console.log(`[Pipeline] Clip ${i + 1} completed:`, clipPath);
          return clipPath;
        });

        const clipPaths = await Promise.all(clipPromises);
        this.animatedClipPaths = clipPaths;
        this.updateStatus('generating_image', 'Animated backgrounds created (3 clips)');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.warn('[Pipeline] Kling animation failed, will use static image:', err.message);
    }
  }

  /**
   * Step 3: Create video with lyrics overlay
   * Uses 3 animated Kling clips (15 seconds) if available, otherwise static image
   */
  private async createVideo(): Promise<void> {
    this.updateStatus('creating_video', 'Creating video with lyrics overlay...');

    if (!this.job.song || !this.job.image) {
      throw new Error('Song or image not generated');
    }

    const outputPath = path.join(this.tempDir, `${this.job.id}-video.mp4`);

    // Check if we have animated backgrounds from Kling (3 clips)
    if (this.animatedClipPaths && this.animatedClipPaths.length === 3) {
      this.updateStatus('creating_video', 'Creating video with 3 animated Kling clips (15s base)...');
      
      // Use 3 animated clips concatenated and looped with lyrics overlay
      // Pass style variation for visual variety (font, position, color)
      await createVideoFromAnimatedClips({
        animatedClipPaths: this.animatedClipPaths,
        audioPath: this.job.song.audioUrl,
        outputPath,
        duration: this.job.song.duration,
        lyrics: this.job.song.lyricsTimming?.segments || [],
        styleVariation: this.styleVariation,
        cinematicEffects: this.cinematicEffects,
      });
    } else {
      // Fallback: Use static image with lyrics
      this.updateStatus('creating_video', 'Creating video with static image...');
      
      await createVideoWithLyrics({
        imagePath: this.job.image.url,
        audioPath: this.job.song.audioUrl,
        outputPath,
        duration: this.job.song.duration,
        lyrics: this.job.song.lyricsTimming?.segments || [],
      });
    }

    this.job.video = {
      path: outputPath,
      duration: this.job.song.duration,
    };

    this.updateStatus('creating_video', 'Video created successfully');
  }

  /**
   * Step 4: Create YouTube Shorts
   */
  private async createShorts(): Promise<void> {
    this.updateStatus('cutting_shorts', 'Creating YouTube Shorts...');

    if (!this.job.video) {
      throw new Error('Video not created');
    }

    // Pass lyrics for smart selection (prefers chorus, emotional lines, etc.)
    const shorts = await createAllShorts({
      inputVideoPath: this.job.video.path,
      totalDuration: this.job.video.duration,
      shortsCount: 3,
      shortDuration: 25, // 25 seconds for more engaging shorts
      categoryId: this.job.category.id, // Pass category for hook text
      lyrics: this.job.song?.lyricsTimming?.segments, // For smart shorts selection
    });

    this.job.shorts = shorts;

    this.updateStatus('cutting_shorts', `Created ${shorts.length} shorts`);
  }

  /**
   * Step 5: Upload to YouTube
   */
  private async uploadToYouTube(
    privacyStatus: 'private' | 'unlisted' | 'public'
  ): Promise<void> {
    this.updateStatus('uploading', 'Uploading to YouTube...');

    if (!this.job.video || !this.job.shorts || !this.job.song) {
      throw new Error('Content not ready for upload');
    }

    const { category, prompt } = this.job;

    // Generate description and tags
    const description = generateVideoDescription({
      title: this.job.song.title,
      category: category.name,
      lyrics: this.job.song.lyrics,
    });

    const tags = generateVideoTags({
      title: this.job.song.title,
      category: category.name,
      genres: category.genres,
      moods: category.moods,
    });

    // Upload main video
    this.updateStatus('uploading', 'Uploading main video...');
    const mainVideo = await uploadVideo({
      videoPath: this.job.video.path,
      title: this.job.song.title,
      description,
      tags,
      categoryId: '10', // Music
      privacyStatus,
      isShort: false,
    });

    this.job.youtube = {
      mainVideo,
      shorts: [],
    };
    
    // Auto-add to playlist based on theme (if playlist info provided)
    if (this.playlistInfo && mainVideo.videoId) {
      this.updateStatus('uploading', 'Adding to playlist...');
      await autoAddToPlaylist({
        videoId: mainVideo.videoId,
        playlistInfo: this.playlistInfo,
      });
    }

    // Upload shorts
    for (const short of this.job.shorts) {
      this.updateStatus('uploading', `Uploading short ${short.index}/3...`);
      
      const shortDescription = generateVideoDescription({
        title: `${this.job.song.title} - Part ${short.index}`,
        category: category.name,
        lyrics: '',
        isShort: true,
      });

      const shortResult = await uploadVideo({
        videoPath: short.path,
        title: `${this.job.song.title} - Part ${short.index} #Shorts`,
        description: shortDescription,
        tags: [...tags, 'Shorts'],
        categoryId: '10',
        privacyStatus,
        isShort: true,
      });

      this.job.youtube.shorts?.push(shortResult);
    }

    this.updateStatus('uploading', 'All videos uploaded to YouTube');
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(): Promise<void> {
    try {
      // Clean up audio file
      if (this.job.song?.audioUrl) {
        await fs.unlink(this.job.song.audioUrl).catch(() => {});
      }

      // Clean up image file
      if (this.job.image?.url) {
        await fs.unlink(this.job.image.url).catch(() => {});
      }

      // Clean up video file
      if (this.job.video?.path) {
        await fs.unlink(this.job.video.path).catch(() => {});
      }

      // Clean up shorts
      if (this.job.shorts) {
        for (const short of this.job.shorts) {
          await fs.unlink(short.path).catch(() => {});
        }
      }

      console.log('[Pipeline] Cleanup completed');
    } catch (error) {
      console.warn('[Pipeline] Cleanup error:', error);
    }
  }
}

/**
 * Quick function to run the full pipeline
 */
export async function runGenerationPipeline(options: {
  categoryId?: string;
  manualPrompt?: ManualPromptOptions;
  uploadToYouTube?: boolean;
  privacyStatus?: 'private' | 'unlisted' | 'public';
  previewMode?: boolean;
  onStatusChange?: (status: JobStatus, message: string) => void;
  useKlingAnimation?: boolean; // Use Kling for animated backgrounds
}): Promise<GenerationJob> {
  // Use manual prompt if provided, otherwise use categoryId
  const pipelineInput = options.manualPrompt || options.categoryId;
  
  const config: PipelineConfig = {
    useKlingAnimation: options.useKlingAnimation ?? true, // Default to using Kling
  };
  
  const pipeline = new GenerationPipeline(pipelineInput, options.onStatusChange, config);
  return pipeline.run({
    uploadToYouTube: options.uploadToYouTube,
    privacyStatus: options.privacyStatus,
    previewMode: options.previewMode,
  });
}
