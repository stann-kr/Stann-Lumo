import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { restoreRaEvent } from '@/capabilities/events/raSyncState';

export async function DELETE(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;
  const db = getDB();
  if (!db) return privateNoStoreJson({ success: false, error: {
    code: 'DB_UNAVAILABLE', message: 'Database not available',
  } }, { status: 503 });
  let raEventId: string;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || !('raEventId' in body) ||
        typeof body.raEventId !== 'string' || !/^\d+$/.test(body.raEventId)) {
      throw new Error('Invalid event ID');
    }
    raEventId = body.raEventId;
  } catch {
    return privateNoStoreJson({ success: false, error: {
      code: 'BAD_REQUEST', message: 'Invalid RA event ID',
    } }, { status: 400 });
  }
  try {
    await restoreRaEvent(db, raEventId);
    return privateNoStoreJson({ success: true });
  } catch {
    return privateNoStoreJson({ success: false, error: {
      code: 'SYNC_UNAVAILABLE', message: 'Failed to restore RA event',
    } }, { status: 503 });
  }
}
