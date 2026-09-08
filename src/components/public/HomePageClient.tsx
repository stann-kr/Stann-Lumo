"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { SITE_NAME } from "@/constants/site";
import type { ArtistInfoItem, HomePageMeta, HomeSection } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";
import styles from "./HomePageClient.module.css";

interface HomePageClientProps {
  artistInfo: ArtistInfoItem[];
  homeMeta: HomePageMeta;
  homeSections: HomeSection[];
  terminalInfo: TerminalInfo;
}

export default function HomePageClient({ artistInfo, homeMeta, homeSections, terminalInfo }: HomePageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isResolved, prefersReducedMotion } = useMotionPreference();
  const panelId = useId();
  // The CMS owns order: the first four sections are panels, all remaining sections stay visible below.
  const panels = homeSections.slice(0, 4);
  const [selectedPath, setSelectedPath] = useState<string | null>(() => panels.find((section) => section.path === "/music")?.path ?? panels[0]?.path ?? null);
  const artistName = artistInfo.find((item) => item.key === "Name" || item.key === "이름")?.value || SITE_NAME;
  const newTabLabel = language === "ko" ? " (새 창)" : " (opens in a new tab)";

  return (
    <div className={styles.home} data-motion={isResolved && !prefersReducedMotion ? "on" : "off"}>
      <header className={styles.intro}>
        <h1>{artistName}</h1>
        <p>{homeMeta.navTitle || t("home_nav_title")}</p>
      </header>
      <div className={styles.panels}>
        {panels.map((section, index) => {
          const isExpanded = section.path === selectedPath;
          const contentId = `${panelId}-${index}`;
          return (
            <section key={`${section.path}-${index}`} className={styles.panel} data-expanded={isExpanded}>
              <h2>
                <button type="button" id={`${contentId}-trigger`} aria-expanded={isExpanded} aria-controls={contentId}
                  onClick={() => setSelectedPath(isExpanded ? null : section.path)}>
                  <span className={styles.panelTitle}>{section.title}</span>
                  <span className={styles.toggle} aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                </button>
              </h2>
              <div id={contentId} hidden={!isExpanded} className={styles.panelContent}>
                <p>{section.description}</p>
                <Link href={section.path} className={styles.visit}>
                  {language === "ko" ? `${section.title} 보기` : `Explore ${section.title}`}<span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      {homeSections.length > 4 && (
        <div className={styles.secondary}>
          {homeSections.slice(4).map((section, index) => (
            <Link key={`${section.path}-${index}`} href={section.path}>
              <h2>{section.title}</h2><p>{section.description}</p><span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      )}
      {terminalInfo.url && (
        <section className={styles.terminal} aria-labelledby={`${panelId}-terminal`}>
          <div className={styles.terminalIntro}>
            <h2 id={`${panelId}-terminal`}>{t("home_terminal_side_project")}</h2>
            <p>{terminalInfo.description}</p>
            <div className={styles.terminalLinks}>
              <a href="https://stann.kr/lumo" target="_blank" rel="noopener noreferrer">{language === "ko" ? "뮤직 허브" : "Music hub"}<span aria-hidden="true"> ↗</span><span className="sr-only">{newTabLabel}</span></a>
              <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer">{t("home_terminal_enter")}<span aria-hidden="true"> ↗</span><span className="sr-only">{newTabLabel}</span></a>
            </div>
          </div>
          {!!terminalInfo.customFields?.length && (
            <dl className={styles.fields}>
              {terminalInfo.customFields.map((field) => (
                <div key={field.id}>
                  <dt>{field.fieldKey}</dt>
                  <dd>{field.fieldType === "url" ? (
                    <a href={field.fieldValue} target="_blank" rel="noopener noreferrer">{field.fieldValue}<span className="sr-only">{newTabLabel}</span></a>
                  ) : <span data-badge={field.fieldType === "badge"}>{field.fieldValue}</span>}</dd>
                </div>
              ))}
            </dl>
          )}
          {terminalInfo.style?.showEmbed && (
            <iframe src={terminalInfo.url} style={{ height: terminalInfo.style.embedHeight }} title="Terminal" sandbox="allow-scripts allow-same-origin" loading="lazy" />
          )}
        </section>
      )}
    </div>
  );
}
