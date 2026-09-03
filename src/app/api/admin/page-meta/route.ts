import { NextRequest, NextResponse } from 'next/server';
import { isContentLocale, type PageMeta } from '@/capabilities/content/content';
import { fetchPageMeta, replacePageMeta } from '@/capabilities/content/contentAdmin.server';
import { requireAdminSession } from '@/lib/adminAuth';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const lang = request.nextUrl.searchParams.get('lang') ?? 'en';
  if (!isContentLocale(lang)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
      { status: 400 },
    );
  }

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json({ success: true, data: await fetchPageMeta(db, lang) });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch page meta' } },
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
    const body = (await request.json()) as { lang: string; pageMeta: PageMeta };
    const { lang } = body;
    if (!isContentLocale(lang)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!body.pageMeta || typeof body.pageMeta !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'pageMeta is required' } },
        { status: 400 },
      );
    }

    await replacePageMeta(db, lang, body.pageMeta);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update page meta' } },
      { status: 500 },
    );
  }
}
