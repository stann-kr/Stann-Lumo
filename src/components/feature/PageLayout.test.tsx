import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PageLayout from './PageLayout';

vi.mock('@/hooks/useMotionPreference', () => ({
  useMotionPreference: () => ({ isResolved: true, prefersReducedMotion: true }),
}));

vi.mock('../home/CipherDecodeText', () => ({
  default: ({ text }: { text: string }) => <span data-testid="cipher-decode-text">{text}</span>,
}));

describe('PageLayout', () => {
  it('keeps the signature cipher heading mounted while reduced motion leaves content immediately readable', () => {
    render(
      <PageLayout title="Archive" titleExtra={['Signal']} subtitle="Current index">
        <p>Archive content is available immediately.</p>
      </PageLayout>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'ArchiveSignal' })).toBeVisible();
    expect(screen.getAllByTestId('cipher-decode-text')).toHaveLength(2);
    expect(screen.getByText('Archive content is available immediately.')).toBeVisible();
  });
});
