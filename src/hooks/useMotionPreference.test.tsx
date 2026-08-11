import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMotionPreference } from './useMotionPreference';

let reducedMotion = false;
let reducedMotionListener: ((event: MediaQueryListEvent) => void) | undefined;

describe('useMotionPreference', () => {
  beforeEach(() => {
    reducedMotion = false;
    reducedMotionListener = undefined;
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
        if (query === '(prefers-reduced-motion: reduce)' && type === 'change' && typeof listener === 'function') {
          reducedMotionListener = listener as (event: MediaQueryListEvent) => void;
        }
      },
      matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
      removeEventListener: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves the browser preference and follows later changes', async () => {
    const { result } = renderHook(() => useMotionPreference());

    await waitFor(() => expect(result.current).toEqual({ isResolved: true, prefersReducedMotion: false }));

    act(() => {
      reducedMotion = true;
      reducedMotionListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toEqual({ isResolved: true, prefersReducedMotion: true });
  });
});
