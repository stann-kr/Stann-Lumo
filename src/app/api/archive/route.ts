import { NextResponse } from 'next/server';
import type { GalleryData } from '@/capabilities/media/media';
import { fetchGalleryPhotos } from '@/capabilities/media/mediaRepository.server';
import { getDB } from '@/lib/db';

export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ success: true, data: { photos: [] } });

  try {
    const data: GalleryData = { photos: await fetchGalleryPhotos(db) };
    return NextResponse.json({ success: true, data }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch archive' } },
      { status: 500 },
    );
  }
}
