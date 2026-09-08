'use client';

import { getPublicImageUrl } from '@/capabilities/media/media';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ArchivePageClient.module.css';
import type { GalleryPhoto } from '@/capabilities/media/media';
import { ARCHIVE_PAGE_SIZE, sortArchivePhotos, type ArchiveSort } from '@/capabilities/media/archiveBrowsing';

function GridItem({ photo }: { photo: GalleryPhoto }) {
  const { language } = useLanguage();
  const label = photo.caption || photo.altText || photo.filename;
  return (
    <li data-reveal="card">
      <article>
        <Link href={`/archive/${photo.id}`} className={styles.tile} data-hover aria-label={`${language === 'ko' ? '아카이브 항목 열기' : 'Open archive item'}: ${label}`}>
          <div className={styles.media} data-video={photo.mediaType !== 'image'}>
            {photo.mediaType === 'video_youtube' ? <img src={photo.videoThumbnailUrl || undefined} alt={photo.altText || photo.filename} loading="lazy" data-hover-image />
              : photo.mediaType === 'video_file' ? <video src={`/api/media/${photo.id}`} preload="none" muted playsInline aria-hidden="true" />
              : <img src={getPublicImageUrl(photo.id)} alt={photo.altText || photo.filename} loading="lazy" data-hover-image />}
          </div>
          {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
        </Link>
        {photo.eventDate && <time className={styles.date} dateTime={photo.eventDate.replace(/\./g, '-')}>{photo.eventDate}</time>}
      </article>
    </li>
  );
}

export default function ArchivePageClient({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<ArchiveSort>('newest');
  const [seed, setSeed] = useState(1);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLUListElement>(null);
  const sortedPhotos = useMemo(() => sortArchivePhotos(photos, sort, seed), [photos, sort, seed]);
  const totalPages = Math.max(1, Math.ceil(sortedPhotos.length / ARCHIVE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * ARCHIVE_PAGE_SIZE;
  const pagePhotos = sortedPhotos.slice(offset, offset + ARCHIVE_PAGE_SIZE);
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);
  const controlClass = 'min-h-11 min-w-11 border border-[var(--color-muted)] px-3 text-xs font-mono tracking-wider text-[var(--color-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed';
  function changePage(nextPage: number) {
    setPage(nextPage);
    listRef.current?.focus({ preventScroll: true });
    listRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }
  function pageButton(value: number) {
    return <button key={value} type="button" className={`${controlClass} ${value === currentPage ? 'bg-[var(--color-accent)]/15 !border-[var(--color-accent)]' : ''}`} aria-label={t('gallery_page', { page: value })} aria-current={value === currentPage ? 'page' : undefined} onClick={() => changePage(value)}>{value}</button>;
  }
  return (
    <PageLayout title={t('gallery_title')} subtitle={t('gallery_subtitle')} motionRevision={`${sort}:${seed}:${currentPage}`}>
      {photos.length === 0 ? <div className={styles.empty}><p className="text-[var(--color-text-muted)] text-sm font-mono tracking-widest">{t('gallery_empty')}</p></div> : <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-[var(--color-muted)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" aria-atomic="true" className="text-xs font-mono text-[var(--color-text-muted)]">{t('gallery_range', { start: offset + 1, end: offset + pagePhotos.length, total: photos.length })}</p>
          <fieldset className="min-w-0">
            <legend className="sr-only">{t('gallery_sort')}</legend>
            <div className="flex items-center gap-1">
              {(['newest', 'random', 'oldest'] as const).map((value) => (
                <label key={value} className="relative flex-1 cursor-pointer sm:flex-none">
                  <input type="radio" name="archive-sort" value={value} checked={sort === value} className="peer sr-only" onChange={() => {
                    if (value === 'random') setSeed(crypto.getRandomValues(new Uint32Array(1))[0]!);
                    setSort(value);
                    setPage(1);
                  }} />
                  <span className="flex min-h-11 items-center justify-center border-b-2 border-transparent px-3 font-mono text-xs uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)]/10 peer-checked:text-[var(--color-primary)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)] motion-reduce:transition-none">{t(`gallery_sort_${value}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <ul ref={listRef} tabIndex={-1} aria-label={t('gallery_items')} className={styles.grid}>{pagePhotos.map((photo) => <GridItem key={photo.id} photo={photo} />)}</ul>
        {totalPages > 1 && <nav aria-label={t('gallery_pagination')} className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className={controlClass} disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>{t('gallery_previous')}</button>
          {firstPage > 1 && <>{pageButton(1)}{firstPage > 2 && <span aria-hidden="true" className="text-[var(--color-text-muted)]">…</span>}</>}
          {pageNumbers.map(pageButton)}
          {firstPage + pageNumbers.length <= totalPages && <>{firstPage + pageNumbers.length < totalPages && <span aria-hidden="true" className="text-[var(--color-text-muted)]">…</span>}{pageButton(totalPages)}</>}
          <button type="button" className={controlClass} disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>{t('gallery_next')}</button>
        </nav>}
      </div>}
    </PageLayout>
  );
}
