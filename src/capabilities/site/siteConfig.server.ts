import 'server-only';

import type { D1Database } from '@/lib/db';
import type { SiteConfigData } from './siteConfig';

interface SiteConfigRow {
  site_name: string;
  tagline: string;
  version: string;
  terminal_url: string | null;
  terminal_description: string | null;
}

export async function fetchSiteConfig(db: D1Database): Promise<SiteConfigData | null> {
  const row = await db.prepare(
    'SELECT * FROM site_config WHERE id = 1',
  ).first<SiteConfigRow>();

  if (!row) return null;
  return {
    siteName: row.site_name,
    tagline: row.tagline,
    version: row.version,
    terminalUrl: row.terminal_url ?? '',
    terminalDescription: row.terminal_description ?? '',
  };
}

export async function updateSiteConfig(db: D1Database, siteConfig: SiteConfigData): Promise<void> {
  await db.prepare(
    `UPDATE site_config
     SET site_name = ?, tagline = ?, version = ?, terminal_url = ?, terminal_description = ?
     WHERE id = 1`,
  ).bind(
    siteConfig.siteName,
    siteConfig.tagline,
    siteConfig.version,
    siteConfig.terminalUrl || null,
    siteConfig.terminalDescription || null,
  ).run();
}
