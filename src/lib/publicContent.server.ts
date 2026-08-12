import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';
import { getDB, type D1Database } from '@/lib/db';
import { assertPublicPayloadSafe } from '@/lib/security/publicPayload';
import type {
  ArtistInfoItem,
  ContactItem,
  DynamicSection,
  DynamicSectionType,
  EventsInfo,
  GalleryPhoto,
  HomeSection,
  LinkPlatform,
  PageMeta,
  Performance,
  PhilosophyItem,
  TerminalCustomField,
  TerminalInfo,
  Track,
} from '@/types/content';

export type PublicLocale = 'en' | 'ko';

const LANGUAGE_COOKIE = 'stann_lumo_language';

export async function getRequestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies();
  return cookieStore.get(LANGUAGE_COOKIE)?.value === 'ko' ? 'ko' : 'en';
}

interface ArtistInfoRow {
  id: string;
  key: string;
  value: string;
}

interface AboutSectionRow {
  id: string;
  title: string;
  type: string;
  section_order: number;
}

interface AboutParagraphRow {
  section_id: string;
  content: string;
  item_order: number;
}

interface AboutPhilosophyRow {
  id: string;
  section_id: string;
  quote: string;
  description: string | null;
  item_order: number;
}

interface PageMetaRow {
  page: string;
  key: string;
  value: string;
}

interface HomeSectionRow {
  title: string;
  description: string;
  path: string;
  icon: string;
}

interface TrackRow {
  id: string;
  title: string;
  type: string;
  duration: string;
  year: string;
  platform: string;
  link: string;
}

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
}

interface EventsInfoRow {
  contact_email: string;
  response_time: string;
}

interface EventsListRow {
  value: string;
}

interface LinkPlatformRow {
  id: string;
  platform: string;
  url: string;
  icon: string;
  description: string;
}

interface ContactInfoRow {
  label: string;
  value: string;
  icon: string;
}

interface SiteConfigRow {
  terminal_url: string | null;
  terminal_description: string | null;
  terminal_font_size: string | null;
  terminal_animation_speed: string | null;
  terminal_prompt_text: string | null;
  terminal_show_embed: number | null;
  terminal_embed_height: string | null;
}

interface TerminalCustomFieldRow {
  id: string;
  field_key: string;
  field_value: string;
  field_type: string;
  sort_order: number;
}

interface GalleryPhotoRow {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  caption: string;
  sort_order: number;
  created_at: string;
  media_type: string;
  focal_x: number | null;
  focal_y: number | null;
  video_youtube_id: string | null;
  video_thumbnail_url: string | null;
  linked_event_id: string | null;
}

function getPublicDB(): D1Database {
  const db = getDB();
  if (!db) throw new Error('Public content is unavailable');
  return db;
}

async function rows<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T[]> {
  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const result = await statement.all<T>();
  return result.results;
}

async function localizedRows<T>(db: D1Database, sql: string, locale: PublicLocale): Promise<T[]> {
  const primary = await rows<T>(db, sql, locale);
  if (locale === 'ko' && primary.length === 0) return rows<T>(db, sql, 'en');
  return primary;
}

async function localizedMetaRows(db: D1Database, locale: PublicLocale): Promise<PageMetaRow[]> {
  const primary = await rows<PageMetaRow>(db, 'SELECT page, key, value FROM page_meta WHERE lang = ?', locale);
  if (locale === 'ko' && primary.length === 0) {
    return rows<PageMetaRow>(db, 'SELECT page, key, value FROM page_meta WHERE lang = ?', 'en');
  }
  return primary;
}

function mapArtistInfo(rowsToMap: ArtistInfoRow[]): ArtistInfoItem[] {
  return rowsToMap.map((row) => ({ id: row.id, key: row.key, value: row.value }));
}

function mapTracks(rowsToMap: TrackRow[]): Track[] {
  return rowsToMap.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    duration: row.duration,
    year: row.year,
    platform: row.platform,
    link: row.link,
  }));
}

function mapPerformances(rowsToMap: PerformanceRow[]): Performance[] {
  return rowsToMap.map((row) => ({
    id: row.id,
    date: row.date,
    venue: row.venue,
    ...(row.location !== null && { location: row.location }),
    ...(row.time !== null && { time: row.time }),
    title: row.title,
    ...(row.lineup !== null && { lineup: row.lineup }),
    ...(row.ra_event_link !== null && { raEventLink: row.ra_event_link }),
    ...(row.ra_event_id !== null && { raEventId: row.ra_event_id }),
    ...(row.poster_image_id !== null && { posterImageId: row.poster_image_id }),
    status: row.status as Performance['status'],
  }));
}

function mapGalleryPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    altText: row.alt_text,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    mediaType: row.media_type as GalleryPhoto['mediaType'],
    focalX: row.focal_x ?? 50,
    focalY: row.focal_y ?? 50,
    ...(row.video_youtube_id !== null && { videoYoutubeId: row.video_youtube_id }),
    ...(row.video_thumbnail_url !== null && { videoThumbnailUrl: row.video_thumbnail_url }),
    ...(row.linked_event_id !== null && { linkedEventId: row.linked_event_id }),
  };
}

function buildPageMeta(rowsToMap: PageMetaRow[]): PageMeta {
  const values = new Map(rowsToMap.map((row) => [`${row.page}:${row.key}`, row.value]));
  return {
    home: { navTitle: values.get('home:navTitle') ?? '' },
    music: {
      title: values.get('music:title') ?? '',
      subtitle: values.get('music:subtitle') ?? '',
    },
    events: {
      title: values.get('events:title') ?? '',
      subtitle: values.get('events:subtitle') ?? '',
      upcomingTitle: values.get('events:upcomingTitle') ?? '',
      pastTitle: values.get('events:pastTitle') ?? '',
    },
    contact: {
      title: values.get('contact:title') ?? '',
      subtitle: values.get('contact:subtitle') ?? '',
      guestbookTitle: values.get('contact:guestbookTitle') ?? '',
      directTitle: values.get('contact:directTitle') ?? '',
      bookingTitle: values.get('contact:bookingTitle') ?? '',
    },
    link: {
      title: values.get('link:title') ?? '',
      subtitle: values.get('link:subtitle') ?? '',
      terminalTitle: values.get('link:terminalTitle') ?? '',
    },
  };
}

function mapAboutSections(
  sectionRows: AboutSectionRow[],
  paragraphRows: AboutParagraphRow[],
  philosophyRows: AboutPhilosophyRow[],
): DynamicSection[] {
  return sectionRows.map((section) => {
    const base = {
      id: section.id,
      title: section.title,
      type: section.type as DynamicSectionType,
      order: section.section_order,
    };
    if (section.type === 'philosophy-items') {
      const items: PhilosophyItem[] = philosophyRows
        .filter((row) => row.section_id === section.id)
        .map((row) => ({ id: row.id, quote: row.quote, description: row.description ?? '' }));
      return { ...base, items };
    }
    return {
      ...base,
      paragraphs: paragraphRows.filter((row) => row.section_id === section.id).map((row) => row.content),
    };
  });
}

async function getTerminalInfo(db: D1Database): Promise<TerminalInfo> {
  const [siteConfig, fieldRows] = await Promise.all([
    db.prepare('SELECT * FROM site_config WHERE id = 1').first<SiteConfigRow>(),
    rows<TerminalCustomFieldRow>(db, 'SELECT * FROM terminal_custom_fields ORDER BY sort_order ASC'),
  ]);
  const customFields: TerminalCustomField[] = fieldRows.map((row) => ({
    id: row.id,
    fieldKey: row.field_key,
    fieldValue: row.field_value,
    fieldType: row.field_type as TerminalCustomField['fieldType'],
    sortOrder: row.sort_order,
  }));
  return {
    url: siteConfig?.terminal_url ?? '',
    description: siteConfig?.terminal_description ?? '',
    customFields,
    style: {
      fontSize: (siteConfig?.terminal_font_size as 'sm' | 'md' | 'lg') ?? 'md',
      animationSpeed: (siteConfig?.terminal_animation_speed as 'slow' | 'normal' | 'fast') ?? 'normal',
      promptText: siteConfig?.terminal_prompt_text ?? '>',
      showEmbed: (siteConfig?.terminal_show_embed ?? 0) === 1,
      embedHeight: siteConfig?.terminal_embed_height ?? '400px',
    },
  };
}

export interface PublicShellProjection {
  artistName: string;
  sceneTracks: Track[];
}

export const getPublicShellProjection = cache(async (locale: PublicLocale): Promise<PublicShellProjection> => {
  const db = getPublicDB();

  const [artistRows, trackRows] = await Promise.all([
    localizedRows<ArtistInfoRow>(db, 'SELECT id, key, value FROM artist_info WHERE lang = ? ORDER BY sort_order', locale),
    localizedRows<TrackRow>(db, 'SELECT id, title, type, duration, year, platform, link FROM tracks WHERE lang = ? ORDER BY sort_order LIMIT 20', locale),
  ]);
  const artistName = artistRows.find((row) => row.key === 'Name' || row.key === '이름')?.value ?? 'STANN LUMO';
  const projection = { artistName, sceneTracks: mapTracks(trackRows) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface HomeProjection {
  artistInfo: ArtistInfoItem[];
  pageMeta: Pick<PageMeta, 'home'>;
  homeSections: HomeSection[];
  terminalInfo: TerminalInfo;
}

export const getHomeProjection = cache(async (locale: PublicLocale): Promise<HomeProjection> => {
  const db = getPublicDB();

  const [artistRows, metaRows, homeRows, terminalInfo] = await Promise.all([
    localizedRows<ArtistInfoRow>(db, 'SELECT id, key, value FROM artist_info WHERE lang = ? ORDER BY sort_order', locale),
    localizedMetaRows(db, locale),
    localizedRows<HomeSectionRow>(db, 'SELECT title, description, path, icon FROM home_sections WHERE lang = ? ORDER BY sort_order', locale),
    getTerminalInfo(db),
  ]);
  const projection = {
    artistInfo: mapArtistInfo(artistRows),
    pageMeta: { home: buildPageMeta(metaRows).home },
    homeSections: homeRows,
    terminalInfo,
  };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface AboutProjection {
  artistInfo: ArtistInfoItem[];
  aboutSections: DynamicSection[];
}

export const getAboutProjection = cache(async (locale: PublicLocale): Promise<AboutProjection> => {
  const db = getPublicDB();
  const [artistRows, sections, paragraphs, philosophy] = await Promise.all([
    localizedRows<ArtistInfoRow>(db, 'SELECT id, key, value FROM artist_info WHERE lang = ? ORDER BY sort_order', locale),
    localizedRows<AboutSectionRow>(db, 'SELECT id, title, type, section_order FROM about_sections WHERE lang = ? ORDER BY section_order', locale),
    localizedRows<AboutParagraphRow>(db, 'SELECT section_id, content, item_order FROM about_section_paragraphs WHERE lang = ? ORDER BY item_order', locale),
    localizedRows<AboutPhilosophyRow>(db, 'SELECT id, section_id, quote, description, item_order FROM about_section_philosophy_items WHERE lang = ? ORDER BY item_order', locale),
  ]);
  const projection = { artistInfo: mapArtistInfo(artistRows), aboutSections: mapAboutSections(sections, paragraphs, philosophy) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface MusicProjection {
  pageMeta: Pick<PageMeta, 'music'>;
  tracks: Track[];
}

export const getMusicProjection = cache(async (locale: PublicLocale): Promise<MusicProjection> => {
  const db = getPublicDB();
  const [metaRows, trackRows] = await Promise.all([
    localizedMetaRows(db, locale),
    localizedRows<TrackRow>(db, 'SELECT id, title, type, duration, year, platform, link FROM tracks WHERE lang = ? ORDER BY sort_order', locale),
  ]);
  const projection = { pageMeta: { music: buildPageMeta(metaRows).music }, tracks: mapTracks(trackRows) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface EventsProjection {
  pageMeta: Pick<PageMeta, 'events'>;
  performances: Performance[];
}

export const getEventsProjection = cache(async (locale: PublicLocale): Promise<EventsProjection> => {
  const db = getPublicDB();
  const [metaRows, performanceRows] = await Promise.all([
    localizedMetaRows(db, locale),
    rows<PerformanceRow>(db, 'SELECT * FROM performances ORDER BY date DESC, sort_order'),
  ]);
  const projection = { pageMeta: { events: buildPageMeta(metaRows).events }, performances: mapPerformances(performanceRows) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface ContactProjection {
  pageMeta: Pick<PageMeta, 'contact'>;
  contactInfo: ContactItem[];
  eventsInfo: EventsInfo;
}

export const getContactProjection = cache(async (locale: PublicLocale): Promise<ContactProjection> => {
  const db = getPublicDB();
  const [metaRows, contactRows, eventInfoRow, durations, requirements] = await Promise.all([
    localizedMetaRows(db, locale),
    localizedRows<ContactInfoRow>(db, 'SELECT label, value, icon FROM contact_info WHERE lang = ? ORDER BY sort_order', locale),
    db.prepare('SELECT contact_email, response_time FROM events_info WHERE id = 1').first<EventsInfoRow>(),
    localizedRows<EventsListRow>(db, 'SELECT value FROM events_set_durations WHERE lang = ? ORDER BY sort_order', locale),
    localizedRows<EventsListRow>(db, 'SELECT value FROM events_tech_requirements WHERE lang = ? ORDER BY sort_order', locale),
  ]);
  const projection = {
    pageMeta: { contact: buildPageMeta(metaRows).contact },
    contactInfo: contactRows,
    eventsInfo: {
      setDurations: durations.map((row) => row.value),
      technicalRequirements: requirements.map((row) => row.value),
      contactEmail: eventInfoRow?.contact_email ?? '',
      responseTime: eventInfoRow?.response_time ?? '',
    },
  };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface LinkProjection {
  pageMeta: Pick<PageMeta, 'link'>;
  linkPlatforms: LinkPlatform[];
  terminalInfo: TerminalInfo;
}

export const getLinkProjection = cache(async (locale: PublicLocale): Promise<LinkProjection> => {
  const db = getPublicDB();
  const [metaRows, platformRows, terminalInfo] = await Promise.all([
    localizedMetaRows(db, locale),
    localizedRows<LinkPlatformRow>(db, 'SELECT id, platform, url, icon, description FROM link_platforms WHERE lang = ? ORDER BY sort_order', locale),
    getTerminalInfo(db),
  ]);
  const projection = { pageMeta: { link: buildPageMeta(metaRows).link }, linkPlatforms: platformRows, terminalInfo };
  assertPublicPayloadSafe(projection);
  return projection;
});

export const getArchivePhotos = cache(async (): Promise<GalleryPhoto[]> => {
  const db = getPublicDB();
  const photoRows = await rows<GalleryPhotoRow>(db, 'SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at DESC');
  const photos = photoRows.map(mapGalleryPhoto);
  assertPublicPayloadSafe(photos);
  return photos;
});

export const getEventDetail = cache(async (id: string): Promise<{ event: Performance; posterPhoto?: GalleryPhoto } | null> => {
  const db = getPublicDB();
  const eventRow = await db.prepare('SELECT * FROM performances WHERE id = ?').bind(id).first<PerformanceRow>();
  if (!eventRow) return null;
  const event = mapPerformances([eventRow])[0];
  const posterPhoto = eventRow.poster_image_id
    ? await db.prepare('SELECT * FROM gallery_photos WHERE id = ?').bind(eventRow.poster_image_id).first<GalleryPhotoRow>()
    : null;
  const projection = { event, ...(posterPhoto && { posterPhoto: mapGalleryPhoto(posterPhoto) }) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export const getArchiveDetail = cache(async (id: string): Promise<{ photo: GalleryPhoto; previous: GalleryPhoto | null; next: GalleryPhoto | null } | null> => {
  const photos = await getArchivePhotos();
  const index = photos.findIndex((photo) => photo.id === id);
  if (index === -1) return null;
  const projection = {
    photo: photos[index],
    previous: photos[index - 1] ?? null,
    next: photos[index + 1] ?? null,
  };
  assertPublicPayloadSafe(projection);
  return projection;
});
