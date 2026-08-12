import 'server-only';

import type { D1Database } from '@/lib/db';
import type { RAApiConfigView, RAApiOption } from '@/types/admin';

interface RAApiConfigViewRow {
  user_id: string | null;
  dj_id: string | null;
  option: string | null;
  year: string | null;
  has_api_key: number | boolean | null;
}

interface RAApiConfigSecretRow {
  user_id: string | null;
  api_key: string | null;
  dj_id: string | null;
  option: string | null;
  year: string | null;
}

export interface RAApiConfigSecret {
  userId: string;
  apiKey: string;
  djId: string;
  option: RAApiOption;
  year: string;
}

export function isRAApiOption(value: unknown): value is RAApiOption {
  return value === '1' || value === '2' || value === '3' || value === '4';
}

function normalizeOption(value: string | null | undefined): RAApiOption {
  return isRAApiOption(value) ? value : '1';
}

export async function getRaApiConfigView(db: D1Database): Promise<RAApiConfigView> {
  const row = await db
    .prepare(
      `SELECT user_id,
              dj_id,
              option,
              year,
              CASE WHEN NULLIF(TRIM(api_key), '') IS NULL THEN 0 ELSE 1 END AS has_api_key
       FROM ra_api_config
       WHERE id = 1`,
    )
    .first<RAApiConfigViewRow>();

  return {
    userId: row?.user_id ?? '',
    djId: row?.dj_id ?? '',
    option: normalizeOption(row?.option),
    year: row?.year ?? '',
    hasApiKey: row?.has_api_key === true || row?.has_api_key === 1,
  };
}

export async function getRaApiConfigSecret(
  db: D1Database,
): Promise<RAApiConfigSecret | null> {
  const row = await db
    .prepare('SELECT user_id, api_key, dj_id, option, year FROM ra_api_config WHERE id = 1')
    .first<RAApiConfigSecretRow>();

  const userId = row?.user_id?.trim() ?? '';
  const apiKey = row?.api_key?.trim() ?? '';
  const djId = row?.dj_id?.trim() ?? '';
  if (!userId || !apiKey || !djId) return null;

  return {
    userId,
    apiKey,
    djId,
    option: normalizeOption(row?.option),
    year: row?.year?.trim() ?? '',
  };
}
