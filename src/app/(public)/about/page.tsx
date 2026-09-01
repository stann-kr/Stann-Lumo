import type { Metadata } from 'next';
import AboutPageClient from '@/components/public/AboutPageClient';
import { createPublicMetadata } from '@/lib/publicMetadata';
import { getAboutProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export const metadata: Metadata = createPublicMetadata({
  title: 'About',
  description: 'STANN LUMO — Seoul-based techno artist, DJ & producer',
  path: '/about',
});

export default async function AboutPage() {
  const projection = await getAboutProjection(await getRequestLocale());
  return <AboutPageClient artistInfo={projection.artistInfo} aboutSections={projection.aboutSections} />;
}
