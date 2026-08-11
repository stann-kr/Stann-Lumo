"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useContent } from "@/contexts/ContentContext";
import PageLayout from "@/components/feature/PageLayout";
import { createBorderFaint } from "@/utils/colorMix";
const MusicPage = () => {
  const { t } = useTranslation();
  const { musicContent, content } = useContent();
  const borderFaint = createBorderFaint();

  return (
    <PageLayout
      title={content.pageMeta?.music?.title || t("music_title")}
      subtitle={content.pageMeta?.music?.subtitle || t("music_subtitle")}
    >
      <div className="mb-6 border p-4 md:p-5 space-y-3" style={borderFaint}>
        <div className="font-mono text-xs tracking-widest text-[var(--color-accent)] uppercase">
          MUSIC ECOSYSTEM
        </div>
        <p className="text-base leading-relaxed text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
          이 페이지는 Stann Lumo archive입니다. 더 넓은 음악 허브는 stann-web에서,
          현장 중심 라이브 인터페이스는 TERMINAL에서 이어집니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://stann.kr/lumo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 border px-3 py-1 font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-[background-color,color] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-secondary)]"
            style={borderFaint}
          >
            OPEN MUSIC HUB
          </a>
          <a
            href="https://terminal.stann.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 border px-3 py-1 font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-[background-color,color] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-secondary)]"
            style={borderFaint}
          >
            OPEN LIVE INTERFACE
          </a>
        </div>
      </div>

      {/* Track List - Database Log Style */}
      <div className="border border-[var(--color-muted)] p-[1px] flex flex-col gap-[1px] overflow-x-hidden">
        {/* Header Row */}
        <div className="hidden md:flex items-center px-4 py-2 bg-surface font-mono text-xs tracking-widest text-[var(--color-accent)] uppercase">
          <div className="w-16">{t("music_col_id")}</div>
          <div className="flex-1">{t("music_col_title")}</div>
          <div className="w-24">{t("music_col_type")}</div>
          <div className="w-16">{t("music_col_yr")}</div>
          <div className="w-32 text-right">{t("music_col_action")}</div>
        </div>

        {musicContent.tracks.map((track, idx) => {
          const idStr = (idx + 1).toString().padStart(3, "0");
          return (
            <div
              key={track.id}
              className="group bg-surface relative overflow-hidden transition-colors hover:bg-[var(--color-accent)]/5 flex flex-col md:flex-row md:items-center px-4 py-4 md:py-3 gap-3 md:gap-0"
            >
              <div className="hidden w-16 font-mono text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors group-hover:text-[var(--color-accent)] md:block">
                {idStr}
              </div>

              <div className="flex-1 w-full min-w-0 pr-4">
                <div className="flex items-center gap-2 md:hidden mb-2">
                  <span className="font-mono text-xs text-[var(--color-accent)]">
                    [{idStr}]
                  </span>
                </div>
                <h3 className="font-mono text-base tracking-widest text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors uppercase truncate">
                  {track.title}
                </h3>
              </div>

              <div className="hidden md:block w-24 font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
                {`[${track.type}]`}
              </div>

              <div className="hidden md:block w-16 font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
                {track.year}
              </div>

              <div className="md:w-32 md:text-right mt-2 md:mt-0">
                <a
                  href={track.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 border px-3 py-1 font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-[background-color,color] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-secondary)]"
                  style={borderFaint}
                >
                  <i aria-hidden="true" className="ri-play-fill text-xs"></i>
                  {track.platform.toUpperCase()}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div className="pt-6 border-t" style={borderFaint}>
        <p className="text-base leading-relaxed text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
          {t("music_note")}
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center font-mono text-xs tracking-widest text-[var(--color-accent)] transition-colors hover:text-[var(--color-primary)] uppercase"
          >
            Return to artist archive root
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default MusicPage;
