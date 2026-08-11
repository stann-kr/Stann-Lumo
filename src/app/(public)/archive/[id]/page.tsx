import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArchiveDetailPageClient from '@/components/public/ArchiveDetailPageClient';
import { createPublicMetadata } from '@/lib/publicMetadata';
import { getArchiveDetail, getArchivePhotos } from '@/lib/publicContent.server';

interface ArchiveDetailPageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: ArchiveDetailPageProps): Promise<Metadata> {
  const detail = await getArchiveDetail((await params).id);
  if (!detail) return createPublicMetadata({ title: 'Archive item not found', description: 'The requested STANN LUMO archive item is unavailable.', path: '/archive' });
  return createPublicMetadata({ title: detail.photo.caption || detail.photo.altText || 'Archive', description: detail.photo.caption || 'Photo and video archive of STANN LUMO', path: `/archive/${detail.photo.id}` });
}

export default async function ArchiveDetailPage({ params }: ArchiveDetailPageProps) {
  const detail = await getArchiveDetail((await params).id);
  if (!detail) notFound();
  const photos = await getArchivePhotos();
  const index = photos.findIndex((photo) => photo.id === detail.photo.id);
  return <ArchiveDetailPageClient photo={detail.photo} previous={detail.previous} next={detail.next} index={index} total={photos.length} />;
}
