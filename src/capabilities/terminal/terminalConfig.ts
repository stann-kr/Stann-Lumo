export interface TerminalCustomField {
  id: string;
  fieldKey: string;
  fieldValue: string;
  fieldType: 'text' | 'url' | 'badge';
  sortOrder: number;
}

export interface TerminalStyleConfig {
  fontSize: 'sm' | 'md' | 'lg';
  animationSpeed: 'slow' | 'normal' | 'fast';
  promptText: string;
  showEmbed: boolean;
  embedHeight: string;
}

export interface TerminalInfo {
  url: string;
  description: string;
  customFields?: TerminalCustomField[];
  style?: TerminalStyleConfig;
}

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
