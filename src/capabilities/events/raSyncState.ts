import type { D1Database } from '@/lib/db';
import { nextRaSyncTime, type RaSyncStatus } from './raSync';

export interface RaSyncStateRow {
  last_status: RaSyncStatus['lastStatus'];
  last_started_at: number | null;
  last_completed_at: number | null;
  last_success_at: number | null;
  last_error_code: string | null;
  last_fetched: number;
  last_inserted: number;
  last_skipped_excluded: number;
  scheduled_slot: number | null;
  retry_attempts: number;
  next_retry_at: number | null;
  lease_token: string | null;
  lease_expires_at: number | null;
}

export async function readRaSyncState(db: D1Database): Promise<RaSyncStateRow> {
  const state = await db.prepare('SELECT * FROM ra_sync_state WHERE id = 1').first<RaSyncStateRow>();
  if (!state) throw new Error('RA sync migration required');
  return state;
}

export async function getRaSyncStatus(db: D1Database, now = Date.now()): Promise<RaSyncStatus> {
  const state = await readRaSyncState(db);
  const excluded = await db.prepare(
    'SELECT ra_event_id, title, excluded_at FROM ra_event_exclusions ORDER BY excluded_at DESC',
  ).all<{ ra_event_id: string; title: string; excluded_at: number }>();
  const interrupted = state.last_status === 'running' && (state.lease_expires_at ?? 0) <= now;
  return {
    lastStatus: interrupted ? 'failed' : state.last_status,
    lastStartedAt: state.last_started_at,
    lastCompletedAt: state.last_completed_at,
    lastSuccessAt: state.last_success_at,
    lastErrorCode: interrupted ? 'INTERRUPTED' : state.last_error_code,
    fetched: state.last_fetched,
    inserted: state.last_inserted,
    skippedExcluded: state.last_skipped_excluded,
    nextScheduledAt: nextRaSyncTime(now),
    nextRetryAt: state.next_retry_at,
    exclusions: excluded.results.map((row) => ({
      raEventId: row.ra_event_id, title: row.title, excludedAt: row.excluded_at,
    })),
  };
}

export async function restoreRaEvent(db: D1Database, raEventId: string): Promise<void> {
  await db.prepare('DELETE FROM ra_event_exclusions WHERE ra_event_id = ?').bind(raEventId).run();
}
