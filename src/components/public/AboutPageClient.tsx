"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import type { ArtistInfoItem, DynamicSection } from "@/capabilities/content/content";
import styles from "./AboutPageClient.module.css";

interface AboutPageClientProps { artistInfo: ArtistInfoItem[]; aboutSections: DynamicSection[]; }

export default function AboutPageClient({ artistInfo, aboutSections }: AboutPageClientProps) {
  const { t } = useTranslation();
  const sortedSections = [...aboutSections].sort((a, b) => a.order - b.order);
  return (
    <PageLayout title={t("about_title")}>
      <div className={styles.about}>
        {artistInfo.length > 0 && <dl className={styles.facts}>
          {artistInfo.map((info) => <div key={info.id}><dt>{info.key}</dt><dd>{info.value}</dd></div>)}
        </dl>}
        <div className={styles.prose}>
          {sortedSections.map((section) => (
            <section key={section.id}>
              <h2>{section.title}</h2>
              {section.type === "paragraphs" && (section.paragraphs ?? []).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.type === "philosophy-items" && (section.items ?? []).map((item) => (
                <div key={item.id} className={styles.philosophy}>
                  {item.quote && <blockquote>{item.quote}</blockquote>}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
