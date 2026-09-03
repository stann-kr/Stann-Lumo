import 'server-only';

import type { ContentLocale } from '@/capabilities/content/content';
import { fetchGalleryPhotoById } from '@/capabilities/media/mediaRepository.server';
import type { D1Database } from '@/lib/db';
import type { EventDetailData, EventsInfo, Performance } from './events';

interface PerformanceRow {
  id: string;
  date: string;
  venue: string;
  location: string | null;
  time: string | null;
  title: string;
  lineup: string | null;
  ra_event_link: string | null;
  ra_event_id: string | null;
  poster_image_id: string | null;
  status: string;
  sort_order: number;
  ra_venue_id: string | null;
  ra_country_name: string | null;
  ra_area_name: string | null;
  ra_area_id: string | null;
  ra_address: string | null;
  ra_cost: string | null;
  ra_promoter: string | null;
  ra_venue_link: string | null;
  ra_has_tickets: string | null;
  ra_has_barcode: string | null;
  ra_promoter_id: string | null;
  ra_lineup_raw: string | null;
}

interface EventsInfoRow {
  contact_email: string;
  response_time: string;
}

interface EventsListRow {
  value: string;
}

function mapPerformance(row: PerformanceRow): Performance {
  return {
    id: row.id,
    date: row.date,
    venue: row.venue,
    ...(row.location != null && { location: row.location }),
    ...(row.time != null && { time: row.time }),
    title: row.title,
    ...(row.lineup != null && { lineup: row.lineup }),
    ...(row.ra_event_link != null && { raEventLink: row.ra_event_link }),
    ...(row.ra_event_id != null && { raEventId: row.ra_event_id }),
    ...(row.poster_image_id != null && { posterImageId: row.poster_image_id }),
    status: row.status as Performance['status'],
    ...(row.ra_venue_id != null && { raVenueId: row.ra_venue_id }),
    ...(row.ra_country_name != null && { raCountryName: row.ra_country_name }),
    ...(row.ra_area_name != null && { raAreaName: row.ra_area_name }),
    ...(row.ra_area_id != null && { raAreaId: row.ra_area_id }),
    ...(row.ra_address != null && { raAddress: row.ra_address }),
    ...(row.ra_cost != null && { raCost: row.ra_cost }),
    ...(row.ra_promoter != null && { raPromoter: row.ra_promoter }),
    ...(row.ra_venue_link != null && { raVenueLink: row.ra_venue_link }),
    raHasTickets: row.ra_has_tickets === '1',
    raHasBarcode: row.ra_has_barcode === '1',
    ...(row.ra_promoter_id != null && { raPromoterId: row.ra_promoter_id }),
    ...(row.ra_lineup_raw != null && { raLineupRaw: row.ra_lineup_raw }),
  };
}

function mapPublicPerformance(row: PerformanceRow): Performance {
  return {
    id: row.id,
    date: row.date,
    venue: row.venue,
    title: row.title,
    status: row.status as Performance['status'],
    ...(row.location != null && { location: row.location }),
    ...(row.time != null && { time: row.time }),
    ...(row.lineup != null && { lineup: row.lineup }),
    ...(row.ra_event_link != null && { raEventLink: row.ra_event_link }),
    ...(row.ra_event_id != null && { raEventId: row.ra_event_id }),
    ...(row.poster_image_id != null && { posterImageId: row.poster_image_id }),
  };
}

export async function fetchPerformances(db: D1Database): Promise<Performance[]> {
  const result = await db.prepare(
    'SELECT * FROM performances ORDER BY date DESC, sort_order',
  ).all<PerformanceRow>();
  return result.results.map(mapPerformance);
}

export async function replacePerformances(db: D1Database, items: Performance[]): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM performances'),
    ...items.map((performance, index) => db.prepare(
      `INSERT INTO performances
       (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id, poster_image_id, status, sort_order, ra_venue_id, ra_country_name, ra_area_name, ra_area_id, ra_address, ra_cost, ra_promoter, ra_venue_link, ra_has_tickets, ra_has_barcode, ra_promoter_id, ra_lineup_raw)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      performance.posterImageId ?? null,
      performance.status,
      index,
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
    )),
  ]);
}

export async function fetchEventsInfo(
  db: D1Database,
  lang: ContentLocale,
): Promise<EventsInfo> {
  const [infoResult, durationsResult, requirementsResult] = await db.batch([
    db.prepare('SELECT * FROM events_info WHERE id = 1'),
    db.prepare('SELECT * FROM events_set_durations WHERE lang = ? ORDER BY sort_order').bind(lang),
    db.prepare('SELECT * FROM events_tech_requirements WHERE lang = ? ORDER BY sort_order').bind(lang),
  ]);
  const info = infoResult.results[0] as EventsInfoRow | undefined;
  return {
    setDurations: (durationsResult.results as EventsListRow[]).map((row) => row.value),
    technicalRequirements: (requirementsResult.results as EventsListRow[]).map((row) => row.value),
    contactEmail: info?.contact_email ?? '',
    responseTime: info?.response_time ?? '',
  };
}

export async function replaceEventsInfo(
  db: D1Database,
  lang: ContentLocale,
  eventsInfo: EventsInfo,
): Promise<void> {
  const insertDurations = (eventsInfo.setDurations ?? []).map((value, index) => db.prepare(
    'INSERT INTO events_set_durations (id, lang, value, sort_order) VALUES (?, ?, ?, ?)',
  ).bind(`dur-${lang}-${index}`, lang, value, index));
  const insertRequirements = (eventsInfo.technicalRequirements ?? []).map((value, index) => db.prepare(
    'INSERT INTO events_tech_requirements (id, lang, value, sort_order) VALUES (?, ?, ?, ?)',
  ).bind(`tech-${lang}-${index}`, lang, value, index));

  await db.batch([
    db.prepare(
      'UPDATE events_info SET contact_email = ?, response_time = ? WHERE id = 1',
    ).bind(eventsInfo.contactEmail, eventsInfo.responseTime),
    db.prepare('DELETE FROM events_set_durations WHERE lang = ?').bind(lang),
    db.prepare('DELETE FROM events_tech_requirements WHERE lang = ?').bind(lang),
    ...insertDurations,
    ...insertRequirements,
  ]);
}

export async function fetchEventDetail(db: D1Database, id: string): Promise<EventDetailData | null> {
  const row = await db.prepare(
    'SELECT * FROM performances WHERE id = ?',
  ).bind(id).first<PerformanceRow>();
  if (!row) return null;

  const posterPhoto = row.poster_image_id
    ? await fetchGalleryPhotoById(db, row.poster_image_id)
    : null;
  return {
    event: mapPublicPerformance(row),
    ...(posterPhoto && { posterPhoto }),
  };
}
