'use client';

import { getPublicImageUrl } from '@/capabilities/media/media';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './EventsPageClient.module.css';
import type { EventsPageMeta } from '@/capabilities/content/content';
import type { Performance } from '@/capabilities/events/events';

interface EventsPageClientProps {
  eventsMeta: EventsPageMeta;
  performances: Performance[];
}

function parseEventDate(date: string): Date {
  return new Date(date.replace(/\./g, '-'));
}

function EventRow({ event }: { event: Performance }) {
  return (
    <Link href={`/events/${event.id}`} className={styles.row}>
      <div className={styles.date}><time dateTime={event.date.replace(/\./g, '-')}>{event.date}</time>{event.time && <span>{event.time}</span>}</div>
      <h3>{event.title}</h3>
      <div className={styles.venue}>{event.venue}{event.location && <span>{event.location}</span>}</div>
      <span className={styles.status} data-cancelled={event.status === 'Cancelled'}>{event.status}</span>
      {event.posterImageId && <img src={getPublicImageUrl(event.posterImageId)} alt="" className={styles.poster} loading="lazy" />}
    </Link>
  );
}

export default function EventsPageClient({ eventsMeta, performances }: EventsPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [visiblePastCount, setVisiblePastCount] = useState(10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = performances.filter((event) => parseEventDate(event.date) >= today);
  const pastEvents = performances.filter((event) => parseEventDate(event.date) < today);
  const visiblePastEvents = pastEvents.slice(0, visiblePastCount);

  return (
    <PageLayout title={eventsMeta.title || t('events_title')} subtitle={eventsMeta.subtitle || t('events_subtitle')}>
      <section className={styles.section} aria-labelledby="upcoming-events-heading">
        <h2 id="upcoming-events-heading">{eventsMeta.upcomingTitle || t('events_upcoming')} <span>{upcomingEvents.length}</span></h2>
        {upcomingEvents.length === 0 ? <p className={styles.empty}>{language === 'ko' ? '예정된 공연이 없습니다.' : 'No upcoming events.'}</p> : (
          <div>{upcomingEvents.map((event) => <EventRow key={event.id} event={event} />)}</div>
        )}
      </section>
      <section className={styles.section} aria-labelledby="past-events-heading">
        <h2 id="past-events-heading">{eventsMeta.pastTitle || t('events_past')} <span>{pastEvents.length}</span></h2>
        {pastEvents.length === 0 ? <p className={styles.empty}>{t('msg_no_items')}</p> : <>
          <div>{visiblePastEvents.map((event) => <EventRow key={event.id} event={event} />)}</div>
          {pastEvents.length > visiblePastCount && <button type="button" onClick={() => setVisiblePastCount((count) => count + 10)} className={styles.more}>{t('events_load_more')}</button>}
        </>}
      </section>
    </PageLayout>
  );
}
