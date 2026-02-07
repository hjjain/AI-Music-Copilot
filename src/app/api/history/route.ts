import { NextRequest, NextResponse } from 'next/server';
import { getJobs, getHistoryStats, deleteJob, clearHistory } from '@/lib/storage/history';

/**
 * GET /api/history
 * Get generation history with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const statsOnly = searchParams.get('stats') === 'true';

    // Return stats only if requested
    if (statsOnly) {
      const stats = await getHistoryStats();
      return NextResponse.json({ stats });
    }

    // Get jobs with filters
    const { jobs, total } = await getJobs({
      status,
      category,
      limit,
      offset,
    });

    // Also get stats
    const stats = await getHistoryStats();

    return NextResponse.json({
      jobs,
      total,
      limit,
      offset,
      stats,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[API] History fetch failed:', err.message);
    
    return NextResponse.json(
      { error: 'Failed to fetch history', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history
 * Delete a specific job or clear all history
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await clearHistory();
      return NextResponse.json({ success: true, message: 'History cleared' });
    }

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteJob(jobId);
    
    if (deleted) {
      return NextResponse.json({ success: true, message: 'Job deleted' });
    } else {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[API] History delete failed:', err.message);
    
    return NextResponse.json(
      { error: 'Failed to delete', message: err.message },
      { status: 500 }
    );
  }
}
