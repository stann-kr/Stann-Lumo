import type { TerminalCustomField, TerminalStyleConfig } from '@/types/content';

export interface TerminalConfigData {
  url: string;
  description: string;
  customFields: TerminalCustomField[];
  style: TerminalStyleConfig;
}

export const DEFAULT_TERMINAL_STYLE: TerminalStyleConfig = {
  fontSize: 'md',
  animationSpeed: 'normal',
  promptText: '>',
  showEmbed: false,
  embedHeight: '400px',
};
