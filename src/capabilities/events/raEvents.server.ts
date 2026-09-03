import 'server-only';

import type { D1Database } from '@/lib/db';
import { getRaApiConfigSecret } from './raApiConfig.server';
import type { RAApiOption } from './raConfig';

function escapeXmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function containsCredentialReflection(body: string, credential: string): boolean {
  const formEncoded = new URLSearchParams({ credential }).toString().slice('credential='.length);
  const variants = new Set([
    credential,
    escapeXmlText(credential),
    encodeURIComponent(credential),
    formEncoded,
  ]);

  return [...variants].some((variant) => variant.length > 0 && body.includes(variant));
}

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

  const option = requestedOption ?? config.option;
  let year = requestedYear !== null ? requestedYear : config.year;
  if (!year && option === '4') year = new Date().getFullYear().toString();

  const params = new URLSearchParams({
    AccessKey: config.apiKey,
    UserID: config.userId,
    DJID: config.djId,
    Option: option,
    VenueID: '',
    CountryID: '',
    AreaID: '',
    PromoterID: '',
    Year: year || '',
  });
  const response = await fetch(
    `https://www.residentadvisor.net/api/events.asmx/GetEvents?${params.toString()}`,
    { headers: { Accept: 'application/xml, text/xml' } },
  );
  if (!response.ok) return { kind: 'upstream-error', status: response.status };

  const xml = await response.text();
  if (containsCredentialReflection(xml, config.apiKey)) return { kind: 'unsafe-response' };
  return { kind: 'success', xml };
}
