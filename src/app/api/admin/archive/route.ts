import { NextRequest, NextResponse } from 'next/server';
import type { GalleryPhoto } from '@/capabilities/media/media';
import {
  fetchGalleryPhotos,
  updateGalleryPhotos,
} from '@/capabilities/media/mediaRepository.server';
import { requireAdminSession } from '@/lib/adminAuth';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
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
    return NextResponse.json({ success: true, data: await fetchGalleryPhotos(db) });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch gallery' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const body = (await request.json()) as { photos: GalleryPhoto[] };
    if (!Array.isArray(body.photos)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'photos must be an array' } },
        { status: 400 },
      );
    }

    await updateGalleryPhotos(db, body.photos);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update gallery' } },
      { status: 500 },
    );
  }
}
