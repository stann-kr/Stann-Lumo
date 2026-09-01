/**
 * 어드민 RA API 설정 API
 * GET  /api/admin/ra-api-config  — 설정 조회
 * PUT  /api/admin/ra-api-config  — 설정 업데이트
 */

import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/lib/adminAuth';
import { getRaApiConfigView, isRAApiOption } from '@/capabilities/events/raApiConfig.server';
import type { RAApiConfigUpdate } from '@/capabilities/events/raConfig';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseUpdate(value: unknown): RAApiConfigUpdate | null {
  if (!isRecord(value)) return null;

  const { userId, djId, option, year, apiKey, clearApiKey } = value;
  if (typeof userId !== 'string' || typeof djId !== 'string' || !isRAApiOption(option)) {
    return null;
  }
  if (year !== undefined && typeof year !== 'string') return null;
  if (apiKey !== undefined && typeof apiKey !== 'string') return null;
  if (clearApiKey !== undefined && typeof clearApiKey !== 'boolean') return null;
  if (clearApiKey === true && typeof apiKey === 'string' && apiKey.trim().length > 0) return null;

  return { userId, djId, option, year, apiKey, clearApiKey };
}

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
    const data = await getRaApiConfigView(db);
    return privateNoStoreJson({ success: true, data });
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch RA API config' } },
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
    const body: unknown = await request.json();
    const raApiConfig = isRecord(body) ? parseUpdate(body.raApiConfig) : null;

    if (!raApiConfig) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid RA API config update' } },
        { status: 400 },
      );
    }

    await db
      .prepare(
        `UPDATE ra_api_config
         SET user_id = ?,
             api_key = CASE
               WHEN ? = 1 THEN NULL
               ELSE COALESCE(NULLIF(TRIM(?), ''), api_key)
             END,
             dj_id = ?,
             option = ?,
             year = ?
         WHERE id = 1`,
      )
      .bind(
        raApiConfig.userId ?? null,
        raApiConfig.clearApiKey === true ? 1 : 0,
        raApiConfig.apiKey ?? null,
        raApiConfig.djId ?? null,
        raApiConfig.option ?? '1',
        raApiConfig.year ?? null,
      )
      .run();

    const data = await getRaApiConfigView(db);
    return privateNoStoreJson({ success: true, data });
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update RA API config' } },
      { status: 500 },
    );
  }
}
