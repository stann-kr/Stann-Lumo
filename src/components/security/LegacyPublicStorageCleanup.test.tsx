import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LegacyPublicStorageCleanup, {
  LEGACY_PUBLIC_CONTENT_STORAGE_KEY,
} from './LegacyPublicStorageCleanup';

describe('LegacyPublicStorageCleanup', () => {
  it('removes only the legacy public content cache key', async () => {
    window.localStorage.setItem(LEGACY_PUBLIC_CONTENT_STORAGE_KEY, 'test-only-legacy-payload');
    window.localStorage.setItem('app_language', 'ko');
    window.localStorage.setItem('unrelated', 'keep');

    render(<LegacyPublicStorageCleanup />);

    await waitFor(() => {
      expect(window.localStorage.getItem(LEGACY_PUBLIC_CONTENT_STORAGE_KEY)).toBeNull();
    });
    expect(window.localStorage.getItem('app_language')).toBe('ko');
    expect(window.localStorage.getItem('unrelated')).toBe('keep');
  });

  it('does not break root rendering when storage access is blocked', () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });

    expect(() => render(<LegacyPublicStorageCleanup />)).not.toThrow();
    removeItem.mockRestore();
  });
});
