import 'server-only';

import type {
  ContentData,
  DynamicSection,
  MultiLanguageContent,
} from '@/capabilities/content/content';
import type { D1Database, D1PreparedStatement } from '@/lib/db';

const LANGUAGES = ['en', 'ko'] as const;

export async function importLegacyContent(
  db: D1Database,
  content: MultiLanguageContent,
): Promise<number> {
  const statements: D1PreparedStatement[] = [];
  const localizedTables = [
    'artist_info',
    'about_sections',
    'about_section_paragraphs',
    'about_section_philosophy_items',
    'page_meta',
    'home_sections',
    'tracks',
    'events_set_durations',
    'events_tech_requirements',
    'link_platforms',
    'contact_info',
  ];
  for (const table of localizedTables) statements.push(db.prepare(`DELETE FROM ${table}`));
  statements.push(db.prepare('DELETE FROM performances'));

  for (const language of LANGUAGES) {
    const data: ContentData = content[language];

    (data.artistInfo ?? []).forEach((item, index) => {
      statements.push(db.prepare(
        'INSERT INTO artist_info (id, lang, key, value, sort_order) VALUES (?,?,?,?,?)',
      ).bind(item.id, language, item.key, item.value, index));
    });

    const sections: DynamicSection[] = [...(data.aboutSections ?? [])]
      .sort((left, right) => left.order - right.order);
    sections.forEach((section, index) => {
      statements.push(db.prepare(
        'INSERT INTO about_sections (id, lang, title, type, section_order) VALUES (?,?,?,?,?)',
      ).bind(section.id, language, section.title, section.type, index));

      if (section.type === 'paragraphs') {
        (section.paragraphs ?? []).forEach((paragraph, paragraphIndex) => {
          statements.push(db.prepare(
            'INSERT INTO about_section_paragraphs (id, section_id, lang, content, item_order) VALUES (?,?,?,?,?)',
          ).bind(
            `${section.id}-p-${paragraphIndex}`,
            section.id,
            language,
            paragraph,
            paragraphIndex,
          ));
        });
      } else {
        (section.items ?? []).forEach((item, itemIndex) => {
          statements.push(db.prepare(
            'INSERT INTO about_section_philosophy_items (id, section_id, lang, quote, description, item_order) VALUES (?,?,?,?,?,?)',
          ).bind(
            item.id,
            section.id,
            language,
            item.quote,
            item.description ?? '',
            itemIndex,
          ));
        });
      }
    });

    const pageMeta = data.pageMeta;
    if (pageMeta) {
      const metadataRows: Array<[string, string, string]> = [
        ['home', 'navTitle', pageMeta.home?.navTitle ?? ''],
        ['music', 'title', pageMeta.music?.title ?? ''],
        ['music', 'subtitle', pageMeta.music?.subtitle ?? ''],
        ['events', 'title', pageMeta.events?.title ?? ''],
        ['events', 'subtitle', pageMeta.events?.subtitle ?? ''],
        ['events', 'upcomingTitle', pageMeta.events?.upcomingTitle ?? ''],
        ['events', 'pastTitle', pageMeta.events?.pastTitle ?? ''],
        ['contact', 'title', pageMeta.contact?.title ?? ''],
        ['contact', 'subtitle', pageMeta.contact?.subtitle ?? ''],
        ['contact', 'guestbookTitle', pageMeta.contact?.guestbookTitle ?? ''],
        ['contact', 'directTitle', pageMeta.contact?.directTitle ?? ''],
        ['contact', 'bookingTitle', pageMeta.contact?.bookingTitle ?? ''],
        ['link', 'title', pageMeta.link?.title ?? ''],
        ['link', 'subtitle', pageMeta.link?.subtitle ?? ''],
        ['link', 'terminalTitle', pageMeta.link?.terminalTitle ?? ''],
      ];
      metadataRows.forEach(([page, key, value]) => {
        statements.push(db.prepare(
          'INSERT INTO page_meta (page, lang, key, value) VALUES (?,?,?,?)',
        ).bind(page, language, key, value));
      });
    }

    (data.homeSections ?? []).forEach((section, index) => {
      statements.push(db.prepare(
        'INSERT INTO home_sections (id, lang, title, description, path, icon, sort_order) VALUES (?,?,?,?,?,?,?)',
      ).bind(
        String(index + 1),
        language,
        section.title,
        section.description,
        section.path,
        section.icon,
        index,
      ));
    });

    (data.tracks ?? []).forEach((track, index) => {
      statements.push(db.prepare(
        'INSERT INTO tracks (id, lang, title, type, duration, year, platform, link, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      ).bind(
        track.id,
        language,
        track.title,
        track.type,
        track.duration,
        track.year,
        track.platform,
        track.link,
        index,
      ));
    });

    (data.eventsInfo?.setDurations ?? []).forEach((value, index) => {
      statements.push(db.prepare(
        'INSERT INTO events_set_durations (id, lang, value, sort_order) VALUES (?,?,?,?)',
      ).bind(`dur-${language}-${index}`, language, value, index));
    });

    (data.eventsInfo?.technicalRequirements ?? []).forEach((value, index) => {
      statements.push(db.prepare(
        'INSERT INTO events_tech_requirements (id, lang, value, sort_order) VALUES (?,?,?,?)',
      ).bind(`tech-${language}-${index}`, language, value, index));
    });

    (data.linkPlatforms ?? []).forEach((platform, index) => {
      statements.push(db.prepare(
        'INSERT INTO link_platforms (id, lang, platform, url, icon, description, sort_order) VALUES (?,?,?,?,?,?,?)',
      ).bind(
        platform.id,
        language,
        platform.platform,
        platform.url,
        platform.icon,
        platform.description,
        index,
      ));
    });

    (data.contactInfo ?? []).forEach((contact, index) => {
      statements.push(db.prepare(
        'INSERT INTO contact_info (id, lang, label, value, icon, sort_order) VALUES (?,?,?,?,?,?)',
      ).bind(
        String(index + 1),
        language,
        contact.label,
        contact.value,
        contact.icon,
        index,
      ));
    });
  }

  const englishContent = content.en;
  (englishContent.performances ?? []).forEach((performance, index) => {
    statements.push(db.prepare(
      `INSERT INTO performances
       (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id, status, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
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
      index,
    ));
  });

  if (englishContent.eventsInfo) {
    statements.push(db.prepare(
      'UPDATE events_info SET contact_email=?, response_time=? WHERE id=1',
    ).bind(englishContent.eventsInfo.contactEmail, englishContent.eventsInfo.responseTime));
  }

  if (englishContent.themeColors) {
    statements.push(db.prepare(
      `UPDATE theme_colors
       SET "primary"=?, secondary=?, accent=?, muted=?, bg=?, bg_sidebar=?
       WHERE id=1`,
    ).bind(
      englishContent.themeColors.primary,
      englishContent.themeColors.secondary,
      englishContent.themeColors.accent,
      englishContent.themeColors.muted,
      englishContent.themeColors.bg,
      englishContent.themeColors.bgSidebar,
    ));
  }

  if (englishContent.terminalInfo) {
    statements.push(db.prepare(
      'UPDATE site_config SET terminal_url=?, terminal_description=? WHERE id=1',
    ).bind(
      englishContent.terminalInfo.url || null,
      englishContent.terminalInfo.description || null,
    ));
  }

  const batchSize = 90;
  for (let index = 0; index < statements.length; index += batchSize) {
    await db.batch(statements.slice(index, index + batchSize));
  }
  return statements.length;
}
