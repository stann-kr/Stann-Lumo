'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useContent } from '@/contexts/ContentContext';
import { createBorderFaint } from '@/utils/colorMix';

interface AdminContentGateProps {
  children: ReactNode;
}

export default function AdminContentGate({ children }: AdminContentGateProps) {
  const { contentStatus, retryContent } = useContent();
  const statusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (contentStatus === 'error') statusRef.current?.focus();
  }, [contentStatus]);

  const handleRetry = () => {
    statusRef.current?.focus();
    retryContent();
  };

  if (contentStatus === 'ready') {
    return (
      <>
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          CONTENT READY. EDITOR AVAILABLE.
        </p>
        {children}
      </>
    );
  }

  if (contentStatus === 'error') {
    return (
      <section
        ref={statusRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        tabIndex={-1}
        className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center gap-5 font-mono"
      >
        <div className="border bg-[var(--color-secondary)]/5 p-6" style={createBorderFaint()}>
          <p className="text-sm font-bold tracking-[0.2em] text-[var(--color-primary)]">CONTENT LOAD FAILED</p>
          <p className="mt-3 text-sm tracking-wider text-[var(--color-secondary)]/70">
            관리자 콘텐츠를 불러오지 못했습니다. 다시 시도해 주세요.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="w-fit border border-[var(--color-primary)] px-5 py-3 text-sm font-bold tracking-widest text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]"
        >
          RETRY CONTENT LOAD
        </button>
      </section>
    );
  }

  return (
    <section
      ref={statusRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      tabIndex={-1}
      className="flex min-h-[60vh] items-center justify-center font-mono text-sm tracking-[0.2em] text-[var(--color-primary)]"
    >
      LOADING CONTENT...
    </section>
  );
}
