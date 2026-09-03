import { NextRequest, NextResponse } from 'next/server';
import { fetchGalleryObject } from '@/capabilities/media/mediaRepository.server';
import { getR2 } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r2 = getR2();
  if (!r2) {
    return NextResponse.json(
      { success: false, error: { code: 'R2_UNAVAILABLE', message: 'Media storage not available' } },
      { status: 503 },
    );
  }

  try {
    const object = await fetchGalleryObject(r2, id);
    if (!object) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } },
        { status: 404 },
      );
    }

    const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream';
    const cacheControl = contentType.startsWith('video/')
      ? 'public, max-age=86400'
      : 'public, max-age=31536000, immutable';
    return new Response(object.body as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' } },
      { status: 500 },
    );
  }
}
