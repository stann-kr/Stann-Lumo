import type { Metadata } from 'next';
import ArchivePageClient from '@/components/public/ArchivePageClient';
import { createPublicMetadata } from '@/lib/publicMetadata';
import { getArchivePhotos } from '@/lib/publicContent.server';

export const metadata: Metadata = createPublicMetadata({ title: 'Archive', description: 'Photo and video archive of STANN LUMO', path: '/archive' });

export default async function ArchivePage() {
  return <ArchivePageClient photos={await getArchivePhotos()} />;
}
