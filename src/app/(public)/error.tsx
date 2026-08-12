'use client';

import Link from 'next/link';

export default function PublicRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-start justify-center gap-5" role="alert" aria-live="assertive">
      <p className="font-mono text-xs tracking-[0.2em] text-[var(--color-accent)]">SYS.ERR / CONTENT</p>
      <h1 className="font-mono text-2xl tracking-widest text-[var(--color-primary)]">CONTENT UNAVAILABLE</h1>
      <p className="max-w-lg text-base leading-relaxed text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">The archive could not be loaded. Please retry in a moment.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center border border-[var(--color-accent)] px-5 py-2 font-mono text-xs tracking-widest text-[var(--color-accent)] transition-[background-color,color] hover:bg-[var(--color-accent)] hover:text-white">RETRY</button>
        <Link href="/" className="inline-flex min-h-11 items-center border border-[var(--color-muted)] px-5 py-2 font-mono text-xs tracking-widest text-[var(--color-secondary)] transition-colors hover:text-[var(--color-primary)]">RETURN HOME</Link>
      </div>
    </section>
  );
}
