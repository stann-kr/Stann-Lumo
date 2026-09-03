export type RAApiOption = '1' | '2' | '3' | '4';

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
