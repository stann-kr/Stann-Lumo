'use client';

import { getPublicImageUrl } from '@/capabilities/media/media';

import { useState } from 'react';
import Link from '../feature/PublicLink';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './EventsPageClient.module.css';
import type { EventsPageMeta } from '@/capabilities/content/content';
import type { Performance } from '@/capabilities/events/events';
import { performanceDate, performanceLocation, performanceSchedule } from '@/capabilities/events/events';

interface EventsPageClientProps {
  eventsMeta: EventsPageMeta;
  performances: Performance[];
}

function EventRow({ event, featured = false, past = false }: { event: Performance; featured?: boolean; past?: boolean }) {
  const location = performanceLocation(event);
  const showStatus = !past || event.status === 'Cancelled';
  return (
    <Link href={`/events/${event.id}`} className={styles.row} data-featured={featured} data-past={past} data-hover>
      <div className={styles.date}><time dateTime={performanceDate(event.date)}>{performanceDate(event.date)}</time>{event.time && <span>{event.time}</span>}</div>
      <h3 data-hover-label>{event.title}</h3>
      <div className={styles.venue}>{event.venue}{location && <span>{location}</span>}</div>
      <span className={styles.status} data-cancelled={event.status === 'Cancelled'}>{showStatus ? event.status : ''}</span>
      {event.posterImageId && <img src={getPublicImageUrl(event.posterImageId)} alt="" className={styles.poster} loading="lazy" data-hover-image />}
      <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
    </Link>
  );
}

export default function EventsPageClient({ eventsMeta, performances }: EventsPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [visiblePastCount, setVisiblePastCount] = useState(10);
  const { upcoming: upcomingEvents, past: pastEvents } = performanceSchedule(performances);
  const visiblePastEvents = pastEvents.slice(0, visiblePastCount);

  return (
    <PageLayout title={eventsMeta.title || t('events_title')} subtitle={eventsMeta.subtitle} motionRevision={visiblePastCount}>
      <section className={styles.section} aria-labelledby="upcoming-events-heading">
        <h2 id="upcoming-events-heading">{eventsMeta.upcomingTitle || t('events_upcoming')} <span>{upcomingEvents.length}</span></h2>
        {upcomingEvents.length === 0 ? <p className={styles.empty}>{language === 'ko' ? '예정된 공연이 없습니다.' : 'No upcoming events.'}</p> : (
          <div>{upcomingEvents.map((event, index) => <EventRow key={event.id} event={event} featured={index === 0} />)}</div>
        )}
      </section>
      <section className={styles.section} aria-labelledby="past-events-heading">
        <h2 id="past-events-heading">{eventsMeta.pastTitle || t('events_past')} <span>{pastEvents.length}</span></h2>
        {pastEvents.length === 0 ? <p className={styles.empty}>{t('msg_no_items')}</p> : <>
          <div>{visiblePastEvents.map((event) => <EventRow key={event.id} event={event} past />)}</div>
          {pastEvents.length > visiblePastCount && <button type="button" onClick={() => setVisiblePastCount((count) => count + 10)} className={styles.more}>{t('events_load_more')}</button>}
        </>}
      </section>
    </PageLayout>
  );
}
