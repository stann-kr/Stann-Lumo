'use client';

import { useEffect } from 'react';

export const LEGACY_PUBLIC_CONTENT_STORAGE_KEY = 'stann_content_multilang';

/**
 * 과거 공개 콘텐츠 응답을 직렬화하던 정확한 storage key만 제거한다.
 * 관리자 direct route에서도 실행되도록 root provider 밖에 마운트한다.
 */
export default function LegacyPublicStorageCleanup() {
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_PUBLIC_CONTENT_STORAGE_KEY);
    } catch {
      // Storage가 차단된 환경에서도 root layout 렌더링은 계속한다.
    }
  }, []);

  return null;
}
