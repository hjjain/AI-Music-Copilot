import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/preview/[...path]
 * Serve video files for preview
 * Path format: /api/preview/temp/job-xxx-video.mp4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path
    const filePath = path.join(process.cwd(), ...params.path);
    
    // Security check: only allow files from temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    const resolvedPath = path.resolve(filePath);
    
    if (!resolvedPath.startsWith(tempDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Get file stats
    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    
    // Handle range requests for video seeking
    const range = request.headers.get('range');
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const fileStream = fs.createReadStream(resolvedPath, { start, end });
      
      // Convert Node.js stream to Web stream safely.
      // Important: browsers often cancel range requests; if we enqueue after the controller
      // is closed, Node will throw "Invalid state: Controller is already closed".
      const webStream = new ReadableStream<Uint8Array>({
        start(controller) {
          let closed = false;

          const safeClose = () => {
            if (closed) return;
            closed = true;
            try {
              controller.close();
            } catch {
              // ignore
            }
          };

          const safeError = (err: unknown) => {
            if (closed) return;
            closed = true;
            try {
              controller.error(err);
            } catch {
              // ignore
            }
          };

          fileStream.on('data', (chunk: string | Buffer) => {
            if (closed) return;
            try {
              const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
              controller.enqueue(new Uint8Array(buf));
            } catch {
              // Client likely disconnected; stop reading.
              closed = true;
              fileStream.destroy();
            }
          });

          fileStream.on('end', safeClose);
          fileStream.on('close', safeClose);
          fileStream.on('error', safeError);
        },
        cancel() {
          // Range request cancelled by client (seeking/closing tab)
          fileStream.destroy();
        },
      });
      
      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': getContentType(resolvedPath),
        },
      });
    }
    
    // Full file response
    const fileBuffer = fs.readFileSync(resolvedPath);
    
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': getContentType(resolvedPath),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Preview] Error:', err.message);
    
    return NextResponse.json(
      { error: 'Failed to serve file', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  const contentTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}
