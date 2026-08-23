import { apiGet, apiPut } from '@/services/apiClient';
import type { TerminalConfigData } from './terminalConfig';

export function fetchTerminalConfig() {
  return apiGet<TerminalConfigData>('/api/admin/terminal-config');
}

export function updateTerminalConfig(config: TerminalConfigData) {
  return apiPut<void>('/api/admin/terminal-config', { config });
}
