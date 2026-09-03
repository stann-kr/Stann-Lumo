/**
 * 갤러리 사진 삭제
 * DELETE /api/admin/archive/[id] — D1 + R2 동시 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteGalleryMedia } from '@/capabilities/media/mediaLifecycle.server';
import { getDB, getR2 } from '@/lib/db';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const { id } = await params;

  const db = getDB();
  const r2 = getR2();

  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    await deleteGalleryMedia(db, r2, id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete photo' } },
      { status: 500 },
    );
  }
}
