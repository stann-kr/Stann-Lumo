'use client';
import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  titleExtra?: string[];
  subtitle?: string;
  children: ReactNode;
}

const PageLayout = ({
  title,
  titleExtra,
  subtitle,
  children,
}: PageLayoutProps) => {
  return (
    <div className="max-w-5xl space-y-10 pb-8 relative">
      {/* Sci-Fi Page Header */}
      <div className="relative space-y-4">
        <div className="font-mono text-xs text-[var(--color-accent)] tracking-label flex items-center gap-2">
          <span aria-hidden="true" className="w-1.5 h-1.5 bg-[var(--color-accent)] animate-pulse"></span>
          [ ACCESS_GRANTED // PAGE_INIT ]
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.1em] text-[var(--color-primary)] leading-none break-words">
          {title}
          {titleExtra && titleExtra.map((part, i) => (
            <span key={i} className="block mt-2">
              {part}
            </span>
          ))}
        </h1>
        
        <div className="flex items-center gap-4 pt-4">
          <div className="flex-1 h-px bg-[var(--color-muted)] opacity-50"></div>
          {subtitle && (
            <p className="font-mono text-xs text-[var(--color-accent)] tracking-[0.2em] uppercase shrink-0">
              [{subtitle}]
            </p>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 pt-4 space-y-10">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
