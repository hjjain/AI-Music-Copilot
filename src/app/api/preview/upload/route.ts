import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { 
  uploadVideo, 
  generateVideoDescription, 
  generateVideoTags,
  isYouTubeConfigured 
} from '@/lib/youtube/client';
import { loadHistory, addJobToHistory, getJobById } from '@/lib/storage/history';

/**
 * POST /api/preview/upload
 * Upload a previewed video to YouTube
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, privacyStatus = 'private' } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!isYouTubeConfigured()) {
      return NextResponse.json(
        { error: 'YouTube is not configured. Please connect your account in Settings.' },
        { status: 400 }
      );
    }

    // Get job from history
    const job = await getJobById(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if preview files exist
    const tempDir = path.join(process.cwd(), 'temp');
    const videoPath = path.join(tempDir, `${jobId}-video.mp4`);
    
    try {
      await fs.access(videoPath);
    } catch {
      return NextResponse.json(
        { error: 'Preview files have expired or been deleted. Please generate again.' },
        { status: 404 }
      );
    }

    // Generate description and tags
    const description = generateVideoDescription({
      title: job.song?.title || job.prompt.title,
      category: job.category.name,
      lyrics: job.song?.lyrics || '',
    });

    const tags = generateVideoTags({
      title: job.song?.title || job.prompt.title,
      category: job.category.name,
      genres: job.category.genres,
      moods: job.category.moods,
    });

    // Upload main video
    console.log('[Preview] Uploading main video...');
    const mainVideo = await uploadVideo({
      videoPath,
      title: job.song?.title || job.prompt.title,
      description,
      tags,
      categoryId: '10', // Music
      privacyStatus,
      isShort: false,
    });

    // Upload shorts if they exist
    const shorts = [];
    for (let i = 1; i <= 3; i++) {
      const shortPath = path.join(tempDir, `${jobId}-video-short-${i}.mp4`);
      try {
        await fs.access(shortPath);
        
        console.log(`[Preview] Uploading short ${i}...`);
        const shortDescription = generateVideoDescription({
          title: `${job.song?.title || job.prompt.title} - Part ${i}`,
          category: job.category.name,
          lyrics: '',
          isShort: true,
        });

        const shortResult = await uploadVideo({
          videoPath: shortPath,
          title: `${job.song?.title || job.prompt.title} - Part ${i} #Shorts`,
          description: shortDescription,
          tags: [...tags, 'Shorts'],
          categoryId: '10',
          privacyStatus,
          isShort: true,
        });

        shorts.push(shortResult);
      } catch {
        // Short doesn't exist, skip
      }
    }

    // Update job with YouTube info
    job.youtube = {
      mainVideo,
      shorts,
    };

    // Save updated job to history
    await addJobToHistory(job);

    // Cleanup temp files
    try {
      await fs.unlink(videoPath);
      for (let i = 1; i <= 3; i++) {
        const shortPath = path.join(tempDir, `${jobId}-video-short-${i}.mp4`);
        await fs.unlink(shortPath).catch(() => {});
      }
      // Also cleanup audio and image
      await fs.unlink(path.join(tempDir, `${jobId}-audio.mp3`)).catch(() => {});
      await fs.unlink(path.join(tempDir, `${jobId}-cover.png`)).catch(() => {});
    } catch {
      console.warn('[Preview] Cleanup failed for some files');
    }

    return NextResponse.json({
      success: true,
      youtube: {
        mainVideo,
        shorts,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Preview] Upload failed:', err.message);
    
    return NextResponse.json(
      { error: 'Upload failed', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/preview/upload
 * Delete preview files without uploading
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const tempDir = path.join(process.cwd(), 'temp');

    // Delete all temp files for this job
    const filesToDelete = [
      `${jobId}-video.mp4`,
      `${jobId}-video-short-1.mp4`,
      `${jobId}-video-short-2.mp4`,
      `${jobId}-video-short-3.mp4`,
      `${jobId}-audio.mp3`,
      `${jobId}-cover.png`,
    ];

    for (const file of filesToDelete) {
      try {
        await fs.unlink(path.join(tempDir, file));
      } catch {
        // File doesn't exist, skip
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: 'Cleanup failed', message: err.message },
      { status: 500 }
    );
  }
}
