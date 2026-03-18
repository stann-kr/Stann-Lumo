'use client';
import { useEffect, useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 어드민 세션 쿠키 검증 기반 라우트 보호 컴포넌트
 *
 * /api/auth/session GET 으로 서버 세션 유효성 확인.
 * 미인증 시 /admin 으로 리다이렉트.
 */
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data: { success: boolean; data?: { authenticated: boolean } }) => {
        if (cancelled) return;
        if (data.data?.authenticated) {
          setAuthenticated(true);
        } else {
          router.replace('/admin');
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/admin');
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked || !authenticated) return null;
  return children;
};

export default ProtectedRoute;
