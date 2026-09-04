import 'server-only';

import type { D1Database } from '@/lib/db';
import { getRaApiConfigSecret } from './raApiConfig.server';
import { fetchRaEventsXmlFromSource } from './raEventsSource';
import type { RAApiOption } from './raConfig';

export type RaEventsResult =
  | { kind: 'success'; xml: string }
  | { kind: 'not-configured' }
  | { kind: 'upstream-error'; status: number }
  | { kind: 'unsafe-response' };

export async function fetchRaEventsXml(
  db: D1Database,
  requestedOption: RAApiOption | null,
  requestedYear: string | null,
): Promise<RaEventsResult> {
  const config = await getRaApiConfigSecret(db);
  if (!config) return { kind: 'not-configured' };
  return fetchRaEventsXmlFromSource(config, requestedOption, requestedYear);
}
