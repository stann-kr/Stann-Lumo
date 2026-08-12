import { describe, expect, it } from 'vitest';
import { createPublicMetadata } from './publicMetadata';

describe('createPublicMetadata', () => {
  it('provides a canonical URL and social metadata for the requested public route', () => {
    const metadata = createPublicMetadata({
      title: 'Night Signal',
      description: 'A STANN LUMO performance archive item.',
      path: '/events/night-signal',
    });

    expect(metadata.alternates).toEqual({ canonical: '/events/night-signal' });
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'STANN LUMO',
      title: 'Night Signal | STANN LUMO',
      url: 'https://lumo.stann.kr/events/night-signal',
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary', title: 'Night Signal | STANN LUMO' });
  });
});
