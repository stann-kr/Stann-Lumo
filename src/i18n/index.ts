import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import messages from './local/index';

// LanguageDetector 미사용 — LanguageContext가 단일 언어 소스로 i18n.changeLanguage() 호출
i18n.use(initReactI18next).init({
  lng: 'en', // 초기값 'en', LanguageContext hydration 후 변경됨
  fallbackLng: 'en',
  debug: false,
  resources: messages,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;