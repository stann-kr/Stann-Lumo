"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import PageSection from "@/components/base/PageSection";
import type { ContactItem, ContactPageMeta, EventsInfo } from "@/types/content";

interface ContactPageClientProps {
  bookingInfo: EventsInfo;
  contactInfo: ContactItem[];
  contactMeta: ContactPageMeta;
}

export default function ContactPageClient({ bookingInfo, contactInfo, contactMeta }: ContactPageClientProps) {
  const { t } = useTranslation();

  return (
    <PageLayout title={contactMeta.title || t("contact_title")} subtitle={contactMeta.subtitle || t("contact_subtitle")}>
      <PageSection title={contactMeta.directTitle || t("contact_direct")} icon="ri-mail-line">
        <div className="grid md:grid-cols-3 gap-6">
          {contactInfo.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="w-8 h-8 flex items-center justify-center"><i aria-hidden="true" className={`text-lg text-[var(--color-accent)] ${item.icon}`}></i></div>
              <h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{item.label}</h3>
              {item.value.includes("@") ? <a href={`mailto:${item.value}`} className="inline-flex min-h-[44px] items-center text-base text-[color:color-mix(in_srgb,var(--color-secondary)_80%,transparent)] transition-colors hover:text-[var(--color-primary)] cursor-pointer">{item.value}</a> : <p className="text-base text-[color:color-mix(in_srgb,var(--color-secondary)_80%,transparent)]">{item.value}</p>}
            </div>
          ))}
        </div>
      </PageSection>
      <PageSection title={contactMeta.bookingTitle || t("contact_booking_info")} icon="ri-calendar-check-line">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4"><div className="flex items-center gap-2"><i aria-hidden="true" className="ri-time-line text-base text-[var(--color-accent)]"></i><h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{t("events_set_duration")}</h3></div><div className="space-y-2">{bookingInfo.setDurations.map((duration, index) => <p key={index} className="text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">— {duration}</p>)}</div></div>
          <div className="space-y-4"><div className="flex items-center gap-2"><i aria-hidden="true" className="ri-settings-3-line text-base text-[var(--color-accent)]"></i><h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{t("events_technical")}</h3></div><div className="space-y-2">{bookingInfo.technicalRequirements.map((requirement, index) => <p key={index} className="text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">— {requirement}</p>)}</div></div>
          <div className="space-y-4"><div className="flex items-center gap-2"><i aria-hidden="true" className="ri-mail-send-line text-base text-[var(--color-accent)]"></i><h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{t("events_contact")}</h3></div><div className="space-y-3"><a href={`mailto:${bookingInfo.contactEmail}`} className="flex min-h-[44px] items-center text-base text-[color:color-mix(in_srgb,var(--color-secondary)_80%,transparent)] transition-colors hover:text-[var(--color-primary)] cursor-pointer">{bookingInfo.contactEmail}</a><p className="text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">{bookingInfo.responseTime}</p></div></div>
        </div>
      </PageSection>
    </PageLayout>
  );
}
