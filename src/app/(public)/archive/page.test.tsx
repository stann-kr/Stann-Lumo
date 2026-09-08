import type { ComponentProps, ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GalleryPhoto } from '@/capabilities/media/media';
import ArchivePageClient from '@/components/public/ArchivePageClient';
import { sortArchivePhotos } from '@/capabilities/media/archiveBrowsing';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/feature/PageLayout', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

const photos: GalleryPhoto[] = [
  {
    id: 'night-signal',
    filename: 'night-signal.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    altText: 'STANN LUMO performing beneath red lights',
    caption: 'Night Signal',
    sortOrder: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    mediaType: 'image',
    focalX: 50,
    focalY: 50,
  },
  {
    id: 'live-cut',
    filename: 'live-cut.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 2048,
    altText: 'Live performance clip',
    caption: '',
    sortOrder: 2,
    createdAt: '2026-08-02T00:00:00.000Z',
    mediaType: 'video_file',
    focalX: 50,
    focalY: 50,
  },
];

describe('GalleryPage', () => {
  it('renders each archive tile as an article containing a named native link', () => {
    const { container } = render(<ArchivePageClient photos={photos} />);

    const nightSignal = screen.getByRole('link', { name: 'Open archive item: Night Signal' });
    const liveCut = screen.getByRole('link', { name: 'Open archive item: Live performance clip' });

    expect(screen.getByRole('list')).toContainElement(nightSignal.closest('li'));
    expect(nightSignal).toHaveAttribute('href', '/archive/night-signal');
    expect(liveCut).toHaveAttribute('href', '/archive/live-cut');
    expect(nightSignal.closest('article')).toContainElement(nightSignal);
    expect(container.querySelectorAll('div[onclick]')).toHaveLength(0);
  });

  it('keeps non-interactive media affordances out of the accessibility tree', () => {
    const { container } = render(<ArchivePageClient photos={photos} />);

    expect(container.querySelector('video')).toHaveAttribute('aria-hidden', 'true');
    for (const icon of container.querySelectorAll('i')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('sorts flyers by event date rather than the date of their bulk upload', () => {
    const items = [
      { ...photos[0]!, id: 'older-event', caption: 'Older event', eventDate: '2020-01-01', createdAt: '2026-09-08 03:00:00' },
      { ...photos[0]!, id: 'newer-event', caption: 'Newer event', eventDate: '2024-01-01', createdAt: '2026-09-08 01:00:00' },
      { ...photos[0]!, id: 'photo', caption: 'Photo', createdAt: '2025-01-01T00:00:00Z' },
    ];
    render(<ArchivePageClient photos={items} />);
    const captions = () => within(screen.getByRole('list')).getAllByRole('link').map(link => link.textContent);
    expect(captions()).toEqual(['Photo', 'Newer event', 'Older event']);
    fireEvent.change(screen.getByRole('combobox', { name: 'gallery_sort' }), { target: { value: 'oldest' } });
    expect(captions()).toEqual(['Older event', 'Newer event', 'Photo']);
    expect(items.map(item => item.id)).toEqual(['older-event', 'newer-event', 'photo']);
  });

  it('paginates without losing items and keeps a random order stable across pages', () => {
    const items = Array.from({ length: 53 }, (_, index) => ({
      ...photos[0]!, id: `item-${index}`, caption: `Item ${index}`,
      eventDate: new Date(Date.UTC(2024, 0, index + 1)).toISOString().slice(0, 10),
    }));
    const { rerender } = render(<ArchivePageClient photos={items} />);
    const links = () => within(screen.getByRole('list')).getAllByRole('link').map(link => link.getAttribute('href'));
    expect(links()).toHaveLength(24);
    expect(links()[0]).toBe('/archive/item-52');
    expect(screen.getByRole('button', { name: 'gallery_previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'gallery_next' }));
    expect(links()).toHaveLength(24);
    expect(screen.getByRole('list')).toHaveFocus();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'random' } });
    expect(screen.getByRole('button', { name: 'gallery_previous' })).toBeDisabled();
    const first = links();
    fireEvent.click(screen.getByRole('button', { name: 'gallery_next' }));
    const second = links();
    fireEvent.click(screen.getByRole('button', { name: 'gallery_next' }));
    const last = links();
    expect(last).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'gallery_next' })).toBeDisabled();
    expect(new Set([...first, ...second, ...last]).size).toBe(53);
    fireEvent.click(screen.getByRole('button', { name: 'gallery_previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'gallery_previous' }));
    expect(links()).toEqual(first);
    rerender(<ArchivePageClient photos={[...items]} />);
    expect(links()).toEqual(first);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'oldest' } });
    expect(links()[0]).toBe('/archive/item-0');
    expect(screen.getByRole('button', { name: 'gallery_previous' })).toBeDisabled();
  });

  it('shuffles reproducibly without mutation and keeps undated items last', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ ...photos[0]!, id: `item-${index}` }));
    const original = items.map(item => item.id);
    const shuffled = sortArchivePhotos(items, 'random', 42).map(item => item.id);
    expect(shuffled).not.toEqual(original);
    expect(sortArchivePhotos(items, 'random', 42).map(item => item.id)).toEqual(shuffled);
    expect(new Set(shuffled)).toEqual(new Set(original));
    expect(items.map(item => item.id)).toEqual(original);
    for (const sort of ['newest', 'oldest'] as const) {
      expect(sortArchivePhotos([{ ...photos[0]!, id: 'undated', createdAt: '' }, photos[1]!], sort, 1).at(-1)?.id).toBe('undated');
    }
  });

  it('does not show pagination for an empty archive', () => {
    render(<ArchivePageClient photos={[]} />);
    expect(screen.getByText('gallery_empty')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
