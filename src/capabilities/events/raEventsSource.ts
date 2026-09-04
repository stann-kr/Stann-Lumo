import type { RAApiConfigSecret } from './raApiConfigSource';
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

export type RaEventsUpstreamResult =
  | { kind: 'success'; xml: string }
  | { kind: 'upstream-error'; status: number }
  | { kind: 'transport-error' }
  | { kind: 'unsafe-response' };

export async function fetchRaEventsXmlFromSource(
  config: RAApiConfigSecret,
  requestedOption: RAApiOption | null,
  requestedYear: string | null,
): Promise<RaEventsUpstreamResult> {
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
  try {
    const response = await fetch(
      `https://www.residentadvisor.net/api/events.asmx/GetEvents?${params.toString()}`,
      { headers: { Accept: 'application/xml, text/xml' } },
    );
    if (!response.ok) return { kind: 'upstream-error', status: response.status };

    const xml = await response.text();
    if (containsCredentialReflection(xml, config.apiKey)) return { kind: 'unsafe-response' };
    return { kind: 'success', xml };
  } catch {
    return { kind: 'transport-error' };
  }
}
