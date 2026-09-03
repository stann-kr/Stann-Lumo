import 'server-only';

import type { D1Database } from '@/lib/db';
import {
  DEFAULT_TERMINAL_STYLE,
  type TerminalConfigData,
  type TerminalCustomField,
  type TerminalStyleConfig,
} from './terminalConfig';

interface TerminalConfigRow {
  terminal_url: string | null;
  terminal_description: string | null;
  terminal_font_size: string | null;
  terminal_animation_speed: string | null;
  terminal_prompt_text: string | null;
  terminal_show_embed: number | null;
  terminal_embed_height: string | null;
}

interface CustomFieldRow {
  id: string;
  field_key: string;
  field_value: string;
  field_type: string;
  sort_order: number;
}

export async function fetchTerminalConfig(db: D1Database): Promise<TerminalConfigData> {
  const [configRes, fieldsRes] = await db.batch([
    db.prepare(
      `SELECT terminal_url, terminal_description, terminal_font_size,
              terminal_animation_speed, terminal_prompt_text,
              terminal_show_embed, terminal_embed_height
       FROM site_config WHERE id = 1`,
    ),
    db.prepare('SELECT * FROM terminal_custom_fields ORDER BY sort_order ASC'),
  ]);

  const configRow = configRes.results[0] as TerminalConfigRow | undefined;
  const fieldRows = fieldsRes.results as CustomFieldRow[];

  const customFields: TerminalCustomField[] = fieldRows.map((row) => ({
    id: row.id,
    fieldKey: row.field_key,
    fieldValue: row.field_value,
    fieldType: (row.field_type as TerminalCustomField['fieldType']) ?? 'text',
    sortOrder: row.sort_order,
  }));

  const style: TerminalStyleConfig = configRow
    ? {
        fontSize: (configRow.terminal_font_size as TerminalStyleConfig['fontSize']) ?? 'md',
        animationSpeed: (configRow.terminal_animation_speed as TerminalStyleConfig['animationSpeed']) ?? 'normal',
        promptText: configRow.terminal_prompt_text ?? '>',
        showEmbed: (configRow.terminal_show_embed ?? 0) === 1,
        embedHeight: configRow.terminal_embed_height ?? '400px',
      }
    : DEFAULT_TERMINAL_STYLE;

  return {
    url: configRow?.terminal_url ?? '',
    description: configRow?.terminal_description ?? '',
    customFields,
    style,
  };
}

export async function updateTerminalConfig(db: D1Database, config: TerminalConfigData): Promise<void> {
  const { url, description, customFields = [], style = DEFAULT_TERMINAL_STYLE } = config;

  await db.batch([
    db.prepare(
      `UPDATE site_config
       SET terminal_url              = ?,
           terminal_description      = ?,
           terminal_font_size        = ?,
           terminal_animation_speed  = ?,
           terminal_prompt_text      = ?,
           terminal_show_embed       = ?,
           terminal_embed_height     = ?
       WHERE id = 1`,
    ).bind(
      url || null,
      description || null,
      style.fontSize,
      style.animationSpeed,
      style.promptText,
      style.showEmbed ? 1 : 0,
      style.embedHeight,
    ),
    db.prepare('DELETE FROM terminal_custom_fields'),
    ...customFields.map((field, index) =>
      db.prepare(
        `INSERT INTO terminal_custom_fields (id, field_key, field_value, field_type, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
      ).bind(field.id, field.fieldKey, field.fieldValue, field.fieldType, index),
    ),
  ]);
}
