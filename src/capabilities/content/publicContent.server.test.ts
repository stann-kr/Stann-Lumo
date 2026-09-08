import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database, D1PreparedStatement } from '@/lib/db';
import { getDB } from '@/lib/db';
import { assertPublicPayloadSafe } from '@/lib/security/publicPayload';
import { getArchiveDetail, getArchivePhotos, getHomeProjection, getMusicProjection, getPublicShellProjection } from './publicContent.server';
import { createSqliteD1 } from '@/test/sqliteD1';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));

interface RecordedStatement extends D1PreparedStatement {
  readonly sql: string;
  readonly bindings: unknown[];
}

function createPublicDatabase() {
  const prepared: RecordedStatement[] = [];
  const database = {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      const statement = {
        sql,
        get bindings() { return bindings; },
        bind(...values: unknown[]) { bindings = values; return statement; },
        async all() {
          if (sql.includes('FROM artist_info')) return { results: [{ id: 'artist-1', key: 'Name', value: 'STANN LUMO' }], success: true, meta: {} };
          if (sql.includes('FROM page_meta')) return { results: [{ page: 'home', key: 'navTitle', value: 'ARCHIVE INDEX' }], success: true, meta: {} };
          if (sql.includes('FROM home_sections')) return { results: [{ title: 'MUSIC', description: 'Releases', path: '/music', icon: 'ri-music-2-line' }], success: true, meta: {} };
          if (sql.includes('FROM terminal_custom_fields')) return { results: [], success: true, meta: {} };
          if (sql.includes('FROM gallery_photos')) return { results: [], success: true, meta: {} };
          return { results: [], success: true, meta: {} };
        },
        async first() {
          if (sql.includes('FROM site_config')) return { terminal_url: 'https://terminal.example.test', terminal_description: 'Live surface', terminal_font_size: 'md', terminal_animation_speed: 'normal', terminal_prompt_text: '>', terminal_show_embed: 0, terminal_embed_height: '400px' };
          return null;
        },
      } as unknown as RecordedStatement;
      prepared.push(statement);
      return statement;
    },
  } as unknown as D1Database;
  return { database, prepared };
}

describe('public server content projections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a single requested locale projection and never queries administrator credentials', async () => {
    const { database, prepared } = createPublicDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    const projection = await getHomeProjection('ko');
    const shell = await getPublicShellProjection('ko');
    expect(shell).toEqual({ artistName: 'STANN LUMO' });

    expect(projection.artistInfo).toContainEqual(expect.objectContaining({ value: 'STANN LUMO' }));
    expect(projection.homeSections).toHaveLength(1);
    expect(projection.terminalInfo.url).toBe('https://terminal.example.test');
    expect(prepared.some((statement) => /ra_api_config|admin_password|token/i.test(statement.sql))).toBe(false);
    expect(prepared.filter((statement) => statement.sql.includes('lang = ?')).every((statement) => statement.bindings[0] === 'ko')).toBe(true);
    expect(() => assertPublicPayloadSafe(projection)).not.toThrow();
  });

  it('returns null for a missing archive id without exposing a client fetch fallback', async () => {
    const { database, prepared } = createPublicDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    await expect(getArchiveDetail('missing-item')).resolves.toBeNull();
    expect(prepared.some((statement) => /ra_api_config|admin_password|token/i.test(statement.sql))).toBe(false);
  });

  it('fails into the public route error boundary when the public database is unavailable', async () => {
    vi.mocked(getDB).mockReturnValue(null);

    await expect(getMusicProjection('en')).rejects.toThrow('Public content is unavailable');
  });

  it('projects the linked event date without dropping unlinked archive media', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      sqlite.exec(`
        INSERT INTO performances (id, date, venue, title) VALUES ('event', '2021-04-10', 'Venue', 'Event');
        INSERT INTO gallery_photos (id, filename, linked_event_id) VALUES ('flyer', 'flyer.jpg', 'event');
        INSERT INTO gallery_photos (id, filename) VALUES ('photo', 'photo.jpg');
      `);
      const result = await getArchivePhotos();
      expect(result).toHaveLength(2);
      expect(result.find(photo => photo.id === 'flyer')).toMatchObject({ eventDate: '2021-04-10', linkedEventId: 'event' });
      expect(result.find(photo => photo.id === 'photo')).not.toHaveProperty('eventDate');
      expect(() => assertPublicPayloadSafe(result)).not.toThrow();
    } finally {
      close();
    }
  });
});
