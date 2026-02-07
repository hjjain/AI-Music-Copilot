import axios from 'axios';
import { SunoSongData, SunoLyricsTiming, LyricSegment } from '@/types';
import { retryApiCall } from '@/lib/utils/retry';

/**
 * Suno API Configuration
 */
const SUNO_API_URL = process.env.SUNO_API_URL || 'https://api.acedata.cloud/suno/audios';
const SUNO_TIMING_URL = process.env.SUNO_TIMING_URL || 'https://api.acedata.cloud/suno/timing';
const SUNO_MODEL = process.env.SUNO_MODEL || 'chirp-v4';

/**
 * Generate a song using Suno API
 * 
 * Suno generates lyrics from our prompt (custom=false)
 * This ensures the timing API works correctly for lyrics sync
 */
export async function generateSong(params: {
  title: string;
  lyrics: string;
  style?: string;
}): Promise<SunoSongData> {
  const apiKey = process.env.SUNO_API_KEY;
  
  if (!apiKey) {
    throw new Error('SUNO_API_KEY is not configured');
  }

  console.log('[Suno] Generating song:', params.title);
  console.log('[Suno] Style:', params.style);

  // Style with Hindi/Hinglish instruction
  const styleWithHinglish = (params.style || 'Hindi, Bollywood inspired') + ', Hinglish lyrics in Roman script';
  
  // Suno generates lyrics - this is required for timing API to work
  const truncatedPrompt = params.lyrics?.substring(0, 150) || '';
  const hinglishInstruction = 'Lyrics in Hinglish (Hindi words in Roman script). ';
  const finalPrompt = hinglishInstruction + truncatedPrompt;
  
  console.log('[Suno] Prompt:', finalPrompt.substring(0, 100) + '...');
  
  const payload = {
    action: 'generate',
    model: SUNO_MODEL,
    custom: false,  // Suno generates lyrics for timing API
    prompt: finalPrompt.substring(0, 200),
    title: params.title,
    style: styleWithHinglish,
  };

  console.log('[Suno] API Request payload:', JSON.stringify(payload, null, 2));

  return retryApiCall(async () => {
    try {
      const response = await axios.post(SUNO_API_URL, payload, {
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        timeout: 300000, // 5 minutes timeout - song generation can take a while
      });

      console.log('[Suno] API Response status:', response.status);
      console.log('[Suno] API Response data:', JSON.stringify(response.data).substring(0, 500));

      if (!response.data || !response.data.data || !response.data.data[0]) {
        throw new Error('Invalid response from Suno API');
      }

      const songData = response.data.data[0];
      
      if (!songData.audio_url) {
        throw new Error('Suno response missing audio_url');
      }

      console.log('[Suno] Song generated successfully:', songData.id);
      console.log('[Suno] Audio URL:', songData.audio_url);
      console.log('[Suno] Has lyrics:', !!songData.lyric);
      if (songData.lyric) {
        console.log('[Suno] Lyrics preview:', songData.lyric.substring(0, 200) + '...');
      }

      return songData;
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { data?: unknown; status?: number; statusText?: string }; 
        message?: string;
        config?: { data?: string };
      };
      
      // Log full error details for debugging
      console.error('[Suno] ========== GENERATION FAILED ==========');
      console.error('[Suno] Status:', axiosError.response?.status);
      console.error('[Suno] Status Text:', axiosError.response?.statusText);
      console.error('[Suno] Response Data:', JSON.stringify(axiosError.response?.data, null, 2));
      console.error('[Suno] Error Message:', axiosError.message);
      console.error('[Suno] ========================================');
      
      // Extract actual error message from response if available
      const responseData = axiosError.response?.data as { 
        error?: string | { message?: string }; 
        message?: string; 
        detail?: string;
        msg?: string;
      } | undefined;
      
      // Handle nested error objects
      let detailedError: string;
      if (typeof responseData?.error === 'object' && responseData?.error?.message) {
        detailedError = responseData.error.message;
      } else if (typeof responseData?.error === 'string') {
        detailedError = responseData.error;
      } else if (responseData?.message) {
        detailedError = responseData.message;
      } else if (responseData?.detail) {
        detailedError = responseData.detail;
      } else if (responseData?.msg) {
        detailedError = responseData.msg;
      } else if (responseData) {
        detailedError = JSON.stringify(responseData);
      } else {
        detailedError = axiosError.message || 'Unknown error';
      }
      
      // Include status code in error message for retry logic
      const statusCode = axiosError.response?.status;
      const errorMsg = statusCode 
        ? `Suno generation failed (${statusCode}): ${detailedError}`
        : `Suno generation failed: ${detailedError}`;
      throw new Error(errorMsg);
    }
  }, 'Suno song generation');
}

/**
 * Get lyrics timing (karaoke style) from AceData Suno API
 * API Docs: https://platform.acedata.cloud/documents/149a2dd6-8af9-43f1-8994-0f4466b16c6f
 */
export async function getLyricsTiming(audioId: string): Promise<SunoLyricsTiming | null> {
  const apiKey = process.env.SUNO_API_KEY;
  
  if (!apiKey) {
    console.warn('[Suno] API key not configured, skipping lyrics timing');
    return null;
  }

  try {
    console.log('[Suno] Fetching lyrics timing for:', audioId);
    
    const response = await axios.post(
      SUNO_TIMING_URL,
      { audio_id: audioId },
      {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        timeout: 60000, // Increased timeout for timing API
      }
    );

    console.log('[Suno] Timing API response:', JSON.stringify(response.data).substring(0, 500));

    // Handle AceData response format
    const data = response.data;
    
    // Check for data.data.aligned_words (AceData format with word-level timing)
    if (data && data.data && data.data.aligned_words && Array.isArray(data.data.aligned_words)) {
      const segments = parseAlignedWords(data.data.aligned_words);
      if (segments.length > 0) {
        console.log('[Suno] Lyrics timing fetched (aligned_words):', segments.length, 'segments');
        return { segments };
      }
    }
    
    // Check for data.data array (AceData format)
    if (data && data.data && Array.isArray(data.data)) {
      const segments = parseTimingData(data.data);
      if (segments.length > 0) {
        console.log('[Suno] Lyrics timing fetched successfully:', segments.length, 'segments');
        return { segments };
      }
    }

    // Check for direct segments array
    if (data && data.segments && Array.isArray(data.segments)) {
      console.log('[Suno] Lyrics timing fetched successfully:', data.segments.length, 'segments');
      return data;
    }

    // Check for direct array
    if (Array.isArray(data)) {
      const segments = parseTimingData(data);
      if (segments.length > 0) {
        console.log('[Suno] Lyrics timing fetched successfully:', segments.length, 'segments');
        return { segments };
      }
    }

    // Try to parse any other format
    if (data) {
      const parsed = parseLyricsResponse(data);
      if (parsed && parsed.segments.length > 0) {
        console.log('[Suno] Lyrics timing parsed:', parsed.segments.length, 'segments');
        return parsed;
      }
    }

    console.warn('[Suno] Could not parse timing response');
    return null;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown }; message?: string };
    console.warn('[Suno] Lyrics timing fetch failed:', axiosError.response?.data || axiosError.message);
    return null;
  }
}

/**
 * Parse aligned_words format from AceData API
 * Groups words into lines based on newlines and timing gaps
 */
function parseAlignedWords(alignedWords: unknown[]): LyricSegment[] {
  const segments: LyricSegment[] = [];
  let currentLine = '';
  let lineStart = 0;
  let lineEnd = 0;

  for (const item of alignedWords) {
    const word = item as { word?: string; start_s?: number; end_s?: number; success?: boolean };
    
    if (!word.word || word.start_s === undefined || word.end_s === undefined) {
      continue;
    }

    const text = word.word;
    const start = word.start_s;
    const end = word.end_s;

    // Check if this word starts a new line (contains newline or section marker)
    if (text.includes('\n') || text.includes('[')) {
      // Save current line if it exists
      if (currentLine.trim().length > 0) {
        segments.push({
          start: lineStart,
          end: lineEnd,
          text: currentLine.trim(),
        });
      }

      // Start new line - clean the text (remove section markers like [Verse 1])
      const cleanText = text.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
      if (cleanText.length > 0) {
        currentLine = cleanText + ' ';
        lineStart = start;
        lineEnd = end;
      } else {
        currentLine = '';
        lineStart = start;
        lineEnd = end;
      }
    } else {
      // Continue current line
      if (currentLine.length === 0) {
        lineStart = start;
      }
      currentLine += text;
      lineEnd = end;
    }
  }

  // Don't forget the last line
  if (currentLine.trim().length > 0) {
    segments.push({
      start: lineStart,
      end: lineEnd,
      text: currentLine.trim(),
    });
  }

  // Filter out very short segments and clean up
  return segments
    .filter(seg => seg.text.length > 1 && !seg.text.match(/^\[.*\]$/))
    .map(seg => ({
      ...seg,
      text: seg.text.replace(/\s+/g, ' ').trim(),
    }));
}

/**
 * Parse timing data from various API response formats
 */
function parseTimingData(data: unknown[]): LyricSegment[] {
  return data
    .filter((item: unknown) => {
      const segment = item as Record<string, unknown>;
      // Check for different possible field names
      const hasStart = segment.start !== undefined || segment.start_time !== undefined || segment.start_s !== undefined;
      const hasEnd = segment.end !== undefined || segment.end_time !== undefined || segment.end_s !== undefined;
      const hasText = segment.text !== undefined || segment.word !== undefined || segment.lyric !== undefined;
      return hasStart && hasEnd && hasText;
    })
    .map((item: unknown) => {
      const segment = item as Record<string, unknown>;
      return {
        start: Number(segment.start ?? segment.start_time ?? segment.start_s ?? 0),
        end: Number(segment.end ?? segment.end_time ?? segment.end_s ?? 0),
        text: String(segment.text ?? segment.word ?? segment.lyric ?? ''),
      };
    })
    .filter(seg => seg.text.trim().length > 0);
}

/**
 * Parse lyrics response to extract timing segments
 */
function parseLyricsResponse(data: unknown): SunoLyricsTiming | null {
  // Handle array format
  if (Array.isArray(data)) {
    const segments: LyricSegment[] = data
      .filter((item: unknown) => {
        const segment = item as { start?: number; end?: number; text?: string };
        return segment.start !== undefined && segment.end !== undefined && segment.text;
      })
      .map((item: unknown) => {
        const segment = item as { start: number; end: number; text: string };
        return {
          start: segment.start,
          end: segment.end,
          text: segment.text,
        };
      });
    
    if (segments.length > 0) {
      return { segments };
    }
  }

  // Handle object with different structures
  const objData = data as Record<string, unknown>;
  if (objData.lyrics && Array.isArray(objData.lyrics)) {
    return parseLyricsResponse(objData.lyrics);
  }

  if (objData.timing && Array.isArray(objData.timing)) {
    return parseLyricsResponse(objData.timing);
  }

  return null;
}

/**
 * Download audio file from URL
 */
export async function downloadAudio(audioUrl: string): Promise<Buffer> {
  console.log('[Suno] Downloading audio from:', audioUrl);
  
  return retryApiCall(async () => {
    const response = await axios({
      method: 'GET',
      url: audioUrl,
      responseType: 'arraybuffer',
      headers: {
        Accept: 'audio/mpeg',
      },
      timeout: 60000,
    });

    if (!response.data) {
      throw new Error('No data received from audio download');
    }

    console.log('[Suno] Audio downloaded, size:', response.data.length, 'bytes');
    return Buffer.from(response.data);
  }, 'Suno audio download');
}

/**
 * Parse plain lyrics text into timed segments
 * This is used as fallback when Suno timing API doesn't work
 */
export function parsePlainLyrics(
  lyrics: string,
  totalDuration: number
): SunoLyricsTiming {
  // Split lyrics into lines and remove empty ones
  const lines = lyrics
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('['));

  if (lines.length === 0) {
    return { segments: [] };
  }

  // Calculate time per line (with small gaps)
  const timePerLine = totalDuration / lines.length;
  const gapTime = 0.3; // 300ms gap between lines

  const segments: LyricSegment[] = lines.map((text, index) => ({
    start: index * timePerLine,
    end: (index + 1) * timePerLine - gapTime,
    text,
  }));

  return { segments };
}
