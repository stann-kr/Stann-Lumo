"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import PageSection from "@/components/base/PageSection";
import { createBorderFaint, createBorderMid } from "@/utils/colorMix";
import type { ArtistInfoItem, DynamicSection } from "@/types/content";

interface AboutPageClientProps {
  artistInfo: ArtistInfoItem[];
  aboutSections: DynamicSection[];
}

export default function AboutPageClient({ artistInfo, aboutSections }: AboutPageClientProps) {
  const { t } = useTranslation();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();
  const sortedSections = [...aboutSections].sort((a, b) => a.order - b.order);

  return (
    <PageLayout title={t("about_title")}>
      {artistInfo.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {artistInfo.map((info) => (
            <div key={info.id} className="p-4 border bg-surface" style={borderFaint}>
              <p className="text-sm font-mono text-[var(--color-accent)] mb-2 tracking-widest">{info.key}</p>
              <p className="text-base text-[var(--color-secondary)] font-medium">{info.value}</p>
            </div>
          ))}
        </div>
      )}
      {sortedSections.map((section) => (
        <PageSection key={section.id} title={section.title}>
          {section.type === "paragraphs" && (
            <div className="space-y-4 text-[var(--color-text-muted)] leading-relaxed text-base">
              {(section.paragraphs ?? []).map((para, index) => <p key={index}>{para}</p>)}
            </div>
          )}
          {section.type === "philosophy-items" && (
            <div className="space-y-6">
              {(section.items ?? []).map((item) => (
                <div key={item.id}>
                  <blockquote className="pl-4 border-l text-[var(--color-text-muted)] italic text-lg leading-relaxed mb-4" style={borderMid}>{item.quote}</blockquote>
                  <p className="text-base text-[var(--color-text-muted)] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </PageSection>
      ))}
    </PageLayout>
  );
}
