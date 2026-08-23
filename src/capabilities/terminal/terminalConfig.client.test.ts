import { describe, expect, it, vi } from 'vitest';
import { apiGet, apiPut } from '@/services/apiClient';
import { fetchTerminalConfig, updateTerminalConfig } from './terminalConfig.client';
import type { TerminalConfigData } from './terminalConfig';

vi.mock('@/services/apiClient', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

describe('terminal config client capability', () => {
  it('uses the stable admin endpoint for reads and writes', () => {
    const config: TerminalConfigData = {
      url: 'https://terminal.example',
      description: 'fixture',
      customFields: [],
      style: { fontSize: 'md', animationSpeed: 'normal', promptText: '>', showEmbed: false, embedHeight: '400px' },
    };

    fetchTerminalConfig();
    updateTerminalConfig(config);

    expect(apiGet).toHaveBeenCalledWith('/api/admin/terminal-config');
    expect(apiPut).toHaveBeenCalledWith('/api/admin/terminal-config', { config });
  });
});
