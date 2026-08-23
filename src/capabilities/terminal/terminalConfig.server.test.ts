import { describe, expect, it, vi } from 'vitest';
import type { D1Database, D1PreparedStatement, D1Result } from '@/lib/db';
import { fetchTerminalConfig, updateTerminalConfig } from './terminalConfig.server';
import type { TerminalConfigData } from './terminalConfig';

interface StatementRecord {
  sql: string;
  bindings: unknown[];
}

function createDatabase(results: D1Result[] = []) {
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
    batch: vi.fn().mockResolvedValue(results),
  } as unknown as D1Database;

  return { database, statements };
}

describe('terminal config server capability', () => {
  it('maps the existing D1 rows and preserves style fallbacks', async () => {
    const { database, statements } = createDatabase([
      {
        results: [{
          terminal_url: 'https://terminal.example',
          terminal_description: null,
          terminal_font_size: null,
          terminal_animation_speed: 'fast',
          terminal_prompt_text: null,
          terminal_show_embed: 1,
          terminal_embed_height: null,
        }],
        success: true,
        meta: {},
      },
      {
        results: [{
          id: 'field-1',
          field_key: 'status',
          field_value: 'online',
          field_type: 'badge',
          sort_order: 3,
        }],
        success: true,
        meta: {},
      },
    ]);

    await expect(fetchTerminalConfig(database)).resolves.toEqual({
      url: 'https://terminal.example',
      description: '',
      customFields: [{
        id: 'field-1',
        fieldKey: 'status',
        fieldValue: 'online',
        fieldType: 'badge',
        sortOrder: 3,
      }],
      style: {
        fontSize: 'md',
        animationSpeed: 'fast',
        promptText: '>',
        showEmbed: true,
        embedHeight: '400px',
      },
    });
    expect(vi.mocked(database.batch)).toHaveBeenCalledOnce();
    expect(statements.map(({ sql }) => sql)).toEqual([
      expect.stringContaining('FROM site_config WHERE id = 1'),
      'SELECT * FROM terminal_custom_fields ORDER BY sort_order ASC',
    ]);
  });

  it('updates site config and replaces custom fields in one ordered batch', async () => {
    const { database, statements } = createDatabase();
    const config: TerminalConfigData = {
      url: '',
      description: '',
      style: {
        fontSize: 'lg',
        animationSpeed: 'slow',
        promptText: '$',
        showEmbed: false,
        embedHeight: '560px',
      },
      customFields: [
        { id: 'field-1', fieldKey: 'status', fieldValue: 'online', fieldType: 'badge', sortOrder: 9 },
        { id: 'field-2', fieldKey: 'url', fieldValue: 'https://example.test', fieldType: 'url', sortOrder: 2 },
      ],
    };

    await updateTerminalConfig(database, config);

    expect(vi.mocked(database.batch)).toHaveBeenCalledOnce();
    expect(statements.map(({ sql }) => sql)).toEqual([
      expect.stringContaining('UPDATE site_config'),
      'DELETE FROM terminal_custom_fields',
      expect.stringContaining('INSERT INTO terminal_custom_fields'),
      expect.stringContaining('INSERT INTO terminal_custom_fields'),
    ]);
    expect(statements[0]?.bindings).toEqual([null, null, 'lg', 'slow', '$', 0, '560px']);
    expect(statements[2]?.bindings).toEqual(['field-1', 'status', 'online', 'badge', 0]);
    expect(statements[3]?.bindings).toEqual(['field-2', 'url', 'https://example.test', 'url', 1]);
  });

  it('preserves the legacy defaults when style and custom fields are omitted', async () => {
    const { database, statements } = createDatabase();

    await updateTerminalConfig(database, {
      url: 'https://terminal.example',
      description: 'fixture',
    } as TerminalConfigData);

    expect(statements.map(({ sql }) => sql)).toEqual([
      expect.stringContaining('UPDATE site_config'),
      'DELETE FROM terminal_custom_fields',
    ]);
    expect(statements[0]?.bindings).toEqual([
      'https://terminal.example',
      'fixture',
      'md',
      'normal',
      '>',
      0,
      '400px',
    ]);
  });
});
