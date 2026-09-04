import { decodeHTML } from 'entities';
import { SaxesParser } from 'saxes';
import type { D1Database, D1Result } from '@/lib/db';
import type { Performance } from './events';
import { getRaApiConfigSecret } from './raApiConfigSource';
import type { RAEventXML } from './raApi.types';
import { fetchRaEventsXmlFromSource } from './raEventsSource';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BIWEEKLY_ANCHOR_UTC = Date.UTC(2026, 8, 6, 19, 15);

const FIELD_BY_XML_NAME: Readonly<Record<string, keyof RAEventXML>> = {
  id: 'id',
  venueid: 'venueid',
  title: 'title',
  eventdate: 'eventdate',
  countryname: 'countryname',
  areaname: 'areaname',
  areaid: 'areaId',
  venue: 'venue',
  address: 'address',
  lineup: 'lineup',
  time: 'time',
  cost: 'cost',
  promoter: 'promoter',
  eventlink: 'eventlink',
  venuelink: 'venuelink',
  hastickets: 'hastickets',
  hasbarcode: 'hasbarcode',
  promoterid: 'promoterId',
};

function emptyRaEvent(): RAEventXML {
  return {
    id: '',
    venueid: '',
    title: '',
    eventdate: '',
    countryname: '',
    areaname: '',
    areaId: '',
    venue: '',
    address: '',
    lineup: '',
    time: '',
    cost: '',
    promoter: '',
    eventlink: '',
    venuelink: '',
    hastickets: '',
    hasbarcode: '',
    promoterId: '',
  };
}

export function shouldRunBiweeklyRaSync(scheduledTime: number): boolean {
  const elapsedWeeks = Math.floor((scheduledTime - BIWEEKLY_ANCHOR_UTC) / WEEK_MS);
  return elapsedWeeks >= 0 && elapsedWeeks % 2 === 0;
}

export function parseRaEventsXml(xml: string): RAEventXML[] {
  const events: RAEventXML[] = [];
  let currentEvent: RAEventXML | null = null;
  let currentField: keyof RAEventXML | null = null;
  const parser = new SaxesParser({ xmlns: true });

  const appendText = (text: string) => {
    if (currentEvent && currentField) {
      currentEvent[currentField] = `${currentEvent[currentField] ?? ''}${text}`;
    }
  };

  parser.on('opentag', (tag) => {
    const name = tag.local.toLowerCase();
    if (name === 'event') {
      currentEvent = emptyRaEvent();
      currentField = null;
      return;
    }
    if (!currentEvent || currentField) return;
    currentField = FIELD_BY_XML_NAME[name] ?? null;
  });
  parser.on('text', appendText);
  parser.on('cdata', appendText);
  parser.on('closetag', (tag) => {
    const name = tag.local.toLowerCase();
    if (name === 'event') {
      if (currentEvent) {
        for (const field of Object.values(FIELD_BY_XML_NAME)) {
          const value = currentEvent[field];
          if (typeof value === 'string') currentEvent[field] = value.trim();
        }
        if (currentEvent.id) events.push(currentEvent);
      }
      currentEvent = null;
      currentField = null;
      return;
    }
    if (currentField === FIELD_BY_XML_NAME[name]) currentField = null;
  });

  try {
    parser.write(xml).close();
  } catch {
    throw new Error('Invalid RA events XML');
  }
  return events;
}

function formatRaDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match?.[0] ?? '';
}

function cleanRaLineup(value: string): string {
  return decodeHTML(value)
    .replace(/<artist[^>]*>([^<]+)<\/artist>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function convertRaEvent(event: RAEventXML): Performance {
  const time = event.time.match(/\d{2}:\d{2}/)?.[0];
  return {
    id: `ra-${event.id}`,
    date: formatRaDate(event.eventdate),
    venue: event.venue || 'TBA',
    title: event.title || event.venue || 'TBA',
    ...(event.areaname || event.countryname
      ? { location: event.areaname || event.countryname }
      : {}),
    ...(time ? { time } : {}),
    ...(event.lineup ? { lineup: cleanRaLineup(event.lineup) } : {}),
    ...(event.eventlink ? { raEventLink: event.eventlink } : {}),
    raEventId: event.id,
    status: 'Announced',
    ...(event.venueid ? { raVenueId: event.venueid } : {}),
    ...(event.countryname ? { raCountryName: event.countryname } : {}),
    ...(event.areaname ? { raAreaName: event.areaname } : {}),
    ...(event.areaId ? { raAreaId: event.areaId } : {}),
    ...(event.address ? { raAddress: event.address } : {}),
    ...(event.cost ? { raCost: event.cost } : {}),
    ...(event.promoter ? { raPromoter: event.promoter } : {}),
    ...(event.venuelink ? { raVenueLink: event.venuelink } : {}),
    raHasTickets: event.hastickets === '1',
    raHasBarcode: event.hasbarcode === '1',
    ...(event.promoterId ? { raPromoterId: event.promoterId } : {}),
    ...(event.lineup ? { raLineupRaw: event.lineup } : {}),
  };
}

function insertRaPerformance(db: D1Database, performance: Performance, sortOrder: number) {
  return db.prepare(
    `INSERT OR IGNORE INTO performances
      (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id,
       poster_image_id, status, sort_order, ra_venue_id, ra_country_name, ra_area_name,
       ra_area_id, ra_address, ra_cost, ra_promoter, ra_venue_link, ra_has_tickets,
       ra_has_barcode, ra_promoter_id, ra_lineup_raw)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    performance.id,
    performance.date,
    performance.venue,
    performance.location ?? null,
    performance.time ?? null,
    performance.title,
    performance.lineup ?? null,
    performance.raEventLink ?? null,
    performance.raEventId ?? null,
    performance.status,
    sortOrder,
    performance.raVenueId ?? null,
    performance.raCountryName ?? null,
    performance.raAreaName ?? null,
    performance.raAreaId ?? null,
    performance.raAddress ?? null,
    performance.raCost ?? null,
    performance.raPromoter ?? null,
    performance.raVenueLink ?? null,
    performance.raHasTickets ? '1' : '0',
    performance.raHasBarcode ? '1' : '0',
    performance.raPromoterId ?? null,
    performance.raLineupRaw ?? null,
  );
}

function countChanges(results: D1Result[]): number {
  return results.reduce((total, result) => {
    if (!result.success) throw new Error('RA event insert failed');
    const changes = result.meta.changes;
    return total + (typeof changes === 'number' ? changes : 0);
  }, 0);
}

export type RaScheduledSyncResult =
  | { kind: 'not-configured' }
  | { kind: 'success'; fetched: number; inserted: number };

export async function syncRaEvents(db: D1Database): Promise<RaScheduledSyncResult> {
  const config = await getRaApiConfigSecret(db);
  if (!config) return { kind: 'not-configured' };

  const upstream = await fetchRaEventsXmlFromSource(config, null, null);
  if (upstream.kind === 'upstream-error') {
    throw new Error(`RA upstream returned ${upstream.status}`);
  }
  if (upstream.kind !== 'success') {
    throw new Error('RA upstream response unavailable');
  }

  const uniquePerformances = new Map<string, Performance>();
  for (const event of parseRaEventsXml(upstream.xml)) {
    if (!uniquePerformances.has(event.id)) {
      uniquePerformances.set(event.id, convertRaEvent(event));
    }
  }
  const performances = [...uniquePerformances.values()];
  if (performances.length === 0) return { kind: 'success', fetched: 0, inserted: 0 };

  const results = await db.batch(
    performances.map((performance, index) => insertRaPerformance(db, performance, index)),
  );
  return {
    kind: 'success',
    fetched: performances.length,
    inserted: countChanges(results),
  };
}
