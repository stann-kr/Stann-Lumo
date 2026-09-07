import { NextRequest } from 'next/server';
import type { Performance } from '@/capabilities/events/events';
import {
  fetchPerformancesSnapshot,
  replacePerformancesAtRevision,
} from '@/capabilities/events/eventsRepository.server';
import { privateNoStoreJson, requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return privateNoStoreJson(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    return privateNoStoreJson({ success: true, data: await fetchPerformancesSnapshot(db) });
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch performances' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return privateNoStoreJson(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = await request.json() as unknown;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'body must be an object' } },
        { status: 400 },
      );
    }
    const { items, revision } = body as { items?: unknown; revision?: unknown };
    if (!Array.isArray(items)) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'items must be an array' } },
        { status: 400 },
      );
    }
    if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'revision must be a non-negative integer' } },
        { status: 400 },
      );
    }
    if (!arePerformancesValid(items)) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'items contain an invalid performance' } },
        { status: 400 },
      );
    }

    const result = await replacePerformancesAtRevision(db, items, revision);
    if (result.kind === 'conflict') {
      return privateNoStoreJson(
        { success: false, error: { code: 'CONFLICT', message: 'Performances changed. Refresh and try again.' } },
        { status: 409 },
      );
    }

    return privateNoStoreJson({ success: true, data: result.snapshot });
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update performances' } },
      { status: 500 },
    );
  }
}

function arePerformancesValid(items: unknown[]): items is Performance[] {
  const ids = new Set<string>();
  const raEventIds = new Set<string>();
  const optionalStringKeys = [
    'location', 'time', 'lineup', 'raEventLink', 'raEventId', 'posterImageId',
    'raVenueId', 'raCountryName', 'raAreaName', 'raAreaId', 'raAddress', 'raCost',
    'raPromoter', 'raVenueLink', 'raPromoterId', 'raLineupRaw',
  ];
  const optionalBooleanKeys = ['raHasTickets', 'raHasBarcode'];

  return items.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const performance = item as Record<string, unknown>;
    if (
      typeof performance.id !== 'string'
      || performance.id.trim() === ''
      || typeof performance.date !== 'string'
      || typeof performance.venue !== 'string'
      || typeof performance.title !== 'string'
      || !['Announced', 'TBA', 'Cancelled'].includes(performance.status as string)
      || ids.has(performance.id)
      || optionalStringKeys.some((key) => performance[key] !== undefined && typeof performance[key] !== 'string')
      || optionalBooleanKeys.some((key) => performance[key] !== undefined && typeof performance[key] !== 'boolean')
    ) return false;

    if (typeof performance.raEventId === 'string' && performance.raEventId !== '') {
      if (raEventIds.has(performance.raEventId)) return false;
      raEventIds.add(performance.raEventId);
    }
    ids.add(performance.id);
    return true;
  });
}
