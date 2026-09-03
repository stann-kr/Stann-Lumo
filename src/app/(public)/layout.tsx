import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import TerminalLayout from '@/components/feature/TerminalLayout';
import { getPublicShellProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export const metadata: Metadata = {
  title: {
    template: '%s | STANN LUMO',
    default: 'STANN LUMO',
  },
  description: 'TECHNO / SEOUL — Official website of STANN LUMO',
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  const shell = await getPublicShellProjection(locale);

  return (
    <TerminalLayout artistName={shell.artistName} sceneTracks={shell.sceneTracks}>
      {children}
    </TerminalLayout>
  );
}
