import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getRaSyncStatus } from '@/capabilities/events/raSyncState';
import { syncRaEvents } from '@/capabilities/events/raScheduledSync';

async function handle(request: NextRequest, run: boolean) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;
  const db = getDB();
  if (!db) return privateNoStoreJson({ success: false, error: {
    code: 'DB_UNAVAILABLE', message: 'Database not available',
  } }, { status: 503 });
  try {
    const result = run ? await syncRaEvents(db) : undefined;
    const status = await getRaSyncStatus(db);
    return privateNoStoreJson({ success: true, data: run ? { result, status } : status });
  } catch {
    return privateNoStoreJson({ success: false, error: {
      code: 'SYNC_UNAVAILABLE', message: 'RA sync is unavailable',
    } }, { status: 503 });
  }
}

export function GET(request: NextRequest) { return handle(request, false); }
export function POST(request: NextRequest) { return handle(request, true); }
