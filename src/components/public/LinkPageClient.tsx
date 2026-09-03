"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import PageSection from "@/components/base/PageSection";
import { createBorderFaint, createBorderMid } from "@/utils/colorMix";
import type { LinkPageMeta, LinkPlatform } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";

interface LinkPageClientProps {
  linkMeta: LinkPageMeta;
  linkPlatforms: LinkPlatform[];
  terminalInfo: TerminalInfo;
}

export default function LinkPageClient({ linkMeta, linkPlatforms, terminalInfo }: LinkPageClientProps) {
  const { t } = useTranslation();
  const borderMid = createBorderMid();
  const borderFaint = createBorderFaint();

  return (
    <PageLayout title={linkMeta.title || t("link_title")} subtitle={linkMeta.subtitle || t("link_subtitle")}>
      {terminalInfo.url && (
        <div>
          <p className="mb-3 text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">{t("link_side_project")}</p>
          <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer" className="group relative flex min-h-[44px] w-full items-center justify-between overflow-hidden border p-7 transition-[background-color] duration-300 hover:bg-[var(--color-accent)]/5 cursor-pointer" style={borderMid}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent opacity-25 transition-opacity duration-500 group-hover:opacity-55"></div><div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent opacity-25 transition-opacity duration-500 group-hover:opacity-55"></div></div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 flex items-center justify-center border transition-colors duration-300 shrink-0" style={borderMid}><i aria-hidden="true" className="ri-terminal-box-line text-2xl text-[var(--color-accent)] transition-colors duration-300 group-hover:text-[var(--color-secondary)]"></i></div>
              <div><h3 className="text-base font-bold text-[var(--color-secondary)] tracking-widest transition-colors duration-300 group-hover:text-[var(--color-primary)]">{linkMeta.terminalTitle || "TERMINAL.STANN.KR"}</h3><p className="mt-1.5 text-base leading-relaxed text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors duration-300 group-hover:text-[var(--color-secondary)]">{terminalInfo.description}</p></div>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-2 text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors duration-300 group-hover:text-[var(--color-secondary)]"><span className="text-xs tracking-widest hidden sm:block">{t("link_enter")}</span><i aria-hidden="true" className="ri-arrow-right-up-line text-base transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"></i></div>
          </a>
        </div>
      )}
      <PageSection title={t("link_platforms") || "PLATFORMS"} icon="ri-links-line" noPadding>
        <div className="grid md:grid-cols-3 gap-[1px]">
          {linkPlatforms.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="group relative min-h-[44px] overflow-hidden p-6 transition-[background-color] duration-300 hover:bg-[var(--color-accent)]/5 cursor-pointer">
              <div className="relative space-y-4"><div className="w-10 h-10 flex items-center justify-center"><i aria-hidden="true" className={`${link.icon} text-2xl text-[var(--color-accent)] transition-colors duration-300 group-hover:text-[var(--color-secondary)]`}></i></div><h3 className="text-base font-semibold text-[var(--color-secondary)] tracking-widest transition-colors duration-300 group-hover:text-[var(--color-primary)]">{link.platform}</h3><p className="text-base leading-relaxed text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors duration-300 group-hover:text-[var(--color-secondary)]">{link.description}</p><div className="flex items-center gap-2 text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors duration-300 group-hover:text-[var(--color-secondary)]"><span className="text-xs tracking-widest">{t("link_visit")}</span><i aria-hidden="true" className="ri-arrow-right-line text-xs transition-transform duration-300 group-hover:translate-x-1"></i></div></div>
            </a>
          ))}
        </div>
      </PageSection>
      <div className="pt-6 border-t" style={borderFaint}><p className="text-center text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">{t("link_footer_note")} <a href="/contact" className="inline-flex min-h-[44px] items-center text-[var(--color-secondary)] transition-colors hover:text-[var(--color-primary)] cursor-pointer underline underline-offset-4">{t("link_footer_contact")}</a>.</p></div>
    </PageLayout>
  );
}
