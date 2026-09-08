import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventsPageClient from '@/components/public/EventsPageClient';
import EventDetailPageClient from '@/components/public/EventDetailPageClient';
import type { Performance } from '@/capabilities/events/events';
import type { GalleryPhoto } from '@/capabilities/media/media';

vi.mock('next/link', () => ({ default: (props: React.ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

const event: Performance = { id: 'event', date: '2999-01-01', title: 'A long event title that remains available in full', venue: 'Venue', status: 'Cancelled', lineup: 'STANN LUMO', raEventLink: 'https://ra.co/events/123' };
const meta = { title: 'Events', subtitle: '', upcomingTitle: 'Upcoming', pastTitle: 'Past' };

describe('public events', () => {
  it('keeps sparse upcoming events linked, exposes cancellation and adds past records ten at a time', () => {
    const past = Array.from({ length: 11 }, (_, index) => ({ ...event, id: `past-${index}`, title: `Past ${index}`, date: '2020-01-01', status: 'Announced' as const }));
    render(<EventsPageClient eventsMeta={meta} performances={[event, ...past]} />);
    const upcoming = screen.getByRole('region', { name: 'Upcoming 1' });
    expect(within(upcoming).getByRole('link')).toHaveAttribute('href', '/events/event');
    expect(within(upcoming).getByText(event.title)).toBeVisible();
    expect(within(upcoming).getByText('Cancelled')).toBeVisible();
    expect(within(upcoming).queryByRole('img')).not.toBeInTheDocument();
    const pastRegion = screen.getByRole('region', { name: 'Past 11' });
    expect(within(pastRegion).getAllByRole('link')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: 'events_load_more' }));
    expect(within(pastRegion).getAllByRole('link')).toHaveLength(11);
    expect(screen.queryByRole('button', { name: 'events_load_more' })).not.toBeInTheDocument();
  });

  it('keeps essential event facts and the real external URL with or without a poster', () => {
    const { rerender } = render(<EventDetailPageClient event={event} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(event.title);
    const facts = screen.getByRole('complementary', { name: 'Event information' });
    expect(within(facts).getByText('Cancelled')).toBeVisible();
    expect(within(facts).getByRole('link')).toHaveAttribute('href', event.raEventLink);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(<EventDetailPageClient event={event} posterPhoto={{ id: 'poster', altText: 'Event poster' } as GalleryPhoto} />);
    expect(screen.getByRole('img', { name: 'Event poster' })).toHaveAttribute('src', '/api/media/poster?v=2');
    expect(screen.getByText('STANN LUMO')).toBeVisible();
  });
});
