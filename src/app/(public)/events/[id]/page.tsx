import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventDetailPageClient from '@/components/public/EventDetailPageClient';
import { createPublicMetadata } from '@/lib/publicMetadata';
import { getEventDetail } from '@/lib/publicContent.server';

interface EventDetailPageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const detail = await getEventDetail((await params).id);
  if (!detail) return createPublicMetadata({ title: 'Event not found', description: 'The requested STANN LUMO event is unavailable.', path: '/events' });
  return createPublicMetadata({ title: detail.event.title, description: `${detail.event.venue}${detail.event.location ? ` · ${detail.event.location}` : ''}`, path: `/events/${detail.event.id}` });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const detail = await getEventDetail((await params).id);
  if (!detail) notFound();
  return <EventDetailPageClient event={detail.event} posterPhoto={detail.posterPhoto} />;
}
