"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useContent } from "@/contexts/ContentContext";
import PageLayout from "@/components/feature/PageLayout";
import { createBorderMid } from "@/utils/colorMix";

const EventsPage = () => {
  const { t } = useTranslation();
  const { eventsContent, content } = useContent();
  const borderMid = createBorderMid();

  const [visiblePastCount, setVisiblePastCount] = useState(10);

  // YYYY.MM.DD (RA) / YYYY-MM-DD (수동) 양쪽 형식 지원
  const parseEventDate = (dateStr: string): Date => {
    const normalized = dateStr.replace(/\./g, "-");
    return new Date(normalized);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = eventsContent.performances.filter((event) => {
    const eventDate = parseEventDate(event.date);
    return eventDate >= today;
  });

  const pastEvents = eventsContent.performances.filter((event) => {
    const eventDate = parseEventDate(event.date);
    return eventDate < today;
  });

  const visiblePastEvents = pastEvents.slice(0, visiblePastCount);
  const hasMorePastEvents = pastEvents.length > visiblePastCount;

  const handleLoadMore = () => {
    setVisiblePastCount((prev) => prev + 10);
  };

  return (
    <PageLayout
      title={content.pageMeta?.events?.title || t("events_title")}
      subtitle={content.pageMeta?.events?.subtitle || t("events_subtitle")}
    >
      {/* Upcoming Events */}
      <div className="space-y-6">
        <h2 className="text-base font-mono font-semibold text-[var(--color-accent)] tracking-widest">
          {content.pageMeta?.events?.upcomingTitle || t("events_upcoming")}
        </h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
            {t("msg_no_items")}
          </p>
        ) : (
          <div className="border border-[var(--color-muted)] p-[1px] flex flex-col gap-[1px]">
            {upcomingEvents.map((event, idx) => {
              const idStr = (idx + 1).toString().padStart(3, "0");
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="bg-surface group relative min-h-11 overflow-hidden transition-colors hover:bg-[var(--color-accent)]/5 flex flex-col md:flex-row md:items-center p-4 gap-4"
                >
                  <div className="hidden w-8 font-mono text-xs text-[var(--color-accent)] md:block">
                    [{idStr}]
                  </div>

                  {event.posterImageId && (
                    <div className="w-12 h-12 bg-black border border-[var(--color-muted)] shrink-0 overflow-hidden relative">
                      <div className="absolute inset-0 bg-[var(--color-accent)] opacity-20 mix-blend-overlay"></div>
                      <img
                        src={`/api/media/${event.posterImageId}`}
                        alt={event.title}
                        className="w-full h-full object-cover filter grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono text-base tracking-[0.1em] text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors uppercase truncate mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] uppercase">
                      <span>{event.venue}</span>
                      {event.location && (
                        <>
                          <span className="text-[var(--color-muted)]">/</span>
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center shrink-0 md:w-32 font-mono">
                    <p className="text-base text-[var(--color-primary)] tracking-widest mb-1">
                      {event.date}
                    </p>
                    {event.time && (
                      <p className="text-xs text-[var(--color-accent)] tracking-widest">
                        {event.time}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div className="space-y-6 pt-8 relative before:absolute before:top-0 before:left-0 before:w-16 before:h-px before:bg-[var(--color-accent)]">
        <h2 className="text-base font-mono font-semibold text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] tracking-widest">
          {content.pageMeta?.events?.pastTitle || t("events_past")}
        </h2>

        {pastEvents.length === 0 ? (
          <p className="font-mono text-base text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)]">
            {t("msg_no_items")}
          </p>
        ) : (
          <>
            <div className="border border-[var(--color-muted)] p-[1px] flex flex-col gap-[1px]">
              {visiblePastEvents.map((event, idx) => {
                const idStr = (idx + 1).toString().padStart(3, "0");
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                  className="bg-surface group relative min-h-11 overflow-hidden transition-colors hover:bg-[var(--color-muted)] flex flex-col md:flex-row md:items-center p-4 gap-4"
                  >
                    <div className="hidden w-8 font-mono text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] md:block">
                      [{idStr}]
                    </div>

                    {event.posterImageId && (
                      <div className="w-10 h-10 bg-black border border-[var(--color-muted)]/50 shrink-0 overflow-hidden">
                        <img
                          src={`/api/media/${event.posterImageId}`}
                          alt={event.title}
                          className="w-full h-full object-cover filter grayscale opacity-50 transition-[filter,opacity] duration-300 group-hover:opacity-100"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono text-base tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] transition-colors group-hover:text-[var(--color-primary)] uppercase truncate mb-1">
                        {event.title}
                      </h3>
                      <div className="font-mono text-xs tracking-widest text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] uppercase truncate">
                        {event.venue} {event.location && `/ ${event.location}`}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center shrink-0 w-32 font-mono">
                      <p className="text-xs text-[color:color-mix(in_srgb,var(--color-secondary)_72%,transparent)] tracking-widest">
                        {event.date}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasMorePastEvents && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="min-h-[44px] border px-8 py-3 text-base tracking-widest text-[var(--color-secondary)] transition-opacity duration-300 hover:opacity-80 cursor-pointer whitespace-nowrap"
                  style={borderMid}
                >
                  {t("events_load_more")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default EventsPage;
