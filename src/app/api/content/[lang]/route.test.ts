import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database, D1PreparedStatement, D1Result } from '@/lib/db';
import { getDB } from '@/lib/db';
import { assertPublicPayloadSafe } from '@/lib/security/publicPayload';
import { GET } from './route';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));

interface RecordedStatement extends D1PreparedStatement {
  readonly testSql: string;
  readonly testBindings: unknown[];
}

function rowsForStatement(statement: RecordedStatement): Record<string, unknown>[] {
  const { testSql: sql, testBindings: bindings } = statement;
  if (sql.includes('FROM artist_info')) {
    if (bindings[0] === 'ko') return [];
    return [{ id: 'artist-1', lang: 'en', key: 'genre', value: 'techno', sort_order: 0 }];
  }
  if (sql.includes('FROM site_config')) {
    return [{
      id: 1,
      site_name: 'STANN LUMO',
      tagline: 'TECHNO / SEOUL',
      version: '1',
      terminal_url: 'https://terminal.example.test/home',
      terminal_description: 'Live surface',
      terminal_font_size: 'md',
      terminal_animation_speed: 'normal',
      terminal_prompt_text: '>',
      terminal_show_embed: 0,
      terminal_embed_height: '400px',
    }];
  }
  if (sql.includes('FROM terminal_custom_fields')) {
    return [{
      id: 'field-1',
      field_key: 'location',
      field_value: 'Seoul',
      field_type: 'text',
      sort_order: 0,
    }];
  }
  return [];
}

function createPublicDatabase(options?: { batchError?: Error }) {
  const preparedSql: string[] = [];

  const database = {
    prepare(sql: string) {
      preparedSql.push(sql);
      let bindings: unknown[] = [];
      const statement = {
        testSql: sql,
        get testBindings() {
          return bindings;
        },
        bind(...values: unknown[]) {
          bindings = values;
          return statement;
        },
      } as unknown as RecordedStatement;
      return statement;
    },
    async batch(statements: D1PreparedStatement[]) {
      if (options?.batchError) throw options.batchError;
      return statements.map((statement) => ({
        results: rowsForStatement(statement as RecordedStatement),
        success: true,
        meta: {},
      })) as D1Result[];
    },
  } as unknown as D1Database;

  return { database, preparedSql };
}

function request(lang: string) {
  return GET(
    new NextRequest(`https://lumo.test/api/content/${lang}`),
    { params: Promise.resolve({ lang }) },
  );
}

function expectNoStore(response: Response) {
  expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
}

describe('public content route credential boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['en', 'ko'] as const)('returns safe %s content without querying RA config', async (lang) => {
    const { database, preparedSql } = createPublicDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    const response = await request(lang);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(preparedSql.some((sql) => /ra_api_config/i.test(sql))).toBe(false);
    expect(() => assertPublicPayloadSafe(payload)).not.toThrow();
    expect(payload.data.artistInfo).toContainEqual(
      expect.objectContaining({ key: 'genre', value: 'techno' }),
    );
    expect(payload.data.terminalInfo.customFields).toContainEqual(
      expect.objectContaining({ fieldKey: 'location', fieldValue: 'Seoul' }),
    );
  });

  it('returns validation errors with no-store before touching the database', async () => {
    const response = await request('jp');

    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(getDB).not.toHaveBeenCalled();
  });

  it('returns database-unavailable errors with no-store', async () => {
    vi.mocked(getDB).mockReturnValue(null);

    const response = await request('en');

    expect(response.status).toBe(503);
    expectNoStore(response);
  });

  it('does not reflect database errors or log their values', async () => {
    const sentinel = 'test-only-secret-value-never-print';
    const { database } = createPublicDatabase({ batchError: new Error(sentinel) });
    vi.mocked(getDB).mockReturnValue(database);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request('ko');
    const body = await response.text();
    const logged = errorSpy.mock.calls.flat().join(' ');

    expect(response.status).toBe(500);
    expectNoStore(response);
    expect(body).not.toContain(sentinel);
    expect(logged).not.toContain(sentinel);
    errorSpy.mockRestore();
  });
});
