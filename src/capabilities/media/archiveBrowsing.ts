import type { GalleryPhoto } from './media';

export type ArchiveSort = 'newest' | 'random' | 'oldest';
export const ARCHIVE_PAGE_SIZE = 24;

function archiveDate(photo: GalleryPhoto): number | null {
  const eventDate = Date.parse(photo.eventDate ?? '');
  if (Number.isFinite(eventDate)) return eventDate;
  const createdAt = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(photo.createdAt)
    ? `${photo.createdAt.replace(' ', 'T')}Z`
    : photo.createdAt;
  const date = Date.parse(createdAt);
  return Number.isFinite(date) ? date : null;
}

export function sortArchivePhotos(
  photos: readonly GalleryPhoto[],
  sort: ArchiveSort,
  seed: number,
): GalleryPhoto[] {
  const sorted = [...photos];
  if (sort === 'random') {
    // A seeded shuffle stays fixed while moving between pages.
    let state = seed | 0 || 1;
    for (let index = sorted.length - 1; index > 0; index--) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const other = Math.floor(((state >>> 0) / 0x100000000) * (index + 1));
      [sorted[index], sorted[other]] = [sorted[other]!, sorted[index]!];
    }
    return sorted;
  }
  return sorted.sort((left, right) => {
    const a = archiveDate(left);
    const b = archiveDate(right);
    if (a === null && b !== null) return 1;
    if (b === null && a !== null) return -1;
    const byDate = (a ?? 0) - (b ?? 0);
    return (sort === 'oldest' ? byDate : -byDate)
      || left.sortOrder - right.sortOrder
      || left.id.localeCompare(right.id);
  });
}
