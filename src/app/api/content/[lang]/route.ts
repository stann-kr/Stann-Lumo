/**
 * 공개 콘텐츠 API — 전체 ContentData 반환
 * GET /api/content/[lang]  (lang: 'en' | 'ko')
 *
 * DB 없는 개발 환경: 503 반환 → ContentContext error state
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchContentBundle,
  type ContentLocale,
} from '@/capabilities/content/contentBundle.server';
import { getDB } from '@/lib/db';
import { assertPublicPayloadSafe } from '@/lib/security/publicPayload';

const PUBLIC_NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const;

function publicJson(payload: unknown, status = 200) {
  assertPublicPayloadSafe(payload);
  return NextResponse.json(payload, { status, headers: PUBLIC_NO_STORE_HEADERS });
}

function isContentLocale(lang: string): lang is ContentLocale {
  return lang === 'en' || lang === 'ko';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  if (!isContentLocale(lang)) {
    return publicJson(
      { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
      400,
    );
  }

  const db = getDB();
  if (!db) {
    return publicJson(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      503,
    );
  }

  try {
    const data = await fetchContentBundle(db, lang);
    return publicJson({ success: true, data });
  } catch {
    return publicJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
      500,
    );
  }
}
