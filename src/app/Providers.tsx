'use client';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { LanguageProvider, type Language } from '@/contexts/LanguageContext';

export default function Providers({ children, initialLanguage }: { children: ReactNode; initialLanguage: Language }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider initialLanguage={initialLanguage}>
        {children}
      </LanguageProvider>
    </I18nextProvider>
  );
}
