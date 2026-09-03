'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import type { Performance } from '@/capabilities/events/events';
import type { GalleryPhoto } from '@/capabilities/media/media';

const STATUS_CLASSES: Record<Performance['status'], string> = {
  Announced: 'text-[var(--color-accent)]',
  TBA: 'text-[var(--color-text-muted)]',
  Cancelled: 'text-[var(--color-text-muted)]',
};

export default function EventDetailPageClient({ event, posterPhoto }: { event: Performance; posterPhoto?: GalleryPhoto }) {
  const { t } = useTranslation();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();
  return (
    <PageLayout title={event.title} subtitle={`${event.venue}${event.location ? ` · ${event.location}` : ''}`}>
      <Link href="/events" className="inline-flex min-h-11 items-center gap-2 text-xs tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-secondary)] transition-colors"><i aria-hidden="true" className="ri-arrow-left-line" />{t('back') || 'BACK TO EVENTS'}</Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {posterPhoto && <div className="order-1 lg:order-2"><img src={`/api/media/${posterPhoto.id}`} alt={posterPhoto.altText || event.title} className="w-full object-contain" style={{ objectPosition: `${posterPhoto.focalX}% ${posterPhoto.focalY}%` }} /></div>}
        <div className={`order-2 ${posterPhoto ? 'lg:order-1' : ''} space-y-6`}>
          <div className="space-y-1 border-b pb-6" style={borderFaint}><p className="text-xs tracking-widest text-[var(--color-accent)]">DATE</p><p className="text-2xl font-mono text-[var(--color-secondary)]">{event.date}</p>{event.time && <p className="text-xs font-mono text-[var(--color-text-muted)]">{event.time}</p>}</div>
          <div className="space-y-1 border-b pb-6" style={borderFaint}><p className="text-xs tracking-widest text-[var(--color-accent)]">VENUE</p><p className="text-lg text-[var(--color-secondary)]">{event.venue}</p>{event.location && <p className="text-base text-[var(--color-text-muted)]">{event.location}</p>}</div>
          {event.lineup && <div className="space-y-1 border-b pb-6" style={borderFaint}><p className="text-xs tracking-widest text-[var(--color-accent)]">LINEUP</p><p className="text-base text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{event.lineup}</p></div>}
          <div className="space-y-1"><p className="text-xs tracking-widest text-[var(--color-accent)]">STATUS</p><p className={`text-sm font-mono tracking-widest ${STATUS_CLASSES[event.status]}`}>{event.status.toUpperCase()}</p></div>
          {event.raEventLink && <a href={event.raEventLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 px-6 py-3 border text-xs tracking-widest text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors" style={borderMid}><i aria-hidden="true" className="ri-external-link-line" />VIEW ON RESIDENT ADVISOR</a>}
        </div>
      </div>
    </PageLayout>
  );
}
