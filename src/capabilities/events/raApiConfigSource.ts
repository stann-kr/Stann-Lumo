import type { D1Database } from '@/lib/db';
import { normalizeRAApiOption, type RAApiOption } from './raConfig';

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
    option: normalizeRAApiOption(row?.option),
    year: row?.year?.trim() ?? '',
  };
}
