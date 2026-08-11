'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderMid } from '@/utils/colorMix';
import type { EventsPageMeta, Performance } from '@/types/content';

interface EventsPageClientProps {
  eventsMeta: EventsPageMeta;
  performances: Performance[];
}

function parseEventDate(date: string): Date {
  return new Date(date.replace(/\./g, '-'));
}

function EventRow({ event, index, past }: { event: Performance; index: number; past?: boolean }) {
  const id = (index + 1).toString().padStart(3, '0');
  const subtle = 'text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]';

  return (
    <Link
      href={`/events/${event.id}`}
      className={`bg-surface group relative min-h-11 overflow-hidden transition-colors ${past ? 'hover:bg-[var(--color-muted)]' : 'hover:bg-[var(--color-accent)]/5'} flex flex-col md:flex-row md:items-center p-4 gap-4`}
    >
      <div className={`hidden w-8 font-mono text-xs ${past ? subtle : 'text-[var(--color-accent)]'} md:block`}>[{id}]</div>
      {event.posterImageId && (
        <div className={`${past ? 'w-10 h-10' : 'w-12 h-12'} bg-black border border-[var(--color-muted)] shrink-0 overflow-hidden relative`}>
          {!past && <div className="absolute inset-0 bg-[var(--color-accent)] opacity-20 mix-blend-overlay" />}
          <img
            src={`/api/media/${event.posterImageId}`}
            alt={event.title}
            className={`w-full h-full object-cover filter grayscale ${past ? 'opacity-50 transition-[filter,opacity] duration-300 group-hover:opacity-100' : 'transition-[filter] duration-500 group-hover:grayscale-0'}`}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className={`font-mono text-base ${past ? 'tracking-widest' : 'tracking-[0.1em]'} ${past ? subtle : 'text-[var(--color-secondary)]'} group-hover:text-[var(--color-primary)] transition-colors uppercase truncate mb-1`}>{event.title}</h3>
        <div className={`font-mono text-xs tracking-widest ${subtle} uppercase truncate`}>
          {event.venue}{event.location && ` / ${event.location}`}
        </div>
      </div>
      <div className="flex flex-col md:items-end justify-center shrink-0 md:w-32 font-mono">
        <p className={`${past ? `text-xs ${subtle}` : 'text-base text-[var(--color-primary)]'} tracking-widest`}>{event.date}</p>
        {!past && event.time && <p className="text-xs text-[var(--color-accent)] tracking-widest mt-1">{event.time}</p>}
      </div>
    </Link>
  );
}

export default function EventsPageClient({ eventsMeta, performances }: EventsPageClientProps) {
  const { t } = useTranslation();
  const borderMid = createBorderMid();
  const [visiblePastCount, setVisiblePastCount] = useState(10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = performances.filter((event) => parseEventDate(event.date) >= today);
  const pastEvents = performances.filter((event) => parseEventDate(event.date) < today);
  const visiblePastEvents = pastEvents.slice(0, visiblePastCount);

  return (
    <PageLayout title={eventsMeta.title || t('events_title')} subtitle={eventsMeta.subtitle || t('events_subtitle')}>
      <section className="space-y-6" aria-labelledby="upcoming-events-heading">
        <h2 id="upcoming-events-heading" className="text-base font-mono font-semibold text-[var(--color-accent)] tracking-widest">{eventsMeta.upcomingTitle || t('events_upcoming')}</h2>
        {upcomingEvents.length === 0 ? <p className="text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">{t('msg_no_items')}</p> : (
          <div className="border border-[var(--color-muted)] p-[1px] flex flex-col gap-[1px]">
            {upcomingEvents.map((event, index) => <EventRow key={event.id} event={event} index={index} />)}
          </div>
        )}
      </section>
      <section className="space-y-6 pt-8 relative before:absolute before:top-0 before:left-0 before:w-16 before:h-px before:bg-[var(--color-accent)]" aria-labelledby="past-events-heading">
        <h2 id="past-events-heading" className="text-base font-mono font-semibold text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] tracking-widest">{eventsMeta.pastTitle || t('events_past')}</h2>
        {pastEvents.length === 0 ? <p className="font-mono text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">{t('msg_no_items')}</p> : <>
          <div className="border border-[var(--color-muted)] p-[1px] flex flex-col gap-[1px]">
            {visiblePastEvents.map((event, index) => <EventRow key={event.id} event={event} index={index} past />)}
          </div>
          {pastEvents.length > visiblePastCount && <div className="pt-4 flex justify-center"><button type="button" onClick={() => setVisiblePastCount((count) => count + 10)} className="min-h-[44px] border px-8 py-3 text-base tracking-widest text-[var(--color-secondary)] transition-opacity duration-300 hover:opacity-80 cursor-pointer whitespace-nowrap" style={borderMid}>{t('events_load_more')}</button></div>}
        </>}
      </section>
    </PageLayout>
  );
}
