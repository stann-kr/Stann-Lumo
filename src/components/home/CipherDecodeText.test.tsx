import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useMotionPreference', () => ({
  useMotionPreference: () => ({ isResolved: true, prefersReducedMotion: true }),
}));

import CipherDecodeText from './CipherDecodeText';

describe('CipherDecodeText', () => {
  it('keeps the exact heading text available when reduced motion is requested', () => {
    render(<CipherDecodeText text="STANN LUMO" />);

    expect(screen.getByText('STANN LUMO')).toBeVisible();
    expect(document.querySelectorAll('.char')).toHaveLength(0);
  });
});
