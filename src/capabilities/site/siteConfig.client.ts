import type { TerminalInfo } from '@/capabilities/terminal/terminalConfig';
import { apiGet, apiPut } from '@/services/apiClient';
import type { SiteConfigData } from './siteConfig';

export function fetchSiteConfig() {
  return apiGet<SiteConfigData>('/api/admin/site-config');
}

export function updateSiteConfig(siteConfig: SiteConfigData) {
  return apiPut<void>('/api/admin/site-config', { siteConfig });
}

export async function updateTerminalInfo(terminalInfo: TerminalInfo): ReturnType<typeof apiPut> {
  const current = await fetchSiteConfig();
  if (!current.success || !current.data) {
    return { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Cannot fetch site config' } };
  }

  return updateSiteConfig({
    ...current.data,
    terminalUrl: terminalInfo.url,
    terminalDescription: terminalInfo.description,
  });
}
