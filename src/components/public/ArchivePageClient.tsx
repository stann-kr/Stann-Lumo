'use client';

import { getPublicImageUrl } from '@/capabilities/media/media';

import Link from '../feature/PublicLink';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import InfiniteList from '@/components/feature/InfiniteList';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ArchivePageClient.module.css';
import type { GalleryPhoto } from '@/capabilities/media/media';
import { ARCHIVE_PAGE_SIZE, archiveBrowseState, archiveHref, archiveItemAnchor, archiveReturnHref, sortArchivePhotos, type ArchiveBrowseState } from '@/capabilities/media/archiveBrowsing';

const RETURN_POSITION_KEY = 'lumo:archive:return-position';

function GridItem({ photo, browse }: { photo: GalleryPhoto; browse: ArchiveBrowseState }) {
  const { language } = useLanguage();
  const label = photo.caption || photo.altText || photo.filename;
  return (
    <article>
      <Link id={archiveItemAnchor(photo.id)} href={archiveHref(browse, photo.id)} prefetch={false} className={styles.tile} aria-label={`${language === 'ko' ? '아카이브 항목 열기' : 'Open archive item'}: ${label}`} onNavigate={() => {
        const href = archiveReturnHref({ ...browse, from: photo.id });
        try { sessionStorage.setItem(RETURN_POSITION_KEY, JSON.stringify({ href, y: window.scrollY })); } catch { /* The URL still restores the selected item when storage is unavailable. */ }
        window.history.replaceState(null, '', href);
      }}>
        <div className={styles.media} data-video={photo.mediaType !== 'image'}>
          {photo.mediaType === 'video_youtube' ? <img src={photo.videoThumbnailUrl || undefined} alt={photo.altText || photo.filename} loading="lazy" data-hover-image />
            : photo.mediaType === 'video_file' ? <video src={`/api/media/${photo.id}`} preload="none" muted playsInline aria-hidden="true" />
            : <img src={getPublicImageUrl(photo.id)} alt={photo.altText || photo.filename} loading="lazy" data-hover-image />}
        </div>
        {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
      </Link>
      {photo.eventDate && <time className={styles.date} dateTime={photo.eventDate.replace(/\./g, '-')}>{photo.eventDate}</time>}
    </article>
  );
}

export default function ArchivePageClient({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { sort, seed, page } = archiveBrowseState(searchParams);
  const listRef = useRef<HTMLUListElement>(null);
  const sortedPhotos = useMemo(() => sortArchivePhotos(photos, sort, seed), [photos, sort, seed]);
  const totalPages = Math.max(1, Math.ceil(sortedPhotos.length / ARCHIVE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const browse = { sort, seed, page: currentPage, from: '' };
  useLayoutEffect(() => {
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!id.startsWith('archive-item-')) return;
    const target = document.getElementById(id);
    if (!target || !listRef.current?.contains(target)) return;
    target.focus({ preventScroll: true });
    try {
      const position = JSON.parse(sessionStorage.getItem(RETURN_POSITION_KEY) || 'null');
      if (position?.href === `${window.location.pathname}${window.location.search}${window.location.hash}` && typeof position.y === 'number' && Number.isFinite(position.y) && position.y >= 0) {
        window.scrollTo({ top: position.y, behavior: 'instant' });
        return;
      }
    } catch { /* A direct link can restore the item without a saved scroll position. */ }
    target.scrollIntoView?.({ block: 'center', behavior: 'instant' });
  }, [sort, seed, currentPage]);
  return (
    <PageLayout title={t('gallery_title')} motionRevision={`${sort}:${seed}:${currentPage}`} animateEntry={false}>
      {photos.length === 0 ? <div className={styles.empty}><p className="text-[var(--color-text-muted)] text-sm font-mono tracking-widest">{t('gallery_empty')}</p></div> : <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-[var(--color-muted)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-mono text-[var(--color-text-muted)]">{t('gallery_total', { total: photos.length })}</p>
          <fieldset className="min-w-0">
            <legend className="sr-only">{t('gallery_sort')}</legend>
            <div className="flex items-center gap-1">
              {(['newest', 'random', 'oldest'] as const).map((value) => (
                <label key={value} className="relative flex-1 cursor-pointer sm:flex-none">
                  <input type="radio" name="archive-sort" value={value} checked={sort === value} className="peer sr-only" onChange={() => {
                    window.history.replaceState(null, '', archiveHref({ sort: value, seed: value === 'random' ? crypto.getRandomValues(new Uint32Array(1))[0]! || 1 : seed, page: 1, from: '' }));
                  }} />
                  <span className="flex min-h-11 items-center justify-center border-b-2 border-transparent px-3 font-mono text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-primary)] peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)]/10 peer-checked:text-[var(--color-primary)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)]">{t(`gallery_sort_${value}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <InfiniteList key={`${sort}:${seed}:${currentPage}`} items={sortedPhotos} pageSize={ARCHIVE_PAGE_SIZE} initialCount={currentPage * ARCHIVE_PAGE_SIZE}
          listRef={listRef} label={t('gallery_items')} className={styles.grid}
          renderItem={(photo, _index, visibleCount) => <GridItem photo={photo} browse={{ ...browse, page: Math.ceil(visibleCount / ARCHIVE_PAGE_SIZE) }} />} />
      </div>}
    </PageLayout>
  );
}
