import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GalleryPhoto } from '@/capabilities/media/media';
import ArchivePageClient from '@/components/public/ArchivePageClient';

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
});
