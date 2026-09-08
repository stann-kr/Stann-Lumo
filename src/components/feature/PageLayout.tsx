'use client';

import { useRef, type ReactNode } from 'react';
import KineticHeading from './KineticHeading';
import { useContentMotion } from './useContentMotion';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  title: string;
  titleExtra?: string[];
  subtitle?: string;
  children: ReactNode;
  motionRevision?: string | number;
}

export default function PageLayout({ title, titleExtra, subtitle, children, motionRevision }: PageLayoutProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  useContentMotion(pageRef, `${title}:${motionRevision ?? ''}`);
  return (
    <div ref={pageRef} className={styles.page}>
      <header className={styles.header}>
        <KineticHeading title={title} extra={titleExtra} />
        {subtitle && <p data-reveal>{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
