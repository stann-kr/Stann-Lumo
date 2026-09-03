import { NextRequest, NextResponse } from 'next/server';
import {
  addYouTubeGalleryVideo,
  type YouTubeGalleryInput,
} from '@/capabilities/media/mediaRepository.server';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as YouTubeGalleryInput;
    if (!body.youtubeUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'youtubeUrl is required' } },
        { status: 400 },
      );
    }

    const photo = await addYouTubeGalleryVideo(db, body);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_URL', message: 'Invalid YouTube URL' } },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true, data: photo });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add YouTube video' } },
      { status: 500 },
    );
  }
}
