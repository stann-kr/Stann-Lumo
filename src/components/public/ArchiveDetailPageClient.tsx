'use client';

import { getPublicImageUrl } from '@/capabilities/media/media';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderAccent, createBorderFaint, createBorderMid } from '@/utils/colorMix';
import type { GalleryPhoto } from '@/capabilities/media/media';

interface ArchiveDetailPageClientProps {
  photo: GalleryPhoto;
  previous: GalleryPhoto | null;
  next: GalleryPhoto | null;
  index: number;
  total: number;
}

export default function ArchiveDetailPageClient({ photo, previous, next, index, total }: ArchiveDetailPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();
  const borderAccent = createBorderAccent();
  const pageTitle = photo.caption || photo.altText || `${t('gallery_label') || 'ARCHIVE'} ${index + 1}`;
  const category = photo.linkedEventId ? ['EVENT', 'ri-calendar-event-line'] : photo.mediaType === 'video_youtube' ? ['YOUTUBE', 'ri-youtube-line'] : photo.mediaType === 'video_file' ? ['VIDEO', 'ri-film-line'] : ['PHOTO', 'ri-image-line'];
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && previous) router.push(`/archive/${previous.id}`);
    if (event.key === 'ArrowRight' && next) router.push(`/archive/${next.id}`);
    if (event.key === 'Escape') router.push('/archive');
  }, [next, previous, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const media = photo.mediaType === 'video_youtube' && photo.videoYoutubeId ? <div className="w-full aspect-video"><iframe src={`https://www.youtube.com/embed/${photo.videoYoutubeId}`} allow="encrypted-media; fullscreen" allowFullScreen className="w-full h-full" title={photo.altText || photo.filename} /></div>
    : photo.mediaType === 'video_file' ? <video src={`/api/media/${photo.id}`} controls className="w-full max-h-[70vh] object-contain" aria-label={pageTitle} />
    : <img src={getPublicImageUrl(photo.id)} alt={photo.altText || photo.filename} className="w-full object-contain" style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }} />;

  return (
    <PageLayout title={pageTitle}>
      <article className="space-y-10" aria-label={`Archive item: ${pageTitle}`}>
        <header className="flex items-center justify-between"><Link href="/archive" className="inline-flex min-h-11 items-center gap-2 text-xs tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-secondary)] transition-colors"><i className="ri-arrow-left-line" aria-hidden="true" />ARCHIVE</Link><div className="flex items-center gap-4"><span className="inline-flex items-center gap-1.5 text-xs tracking-widest px-2 py-1 border text-[var(--color-accent)]" style={borderAccent}><i className={`${category[1]} text-xs`} aria-hidden="true" />{category[0]}</span><span className="text-xs text-[var(--color-text-muted)] tracking-widest">{index + 1} / {total}</span></div></header>
        <div className="relative">{media}
          {previous && <Link href={`/archive/${previous.id}`} className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start pl-3 opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] transition-opacity bg-gradient-to-r from-[var(--color-bg)]/60 to-transparent" aria-label="Previous archive item" aria-keyshortcuts="ArrowLeft"><i className="ri-arrow-left-s-line text-3xl text-[var(--color-secondary)]" aria-hidden="true" /></Link>}
          {next && <Link href={`/archive/${next.id}`} className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-3 opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] transition-opacity bg-gradient-to-l from-[var(--color-bg)]/60 to-transparent" aria-label="Next archive item" aria-keyshortcuts="ArrowRight"><i className="ri-arrow-right-s-line text-3xl text-[var(--color-secondary)]" aria-hidden="true" /></Link>}
        </div>
        <div className="flex items-start justify-between gap-6 border-t pt-6" style={borderFaint}><div className="space-y-2 flex-1">{photo.caption && <p className="text-base text-[var(--color-text-muted)] tracking-wider leading-relaxed">{photo.caption}</p>}{photo.linkedEventId && <Link href={`/events/${photo.linkedEventId}`} className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--color-accent)] hover:opacity-70 transition-opacity"><i className="ri-calendar-event-line" aria-hidden="true" />VIEW EVENT</Link>}</div><nav className="flex items-center gap-2 shrink-0" aria-label="Archive navigation">{previous ? <Link href={`/archive/${previous.id}`} className="w-11 h-11 border flex items-center justify-center transition-colors text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 cursor-pointer" style={borderMid} aria-label="Previous archive item" aria-keyshortcuts="ArrowLeft"><i className="ri-arrow-left-line text-sm" aria-hidden="true" /></Link> : <button type="button" className="w-11 h-11 border flex items-center justify-center text-[var(--color-text-muted)] cursor-not-allowed" style={borderMid} aria-label="No previous archive item" disabled><i className="ri-arrow-left-line text-sm" aria-hidden="true" /></button>}{next ? <Link href={`/archive/${next.id}`} className="w-11 h-11 border flex items-center justify-center transition-colors text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 cursor-pointer" style={borderMid} aria-label="Next archive item" aria-keyshortcuts="ArrowRight"><i className="ri-arrow-right-line text-sm" aria-hidden="true" /></Link> : <button type="button" className="w-11 h-11 border flex items-center justify-center text-[var(--color-text-muted)] cursor-not-allowed" style={borderMid} aria-label="No next archive item" disabled><i className="ri-arrow-right-line text-sm" aria-hidden="true" /></button>}</nav></div>
        <p className="text-[var(--color-text-muted)] text-xs tracking-widest">← → NAVIGATE · ESC BACK TO GALLERY</p>
      </article>
    </PageLayout>
  );
}
