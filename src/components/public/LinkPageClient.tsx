"use client";

import Link from 'next/link';
import { useTranslation } from "react-i18next";
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from "@/components/feature/PageLayout";
import type { LinkPageMeta, LinkPlatform } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";
import styles from './LinkPageClient.module.css';

interface LinkPageClientProps { linkMeta: LinkPageMeta; linkPlatforms: LinkPlatform[]; terminalInfo: TerminalInfo; }

export default function LinkPageClient({ linkMeta, linkPlatforms, terminalInfo }: LinkPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const newTabLabel = language === 'ko' ? '새 창에서 열기' : 'Opens in a new tab';
  return (
    <PageLayout title={linkMeta.title || t("link_title")} subtitle={linkMeta.subtitle || t("link_subtitle")}>
      <ul className={styles.platforms}>
        {linkPlatforms.map((link) => <li key={link.id} data-reveal="row">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.row} data-hover>
            <h2 data-hover-label>{link.platform}</h2><p>{link.description}</p><span className={styles.external}><span data-hover-arrow aria-hidden="true">↗</span><span className="sr-only">{newTabLabel}</span></span>
            <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
          </a>
        </li>)}
      </ul>
      {terminalInfo.url && <section className={styles.terminal} data-reveal>
        <p>{t("link_side_project")}</p>
        <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer" className={styles.row} data-hover>
          <h2 data-hover-label>{linkMeta.terminalTitle || 'Terminal'}</h2><p>{terminalInfo.description}</p><span className={styles.external}><span data-hover-arrow aria-hidden="true">↗</span><span className="sr-only">{newTabLabel}</span></span>
          <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
        </a>
      </section>}
      <footer className={styles.footer}><p>{t("link_footer_note")}</p><Link href="/contact">{t("link_footer_contact")}</Link></footer>
    </PageLayout>
  );
}
