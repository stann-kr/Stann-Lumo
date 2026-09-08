import type { ReactNode } from 'react';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  title: string;
  titleExtra?: string[];
  subtitle?: string;
  children: ReactNode;
}

export default function PageLayout({ title, titleExtra, subtitle, children }: PageLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{title}{titleExtra?.map((part, index) => <span key={index}>{part}</span>)}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
