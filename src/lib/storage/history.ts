import fs from 'fs/promises';
import path from 'path';
import { GenerationJob, SongHistory } from '@/types';

/**
 * Storage configuration
 */
const STORAGE_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(STORAGE_DIR, 'history.json');
const MAX_HISTORY_ITEMS = 100;

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Load history from JSON file
 */
export async function loadHistory(): Promise<SongHistory> {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(data) as SongHistory;
    
    // Convert date strings back to Date objects
    parsed.jobs = parsed.jobs.map((job) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
    }));
    parsed.lastUpdated = new Date(parsed.lastUpdated);
    
    return parsed;
  } catch (error) {
    // File doesn't exist or is invalid, return empty history
    return {
      jobs: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * Save history to JSON file
 */
export async function saveHistory(history: SongHistory): Promise<void> {
  await ensureStorageDir();
  
  // Limit history to MAX_HISTORY_ITEMS
  const limitedHistory: SongHistory = {
    ...history,
    jobs: history.jobs.slice(0, MAX_HISTORY_ITEMS),
    lastUpdated: new Date(),
  };
  
  await fs.writeFile(
    HISTORY_FILE,
    JSON.stringify(limitedHistory, null, 2),
    'utf-8'
  );
  
  console.log('[Storage] History saved:', limitedHistory.jobs.length, 'jobs');
}

/**
 * Add a job to history
 */
export async function addJobToHistory(job: GenerationJob): Promise<void> {
  const history = await loadHistory();
  
  // Check if job already exists (update it)
  const existingIndex = history.jobs.findIndex((j) => j.id === job.id);
  
  if (existingIndex >= 0) {
    history.jobs[existingIndex] = job;
  } else {
    // Add to beginning of array (most recent first)
    history.jobs.unshift(job);
  }
  
  await saveHistory(history);
}

/**
 * Get job by ID
 */
export async function getJobById(jobId: string): Promise<GenerationJob | null> {
  const history = await loadHistory();
  return history.jobs.find((job) => job.id === jobId) || null;
}

/**
 * Get all jobs with optional filtering
 */
export async function getJobs(options?: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: GenerationJob[]; total: number }> {
  const history = await loadHistory();
  let jobs = history.jobs;
  
  // Filter by status
  if (options?.status) {
    jobs = jobs.filter((job) => job.status === options.status);
  }
  
  // Filter by category
  if (options?.category) {
    jobs = jobs.filter((job) => job.category.id === options.category);
  }
  
  const total = jobs.length;
  
  // Apply pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 20;
  jobs = jobs.slice(offset, offset + limit);
  
  return { jobs, total };
}

/**
 * Delete a job from history
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  const history = await loadHistory();
  const initialLength = history.jobs.length;
  
  history.jobs = history.jobs.filter((job) => job.id !== jobId);
  
  if (history.jobs.length < initialLength) {
    await saveHistory(history);
    return true;
  }
  
  return false;
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await saveHistory({
    jobs: [],
    lastUpdated: new Date(),
  });
}

/**
 * Get statistics from history
 */
export async function getHistoryStats(): Promise<{
  totalSongs: number;
  totalUploads: number;
  totalShorts: number;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
}> {
  const history = await loadHistory();
  
  let totalUploads = 0;
  let totalShorts = 0;
  let pendingJobs = 0;
  let completedJobs = 0;
  let failedJobs = 0;
  
  for (const job of history.jobs) {
    if (job.status === 'completed') {
      completedJobs++;
      if (job.youtube?.mainVideo) {
        totalUploads++;
      }
      if (job.youtube?.shorts) {
        totalShorts += job.youtube.shorts.length;
      }
    } else if (job.status === 'failed') {
      failedJobs++;
    } else {
      // All other statuses are "in progress" or pending
      pendingJobs++;
    }
  }
  
  return {
    totalSongs: history.jobs.length,
    totalUploads,
    totalShorts,
    pendingJobs,
    completedJobs,
    failedJobs,
  };
}
