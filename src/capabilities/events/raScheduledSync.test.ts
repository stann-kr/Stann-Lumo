import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '@/lib/db';
import {
  parseRaEventsXml,
  shouldRunBiweeklyRaSync,
  syncRaEvents,
} from './raScheduledSync';

const mocks = vi.hoisted(() => ({
  getRaApiConfigSecret: vi.fn(),
  fetchRaEventsXmlFromSource: vi.fn(),
}));

vi.mock('./raApiConfigSource', () => ({
  getRaApiConfigSecret: mocks.getRaApiConfigSecret,
}));
vi.mock('./raEventsSource', () => ({
  fetchRaEventsXmlFromSource: mocks.fetchRaEventsXmlFromSource,
}));

interface StatementRecord {
  sql: string;
  bindings: unknown[];
}

function createDatabase(changes = 1) {
  const statements: StatementRecord[] = [];
  const database = {
    prepare(sql: string) {
      const record: StatementRecord = { sql, bindings: [] };
      statements.push(record);
      const statement = {
        bind(...values: unknown[]) {
          record.bindings = values;
          return statement;
        },
      };
      return statement as D1PreparedStatement;
    },
    batch: vi.fn(async (batchStatements: D1PreparedStatement[]) =>
      batchStatements.map(() => ({
        results: [],
        success: true,
        meta: { changes },
      }) as D1Result)),
  } as unknown as D1Database;

  return { database, statements, batch: vi.mocked(database.batch) };
}

const secretConfig = {
  userId: 'user-fixture',
  apiKey: 'test-only-secret-never-return',
  djId: 'dj-fixture',
  option: '2' as const,
  year: '2026',
};

describe('scheduled RA sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRaApiConfigSecret.mockResolvedValue(secretConfig);
  });

  it('runs on the anchored week and then every fourteen days', () => {
    const anchor = Date.UTC(2026, 8, 6, 19, 15);
    const week = 7 * 24 * 60 * 60 * 1000;

    expect(shouldRunBiweeklyRaSync(anchor - week)).toBe(false);
    expect(shouldRunBiweeklyRaSync(anchor)).toBe(true);
    expect(shouldRunBiweeklyRaSync(anchor + week)).toBe(false);
    expect(shouldRunBiweeklyRaSync(anchor + 2 * week)).toBe(true);
  });

  it('parses namespaced event XML without exposing parser diagnostics', () => {
    const xml = `<?xml version="1.0"?>
      <ra:events xmlns:ra="https://www.residentadvisor.net/">
        <ra:event><ra:id>42</ra:id><ra:title>Fixture</ra:title></ra:event>
      </ra:events>`;

    expect(parseRaEventsXml(xml)).toMatchObject([{ id: '42', title: 'Fixture' }]);
    expect(() => parseRaEventsXml('<events><event><id>secret-fixture</events>')).toThrow(
      'Invalid RA events XML',
    );
  });

  it('inserts each RA event once without replacing existing rows or posters', async () => {
    mocks.fetchRaEventsXmlFromSource.mockResolvedValue({
      kind: 'success',
      xml: `<events>
        <event>
          <id>42</id><venueid>7</venueid><title>Night Shift</title>
          <eventdate>2026-09-20T00:00:00</eventdate><countryname>South Korea</countryname>
          <areaname>Seoul</areaname><areaId>13</areaId><venue>Fixture Club</venue>
          <address>Test-ro</address><lineup><![CDATA[<artist id="1">Lumo</artist>, Guest&nbsp;Name]]></lineup>
          <time>23:30 - 06:00</time><cost>20,000 KRW</cost><promoter>Fixture</promoter>
          <eventlink>https://ra.example/events/42</eventlink><venuelink>https://ra.example/clubs/7</venuelink>
          <hastickets>1</hastickets><hasbarcode>0</hasbarcode><promoterId>9</promoterId>
        </event>
        <event><id>42</id><title>Duplicate</title><eventdate>2026-09-20</eventdate><venue>Other</venue></event>
      </events>`,
    });
    const { database, statements, batch } = createDatabase();

    await expect(syncRaEvents(database)).resolves.toEqual({
      kind: 'success',
      fetched: 1,
      inserted: 1,
    });

    expect(batch).toHaveBeenCalledOnce();
    expect(statements).toHaveLength(1);
    expect(statements[0]?.sql).toContain('INSERT OR IGNORE INTO performances');
    expect(statements[0]?.sql).not.toMatch(/DELETE|UPDATE/);
    expect(statements[0]?.bindings).toEqual([
      'ra-42',
      '2026-09-20',
      'Fixture Club',
      'Seoul',
      '23:30',
      'Night Shift',
      'Lumo, Guest Name',
      'https://ra.example/events/42',
      '42',
      'Announced',
      0,
      '7',
      'South Korea',
      'Seoul',
      '13',
      'Test-ro',
      '20,000 KRW',
      'Fixture',
      'https://ra.example/clubs/7',
      '1',
      '0',
      '9',
      '<artist id="1">Lumo</artist>, Guest&nbsp;Name',
    ]);
  });

  it('does no upstream or D1 write when the RA configuration is missing', async () => {
    mocks.getRaApiConfigSecret.mockResolvedValue(null);
    const { database, batch } = createDatabase();

    await expect(syncRaEvents(database)).resolves.toEqual({ kind: 'not-configured' });
    expect(mocks.fetchRaEventsXmlFromSource).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });
});
