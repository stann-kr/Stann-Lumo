import { NextRequest, NextResponse } from 'next/server';
import type { EventDetailData } from '@/capabilities/events/events';
import { fetchEventDetail } from '@/capabilities/events/eventsRepository.server';
import { getDB } from '@/lib/db';

export type { EventDetailData } from '@/capabilities/events/events';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const data: EventDetailData | null = await fetchEventDetail(db, id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event' } },
      { status: 500 },
    );
  }
}
