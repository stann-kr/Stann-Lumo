'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useContent } from '@/contexts/ContentContext';
import { createBorderFaint } from '@/utils/colorMix';

interface AdminContentGateProps {
  children: ReactNode;
}

export default function AdminContentGate({ children }: AdminContentGateProps) {
  const { contentStatus, retryContent } = useContent();
  const errorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (contentStatus === 'error') errorRef.current?.focus();
  }, [contentStatus]);

  if (contentStatus === 'ready') return <>{children}</>;

  if (contentStatus === 'error') {
    return (
      <section
        ref={errorRef}
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
          onClick={retryContent}
          className="w-fit border border-[var(--color-primary)] px-5 py-3 text-sm font-bold tracking-widest text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]"
        >
          RETRY CONTENT LOAD
        </button>
      </section>
    );
  }

  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      className="flex min-h-[60vh] items-center justify-center font-mono text-sm tracking-[0.2em] text-[var(--color-primary)]"
    >
      LOADING CONTENT...
    </section>
  );
}
