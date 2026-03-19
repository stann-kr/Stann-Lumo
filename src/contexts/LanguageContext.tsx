import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n';

type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 서버와 클라이언트 첫 렌더 모두 'en'으로 시작 — hydration 불일치 방지
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // hydration 완료 후 localStorage에서 저장된 언어 복원, i18next 동기화
    const saved = localStorage.getItem('app_language');
    const lang: Language = (saved === 'ko' || saved === 'en') ? saved : 'en';
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => {
      const next = prev === 'en' ? 'ko' : 'en';
      i18n.changeLanguage(next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
