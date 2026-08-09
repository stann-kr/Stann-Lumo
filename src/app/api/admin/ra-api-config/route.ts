/**
 * 어드민 RA API 설정 API
 * GET  /api/admin/ra-api-config  — 설정 조회
 * PUT  /api/admin/ra-api-config  — 설정 업데이트
 */

import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { privateNoStoreJson, requireAdminSession } from '@/lib/adminAuth';
import type { RAApiConfigLegacy, RAApiConfigLegacyUpdate } from '@/types/admin';

interface RaApiConfigRow {
  id: number;
  user_id: string | null;
  api_key: string | null;
  dj_id: string | null;
  option: string;
  year: string | null;
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
    const row = await db.prepare('SELECT * FROM ra_api_config WHERE id = 1').first<RaApiConfigRow>();

    const data: RAApiConfigLegacy = {
      userId: row?.user_id ?? '',
      apiKey: row?.api_key ?? '',
      djId: row?.dj_id ?? '',
      option: (row?.option ?? '1') as RAApiConfigLegacy['option'],
      year: row?.year ?? '',
    };

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
    const body = (await request.json()) as { raApiConfig?: RAApiConfigLegacyUpdate };
    const { raApiConfig } = body;

    if (!raApiConfig || typeof raApiConfig !== 'object') {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'raApiConfig is required' } },
        { status: 400 },
      );
    }

    await db
      .prepare(
        `UPDATE ra_api_config
         SET user_id = ?,
             api_key = COALESCE(NULLIF(TRIM(?), ''), api_key),
             dj_id = ?,
             option = ?,
             year = ?
         WHERE id = 1`,
      )
      .bind(
        raApiConfig.userId ?? null,
        raApiConfig.apiKey ?? null,
        raApiConfig.djId ?? null,
        raApiConfig.option ?? '1',
        raApiConfig.year ?? null,
      )
      .run();

    return privateNoStoreJson({ success: true });
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update RA API config' } },
      { status: 500 },
    );
  }
}
