'use client';

import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export interface MotionPreference {
  isResolved: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Preserve static content until the browser motion preference is known.
 * This avoids a brief animation for people who have already opted out.
 */
export function useMotionPreference(): MotionPreference {
  const [preference, setPreference] = useState<MotionPreference>({
    isResolved: false,
    prefersReducedMotion: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      setPreference({ isResolved: true, prefersReducedMotion: false });
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = (matches = mediaQuery.matches) => {
      setPreference({ isResolved: true, prefersReducedMotion: matches });
    };

    updatePreference();
    const handleChange = (event: MediaQueryListEvent) => updatePreference(event.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return preference;
}
