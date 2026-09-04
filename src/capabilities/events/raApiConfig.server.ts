import 'server-only';

import type { D1Database } from '@/lib/db';
import {
  normalizeRAApiOption,
  type RAApiConfigUpdate,
  type RAApiConfigView,
} from './raConfig';
export {
  getRaApiConfigSecret,
  type RAApiConfigSecret,
} from './raApiConfigSource';
export { isRAApiOption } from './raConfig';

interface RAApiConfigViewRow {
  user_id: string | null;
  dj_id: string | null;
  option: string | null;
  year: string | null;
  has_api_key: number | boolean | null;
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
    option: normalizeRAApiOption(row?.option),
    year: row?.year ?? '',
    hasApiKey: row?.has_api_key === true || row?.has_api_key === 1,
  };
}

export async function updateRaApiConfig(
  db: D1Database,
  config: RAApiConfigUpdate,
): Promise<RAApiConfigView> {
  await db.prepare(
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
  ).bind(
    config.userId ?? null,
    config.clearApiKey === true ? 1 : 0,
    config.apiKey ?? null,
    config.djId ?? null,
    config.option ?? '1',
    config.year ?? null,
  ).run();

  return getRaApiConfigView(db);
}
