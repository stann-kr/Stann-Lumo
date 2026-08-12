'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import type { GalleryPhoto, GallerySettings } from '@/types/content';

const ARCHIVE_SETTINGS: GallerySettings = {
  layoutMode: 'masonry', columnsMobile: 2, columnsTablet: 3, columnsDesktop: 4,
  gapSize: 'md', aspectRatio: 'auto', hoverEffect: 'zoom', captionDisplay: 'overlay', lightboxEnabled: true,
};
const columns: Record<number, string> = { 1: 'columns-1', 2: 'columns-2', 3: 'columns-3', 4: 'columns-4', 5: 'columns-5' };
const gaps: Record<GallerySettings['gapSize'], string> = { sm: 'gap-1', md: 'gap-3', lg: 'gap-6' };
const margins: Record<GallerySettings['gapSize'], string> = { sm: 'mb-1', md: 'mb-3', lg: 'mb-6' };

function GridItem({ photo }: { photo: GalleryPhoto }) {
  const label = photo.caption || photo.altText || photo.filename;
  const mediaClass = 'w-full block transition-transform duration-500 group-hover:scale-105';
  const media = photo.mediaType === 'video_youtube' ? <div className="relative"><img src={photo.videoThumbnailUrl ?? ''} alt={photo.altText || photo.filename} className={mediaClass} loading="lazy" /><div className="absolute inset-0 flex items-center justify-center"><i aria-hidden="true" className="ri-play-fill text-white text-xl" /></div></div>
    : photo.mediaType === 'video_file' ? <div className="relative"><video src={`/api/media/${photo.id}`} className={mediaClass} preload="metadata" muted playsInline aria-hidden="true" /><div className="absolute inset-0 flex items-center justify-center"><i aria-hidden="true" className="ri-play-fill text-[var(--color-secondary)] text-lg" /></div></div>
    : <img src={`/api/media/${photo.id}`} alt={photo.altText || photo.filename} className={mediaClass} style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }} loading="lazy" />;

  return (
    <li className={`break-inside-avoid ${margins[ARCHIVE_SETTINGS.gapSize]}`}>
      <article>
        <Link href={`/archive/${photo.id}`} className="group relative block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]" aria-label={`Open archive item: ${label}`}>
          {media}
          {photo.caption && <div className="absolute inset-0 bg-[var(--color-bg)]/80 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 flex items-end p-3"><p className="text-[var(--color-secondary)] text-xs tracking-wider leading-relaxed line-clamp-3">{photo.caption}</p></div>}
          <div className="absolute top-3 right-3 w-7 h-7 bg-[var(--color-bg)]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" aria-hidden="true"><i className="ri-zoom-in-line text-[var(--color-secondary)] text-sm" aria-hidden="true" /></div>
        </Link>
      </article>
    </li>
  );
}

export default function ArchivePageClient({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useTranslation();
  const containerClasses = `${columns[ARCHIVE_SETTINGS.columnsMobile]} md:${columns[ARCHIVE_SETTINGS.columnsTablet]} lg:${columns[ARCHIVE_SETTINGS.columnsDesktop]} ${gaps[ARCHIVE_SETTINGS.gapSize]}`;
  return (
    <PageLayout title={t('gallery_title')} subtitle={t('gallery_subtitle')}>
      {photos.length === 0 ? <div className="hud-panel flex items-center justify-center py-24"><p className="text-[var(--color-text-muted)] text-sm font-mono tracking-widest">{t('gallery_empty')}</p></div> : <ul className={containerClasses}>{photos.map((photo) => <GridItem key={photo.id} photo={photo} />)}</ul>}
    </PageLayout>
  );
}
