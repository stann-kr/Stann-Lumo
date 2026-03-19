import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import messages from './local/index';

const isBrowser = typeof window !== 'undefined';

const builder = i18n.use(initReactI18next);

// LanguageDetector는 브라우저 전용 (localStorage/document 접근)
// SSR 환경에서는 사용하지 않음
if (isBrowser) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LanguageDetector = require('i18next-browser-languagedetector').default;
  builder.use(LanguageDetector);
}

builder.init({
  lng: isBrowser ? undefined : 'en', // 브라우저에서는 LanguageDetector가 처리
  fallbackLng: 'en',
  debug: false,
  resources: messages,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;