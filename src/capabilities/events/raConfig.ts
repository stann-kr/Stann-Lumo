export type RAApiOption = '1' | '2' | '3' | '4';

export function isRAApiOption(value: unknown): value is RAApiOption {
  return value === '1' || value === '2' || value === '3' || value === '4';
}

export function normalizeRAApiOption(value: string | null | undefined): RAApiOption {
  return isRAApiOption(value) ? value : '1';
}

/** 브라우저에 반환해도 되는 RA 설정 view. */
export interface RAApiConfigView {
  userId: string;
  djId: string;
  option: RAApiOption;
  year: string;
  hasApiKey: boolean;
}

/** 저장 요청은 replacement 또는 명시적 clear 의도만 전달한다. */
export interface RAApiConfigUpdate {
  userId: string;
  djId: string;
  option: RAApiOption;
  year?: string;
  apiKey?: string;
  clearApiKey?: boolean;
}
