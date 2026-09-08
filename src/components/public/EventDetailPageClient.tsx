'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/feature/PageLayout';
import { getPublicImageUrl, type GalleryPhoto } from '@/capabilities/media/media';
import type { Performance } from '@/capabilities/events/events';
import styles from './EventDetailPageClient.module.css';

export default function EventDetailPageClient({ event, posterPhoto }: { event: Performance; posterPhoto?: GalleryPhoto }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  return (
    <PageLayout title={event.title}>
      <Link href="/events" className={styles.back}><span aria-hidden="true">←</span> {t('events_title')}</Link>
      <div className={styles.detail} data-has-poster={!!posterPhoto}>
        <aside className={styles.facts} aria-label={isKorean ? '공연 정보' : 'Event information'}>
          <dl>
            <div><dt>{isKorean ? '일시' : 'Date'}</dt><dd><time dateTime={event.date.replace(/\./g, '-')}>{event.date}</time>{event.time && <span>{event.time}</span>}</dd></div>
            <div><dt>{isKorean ? '장소' : 'Venue'}</dt><dd>{event.venue}{event.location && <span>{event.location}</span>}</dd></div>
            <div><dt>{isKorean ? '상태' : 'Status'}</dt><dd>{event.status}</dd></div>
          </dl>
          {event.raEventLink && <a href={event.raEventLink} target="_blank" rel="noopener noreferrer" className={styles.external}>{isKorean ? 'Resident Advisor에서 보기' : 'View on Resident Advisor'} <span aria-hidden="true">↗</span><span className="sr-only">{isKorean ? ' (새 창)' : ' (opens in a new tab)'}</span></a>}
        </aside>
        {posterPhoto && <div className={styles.poster} data-reveal="card"><img src={getPublicImageUrl(posterPhoto.id)} alt={posterPhoto.altText || event.title} /></div>}
        {event.lineup && <section className={styles.lineup} data-reveal><h2>{isKorean ? '라인업' : 'Lineup'}</h2><p>{event.lineup}</p></section>}
      </div>
    </PageLayout>
  );
}
