/**
 * 갤러리 파일 업로드
 * POST /api/admin/archive/upload — multipart/form-data, field: "files"
 * R2 저장 + D1 메타데이터 INSERT
 * 이미지(image/*) + 동영상(video/*) 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadGalleryFiles } from '@/capabilities/media/mediaLifecycle.server';
import { getDB, getR2 } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  const r2 = getR2();

  if (!db || !r2) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Storage not available in this environment' } },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'No files provided' } },
        { status: 400 },
      );
    }

    const uploaded = await uploadGalleryFiles(db, r2, files);

    return NextResponse.json({ success: true, data: uploaded });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Upload failed' } },
      { status: 500 },
    );
  }
}
