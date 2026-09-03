"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import { createBorderFaint } from "@/utils/colorMix";
import type {
  ArtistInfoItem,
  HomePageMeta,
  HomeSection,
} from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";

interface HomePageClientProps {
  artistInfo: ArtistInfoItem[];
  homeMeta: HomePageMeta;
  homeSections: HomeSection[];
  terminalInfo: TerminalInfo;
}

export default function HomePageClient({
  artistInfo,
  homeMeta,
  homeSections,
  terminalInfo,
}: HomePageClientProps) {
  const { t } = useTranslation();
  const borderFaint = createBorderFaint();

  const artistName = Array.isArray(artistInfo)
    ? (artistInfo.find(
        (item) => item.key === "Name" || item.key === "이름",
      )?.value ?? "")
    : "";
  const nameParts = artistName.includes("&")
    ? artistName.split("&").map((s) => s.trim())
    : artistName
        .split(" ")
        .map((s) => s.trim())
        .filter(Boolean);

  return (
    <PageLayout
      title={nameParts[0] ?? artistName}
      titleExtra={nameParts.slice(1)}
    >
      <div className="space-y-10">
        <div>
          <p className="font-mono text-xs text-[var(--color-accent)] tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-[var(--color-accent)] animate-pulse"></span>
            {homeMeta.navTitle || t("home_nav_title")}
          </p>
          <div className="border" style={borderFaint}>
            {homeSections.map((section, index) => {
              const numStr = (index + 1).toString().padStart(2, "0");
              return (
                <Link
                  key={index}
                  href={section.path}
                  className="group relative flex min-h-[44px] items-center gap-4 border-b px-4 py-3 last:border-b-0 transition-[background-color] duration-200 hover:bg-[var(--color-accent)]/5"
                  style={borderFaint}
                >
                  <span className="font-mono text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] tracking-widest group-hover:text-[var(--color-accent)] transition-colors shrink-0">
                    [{numStr}]
                  </span>
                  <h2 className="font-mono text-base uppercase tracking-[0.2em] text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors shrink-0">
                    {section.title}
                  </h2>
                  <p className="hidden flex-1 truncate font-mono text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors group-hover:text-[var(--color-secondary)] md:block">
                    {section.description}
                  </p>
                  <i aria-hidden="true" className="ri-arrow-right-line text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)] shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {terminalInfo.url && (
          <div className="pt-8 space-y-6 relative before:absolute before:top-0 before:left-0 before:w-16 before:h-px before:bg-[var(--color-accent)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="font-mono text-xs tracking-widest text-[var(--color-accent)] uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--color-accent)]"></span>
                  {t("home_terminal_side_project")}
                </div>
                <p className="max-w-2xl font-mono text-base leading-relaxed text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
                  {terminalInfo.description}
                </p>
                <p className="font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] uppercase">
                  Archive here / Music hub on stann-web / Live interface on TERMINAL
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="https://stann.kr/lumo" target="_blank" rel="noopener noreferrer" className="group relative inline-flex min-h-[44px] items-center overflow-hidden border border-[var(--color-muted)] px-6 py-3 font-mono text-base tracking-widest text-[var(--color-secondary)] whitespace-nowrap transition-[background-color,border-color,color] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 hover:text-[var(--color-primary)]">
                  <span className="relative z-10 flex items-center gap-2">OPEN MUSIC HUB<i aria-hidden="true" className="ri-arrow-right-up-line"></i></span>
                </a>
                <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer" className="group relative inline-flex min-h-[44px] items-center overflow-hidden border border-[var(--color-accent)] px-6 py-3 font-mono text-base tracking-widest text-[var(--color-accent)] whitespace-nowrap transition-[background-color,color] hover:bg-[var(--color-accent)] hover:text-white">
                  <div className="absolute inset-0 bg-[var(--color-accent)]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10 flex items-center gap-2">{t("home_terminal_enter")} <i aria-hidden="true" className="ri-arrow-right-up-line"></i></span>
                </a>
              </div>
            </div>

            {terminalInfo.customFields && terminalInfo.customFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[var(--color-muted)] border border-[var(--color-muted)] p-[1px]">
                {terminalInfo.customFields.map((field) => (
                  <div key={field.id} className="bg-surface p-4 flex flex-col justify-between space-y-2">
                    <p className="font-mono text-xs tracking-widest text-[var(--color-accent)] uppercase">{field.fieldKey}</p>
                    <div className="font-mono text-base tracking-wider text-[var(--color-primary)] truncate">
                      {field.fieldType === "url" ? (
                        <a href={field.fieldValue} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] hover:underline transition-colors">{field.fieldValue}</a>
                      ) : field.fieldType === "badge" ? (
                        <span className="inline-block border border-[var(--color-accent)] px-2 py-0.5 text-[var(--color-accent)]">{field.fieldValue}</span>
                      ) : <span>{field.fieldValue}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {terminalInfo.style?.showEmbed && (
              <div className="hud-panel p-1">
                <iframe src={terminalInfo.url} style={{ width: "100%", height: terminalInfo.style.embedHeight, border: "none" }} title="Terminal" sandbox="allow-scripts allow-same-origin" loading="lazy" className="bg-black filter grayscale opacity-90 transition-[filter,opacity] hover:grayscale-0 hover:opacity-100" />
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
