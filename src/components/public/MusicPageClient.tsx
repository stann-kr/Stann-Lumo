"use client";

import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import PageLayout from "@/components/feature/PageLayout";
import type { MusicPageMeta, Track } from "@/capabilities/content/content";
import styles from "./MusicPageClient.module.css";

interface MusicPageClientProps { musicMeta: MusicPageMeta; tracks: Track[]; }

export default function MusicPageClient({ musicMeta, tracks }: MusicPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const newTabLabel = isKorean ? ' (새 창)' : ' (opens in a new tab)';
  return (
    <PageLayout title={musicMeta.title || t("music_title")} subtitle={musicMeta.subtitle || t("music_subtitle")}>
      {tracks.length ? <ul className={styles.tracks}>
        {tracks.map((track) => (
          <li key={track.id} data-reveal="row" data-hover>
            <h2 data-hover-label>{track.title}</h2>
            <div className={styles.meta}><span>{track.type}</span><span>{track.year}</span></div>
            <a href={track.link} target="_blank" rel="noopener noreferrer" aria-label={`${track.title} — ${track.platform}${newTabLabel}`}>
              {track.platform}<span data-hover-arrow aria-hidden="true">↗</span>
            </a>
            <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
          </li>
        ))}
      </ul> : <p className={styles.empty}>{isKorean ? '등록된 음악이 없습니다.' : 'No music has been added yet.'}</p>}
      <footer className={styles.footer} data-reveal>
        <p>{t("music_note")}</p>
        <div>
          <a href="https://stann.kr/lumo" target="_blank" rel="noopener noreferrer">{isKorean ? '뮤직 허브' : 'Music hub'}<span aria-hidden="true"> ↗</span><span className="sr-only">{newTabLabel}</span></a>
          <a href="https://terminal.stann.kr" target="_blank" rel="noopener noreferrer">{isKorean ? '라이브 인터페이스' : 'Live interface'}<span aria-hidden="true"> ↗</span><span className="sr-only">{newTabLabel}</span></a>
        </div>
      </footer>
    </PageLayout>
  );
}
