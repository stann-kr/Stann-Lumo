"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../contexts/LanguageContext";
import { useContent } from "../../contexts/ContentContext";
import { SITE_NAME, SITE_VERSION, TERMINAL_URL, HUB_URL } from "../../constants/site";
import CursorGlow from "../home/CursorGlow";
import LiveClock from "../home/LiveClock";
import HomeAmbientScene from "./HomeAmbientScene";
import SignalNet from "../base/SignalNet";
import { SELF_NODE_ID } from "../../constants/signalNet";
import { useMotionPreference } from "../../hooks/useMotionPreference";

interface TerminalLayoutProps {
  children: ReactNode;
}

const TerminalLayout = ({ children }: TerminalLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { content, isLoading, isError } = useContent();
  const { isResolved: isMotionPreferenceResolved, prefersReducedMotion } = useMotionPreference();
  const mainRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDialogRef = useRef<HTMLDivElement | null>(null);
  const previousPathnameRef = useRef(pathname);
  const shouldFocusMainRef = useRef(false);
  const wasMobileMenuOpenRef = useRef(false);
  const restoreMobileMenuFocusRef = useRef(true);

  const mainNavigationLabel = language === "ko" ? "주요 탐색" : "Primary navigation";
  const mobileNavigationLabel = language === "ko" ? "모바일 탐색" : "Mobile navigation";
  const skipLinkLabel = language === "ko" ? "본문으로 건너뛰기" : "Skip to main content";
  const disableMotion = !isMotionPreferenceResolved || prefersReducedMotion;

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    restoreMobileMenuFocusRef.current = restoreFocus;
    setMobileMenuOpen(false);
  }, []);

  // pathname 변경 = 네비게이션 완료 → 스피너 해제
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    shouldFocusMainRef.current = true;
  }, [pathname]);

  useEffect(() => {
    if (!shouldFocusMainRef.current || isLoading || isNavigating || isError) return;

    const frame = window.requestAnimationFrame(() => {
      mainRef.current?.focus();
      shouldFocusMainRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isError, isLoading, isNavigating, pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      wasMobileMenuOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        mobileDialogRef.current?.querySelector<HTMLElement>("a[href], button:not(:disabled)")?.focus();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (!wasMobileMenuOpenRef.current) return;

    wasMobileMenuOpenRef.current = false;
    const shouldRestoreFocus = restoreMobileMenuFocusRef.current;
    restoreMobileMenuFocusRef.current = true;
    if (!shouldRestoreFocus) return;

    const frame = window.requestAnimationFrame(() => {
      mobileMenuButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia("(min-width: 1024px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobileMenu();
    };

    desktopBreakpoint.addEventListener("change", handleBreakpointChange);
    return () => desktopBreakpoint.removeEventListener("change", handleBreakpointChange);
  }, [closeMobileMenu]);

  const NAV_ITEMS = [
    { label: t("nav_home"), path: "/" },
    { label: t("nav_about"), path: "/about" },
    { label: t("nav_music"), path: "/music" },
    { label: t("nav_events"), path: "/events" },
    { label: t("nav_gallery"), path: "/archive" },
    { label: t("nav_contact"), path: "/contact" },
    { label: t("nav_link"), path: "/link" },
    { label: "TERMINAL", path: TERMINAL_URL, external: true },
    { label: "HUB", path: HUB_URL, external: true },
  ];

  const artistName = (() => {
    if (!Array.isArray(content.artistInfo)) return SITE_NAME;
    const item = content.artistInfo.find(
      (i) => i.key === "Name" || i.key === "이름",
    );
    return item?.value || SITE_NAME;
  })();

  const handleNavClick = (path: string) => {
    if (path === pathname) {
      closeMobileMenu();
      return;
    }

    setIsNavigating(true);
    closeMobileMenu(false);
  };

  const handleMobileDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = mobileDialogRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[var(--color-primary)] font-sans antialiased flex">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] border border-[var(--color-accent)] bg-[var(--color-bg)] px-4 py-3 font-mono text-sm text-[var(--color-primary)] focus:not-sr-only"
      >
        {skipLinkLabel}
      </a>
      {/* Home desktop에만 저대비 ambient layer를 둔다. */}
      {pathname === "/" && <HomeAmbientScene />}
      {pathname === "/" && !mobileMenuOpen && !disableMotion && <CursorGlow />}

      {/* Desktop Sidebar (HUD Left Panel) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:border-[var(--color-muted)] lg:bg-[var(--color-bg-sidebar)]/80 lg:backdrop-blur-sm z-40">
        {/* HUD Top-Left Branding Container */}
        <div className="hud-crosshair p-8 border-b border-[var(--color-muted)] relative">
          <div className="absolute top-2 left-2 text-xs font-mono text-[var(--color-text-muted)] tracking-widest">
            SYS.ID: {SELF_NODE_ID}
          </div>
          <Link
            href="/"
            onClick={() => handleNavClick("/")}
            className="block mt-4 text-2xl font-bold tracking-[0.2em] text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
          >
            {isLoading ? (
              <span className="opacity-0 select-none">—</span>
            ) : (
              artistName.split(" ").map((word, i) => (
                <span key={i} className="block">
                  {word}
                </span>
              ))
            )}
          </Link>
          <div className="mt-2 text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
            <span aria-hidden="true" className="w-2 h-2 inline-block bg-[var(--color-accent)] mr-2 animate-pulse"></span>
            STATUS: ACTIVE
          </div>
        </div>

        {/* HUD Navigation */}
        <nav aria-label={mainNavigationLabel} className="flex-1 p-6 overflow-y-auto">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item, index) => {
              const isActive =
                !item.external &&
                (item.path === "/"
                  ? pathname === "/"
                  : pathname === item.path ||
                    pathname.startsWith(item.path + "/"));
              const numStr = (index + 1).toString().padStart(2, "0");

              return (
                <li key={item.path}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-11 flex items-center gap-3 px-3 py-2 cursor-pointer group text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        {numStr} /
                      </span>
                      <span className="font-mono text-xs tracking-widest uppercase">
                        {item.label}
                      </span>
                      <i aria-hidden="true" className="ri-external-link-line text-[10px] opacity-0 group-hover:opacity-100 ml-auto transition-opacity"></i>
                    </a>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavClick(item.path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 px-3 py-2 cursor-pointer relative transition-colors ${
                        isActive
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-accent)]"></span>
                      )}
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        {numStr} /
                      </span>
                      <span className="font-mono text-xs tracking-widest uppercase">
                        {item.label}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* HUD Footer (Time & Version) */}
        <div className="p-6 border-t border-[var(--color-muted)] space-y-4">
          <SignalNet />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
              LOCAL TIME
            </span>
            <LiveClock className="text-xs font-mono text-[var(--color-primary)] tracking-widest tabular-nums font-bold" />
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
                VERSION
              </span>
              <span className="text-xs font-mono text-[var(--color-primary)]">
                {SITE_VERSION}
              </span>
            </div>

            {/* Language Toggle HUD */}
            <div className="flex items-center border border-[var(--color-muted)] bg-black">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-label="Switch language to English"
                aria-pressed={language === "en"}
                className={`min-h-11 min-w-11 text-xs font-mono tracking-widest transition-colors ${
                  language === "en"
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                }`}
              >
                EN
              </button>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                |
              </span>
              <button
                type="button"
                onClick={() => setLanguage("ko")}
                aria-label="언어를 한국어로 전환"
                aria-pressed={language === "ko"}
                className={`min-h-11 min-w-11 text-xs font-mono tracking-widest transition-colors ${
                  language === "ko"
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                }`}
              >
                KO
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top HUD Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-muted)]">
        <div className="flex items-center justify-between px-6 h-16 pt-[env(safe-area-inset-top)]">
          <Link
            href="/"
            onClick={() => handleNavClick("/")}
            className="text-lg font-bold font-sans tracking-[0.2em] text-[var(--color-primary)]"
          >
            {isLoading ? "" : artistName}
          </Link>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true)}
            className="w-11 h-11 flex flex-col items-center justify-center gap-[4px] cursor-pointer"
            aria-label={
              mobileMenuOpen ? t("nav_close_menu") : t("nav_open_menu")
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-dialog"
          >
            <span
              aria-hidden="true"
              className={`w-5 h-[1px] bg-[var(--color-primary)] transition-transform duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[5px]" : ""}`}
            ></span>
            <span
              aria-hidden="true"
              className={`w-5 h-[1px] bg-[var(--color-primary)] transition-opacity duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              aria-hidden="true"
              className={`w-5 h-[1px] bg-[var(--color-primary)] transition-transform duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`}
            ></span>
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label={language === "ko" ? "모바일 메뉴 배경을 눌러 닫기" : "Close mobile navigation backdrop"}
              className="fixed inset-0 top-16 z-40 bg-black/70 lg:hidden"
              onClick={() => closeMobileMenu()}
            />
            <div
              ref={mobileDialogRef}
              id="mobile-navigation-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={mobileNavigationLabel}
              className="fixed left-0 right-0 top-16 z-50 border-b border-[var(--color-muted)] bg-[var(--color-bg)] lg:hidden"
              onKeyDown={handleMobileDialogKeyDown}
            >
              <nav aria-label={mobileNavigationLabel}>
                <ul className="space-y-2 px-6 py-4">
            {NAV_ITEMS.map((item, index) => {
              const isActive =
                !item.external &&
                (item.path === "/"
                  ? pathname === "/"
                  : pathname === item.path ||
                    pathname.startsWith(item.path + "/"));
              const numStr = (index + 1).toString().padStart(2, "0");

              return (
                <li key={item.path}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-3 py-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    >
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        {numStr} /
                      </span>
                      <span className="font-mono text-sm tracking-widest uppercase">
                        {item.label}
                      </span>
                      <i aria-hidden="true" className="ri-external-link-line text-xs ml-auto"></i>
                    </a>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavClick(item.path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 py-3 relative ${
                        isActive
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-[-24px] w-1 h-full bg-[var(--color-accent)]"></span>
                      )}
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        {numStr} /
                      </span>
                      <span className="font-mono text-sm tracking-widest uppercase">
                        {item.label}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
                </ul>
              </nav>

              <div className="flex items-center justify-between border-t border-[var(--color-muted)] px-6 py-4">
            <span className="font-mono text-xs text-[var(--color-text-muted)] tracking-widest">
              LANG
            </span>
            <div className="flex">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-label="Switch language to English"
                aria-pressed={language === "en"}
                className={`min-h-11 min-w-11 font-mono text-xs ${language === "en" ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}
              >
                EN
              </button>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                |
              </span>
              <button
                type="button"
                onClick={() => setLanguage("ko")}
                aria-label="언어를 한국어로 전환"
                aria-pressed={language === "ko"}
                className={`min-h-11 min-w-11 font-mono text-xs ${language === "ko" ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}
              >
                KO
              </button>
            </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content (HUD Viewport) */}
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        aria-busy={isLoading || isNavigating}
        className="flex-1 lg:ml-64 relative mobile-header-offset overflow-x-hidden"
      >
        {/* HUD Viewport Brackets at the corners of Main space */}
        <div aria-hidden="true" className="hidden lg:block absolute top-8 left-8 w-4 h-4 border-t border-l border-[var(--color-muted)] pointer-events-none"></div>
        <div aria-hidden="true" className="hidden lg:block absolute top-8 right-8 w-4 h-4 border-t border-r border-[var(--color-muted)] pointer-events-none"></div>
        <div aria-hidden="true" className="hidden lg:block absolute bottom-8 left-8 w-4 h-4 border-b border-l border-[var(--color-muted)] pointer-events-none"></div>
        <div aria-hidden="true" className="hidden lg:block absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[var(--color-muted)] pointer-events-none"></div>

        <AnimatePresence mode="wait">
          {isLoading || isNavigating ? (
            <motion.div
              key="spinner"
              initial={disableMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={disableMotion ? undefined : { opacity: 0 }}
              transition={{ duration: disableMotion ? 0 : 0.15, ease: "easeInOut" }}
              className="min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh] flex items-center justify-center"
            >
              <div className="font-mono text-xs tracking-[0.2em] text-[var(--color-primary)] flex flex-col items-center gap-2">
                <div className="w-8 h-8 border border-[var(--color-primary)] border-t-transparent animate-spin"></div>
                <span className="animate-pulse">FETCHING DATA...</span>
              </div>
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={disableMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={disableMotion ? undefined : { opacity: 0 }}
              transition={{ duration: disableMotion ? 0 : 0.2, ease: "easeInOut" }}
              className="min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh] flex items-center justify-center"
            >
              <div className="font-mono flex flex-col items-center gap-4 text-center px-8">
                <div className="text-xs tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                  SYS.ERR — CONNECTION FAILED
                </div>
                <div className="w-8 h-[1px] bg-[var(--color-muted)]"></div>
                <p className="text-xs text-[var(--color-text-muted)] tracking-widest max-w-xs leading-relaxed">
                  일시적인 서버 오류가 발생했습니다.
                  <br />
                  잠시 후 다시 시도해 주세요.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 min-h-11 border border-[var(--color-muted)] px-6 py-2 text-xs font-mono tracking-[0.2em] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  RETRY
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={pathname}
              initial={disableMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={disableMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: disableMotion ? 0 : 0.2, ease: "easeOut" }}
              className="min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh] p-4 md:p-8 lg:p-12 relative z-10"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TerminalLayout;
