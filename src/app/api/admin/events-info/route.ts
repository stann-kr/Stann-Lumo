import { NextRequest, NextResponse } from 'next/server';
import { isContentLocale } from '@/capabilities/content/content';
import type { EventsInfo } from '@/capabilities/events/events';
import {
  fetchEventsInfo,
  replaceEventsInfo,
} from '@/capabilities/events/eventsRepository.server';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';
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
    return NextResponse.json({ success: true, data: await fetchEventsInfo(db, lang) });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events info' } },
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
    const body = (await request.json()) as { lang: string; eventsInfo: EventsInfo };
    if (!isContentLocale(body.lang)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!body.eventsInfo || typeof body.eventsInfo !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'eventsInfo is required' } },
        { status: 400 },
      );
    }

    await replaceEventsInfo(db, body.lang, body.eventsInfo);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update events info' } },
      { status: 500 },
    );
  }
}
