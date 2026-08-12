import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TerminalLayout from './TerminalLayout';

const mocks = vi.hoisted(() => ({
  language: 'en' as 'en' | 'ko',
  pathname: '/archive',
  setLanguage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      nav_about: 'ABOUT',
      nav_archive: 'ARCHIVE',
      nav_close_menu: 'Close menu',
      nav_contact: 'CONTACT',
      nav_events: 'EVENTS',
      nav_gallery: 'ARCHIVE',
      nav_home: 'HOME',
      nav_link: 'LINK',
      nav_music: 'MUSIC',
      nav_open_menu: 'Open menu',
    })[key] ?? key,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: mocks.language,
    setLanguage: mocks.setLanguage,
  }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div {...(props as React.ComponentProps<'div'>)}>{children}</div>,
  },
}));

vi.mock('../home/CursorGlow', () => ({ default: () => null }));
vi.mock('../home/LiveClock', () => ({ default: () => <span>12:00</span> }));
vi.mock('./HomeAmbientScene', () => ({ default: () => <span data-testid="home-ambient-scene" /> }));
vi.mock('../base/SignalNet', () => ({ default: () => null }));

const desktopBreakpointListeners = new Set<(event: MediaQueryListEvent) => void>();
const matchMedia = vi.fn(() => ({
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
    if (type === 'change' && typeof listener === 'function') {
      desktopBreakpointListeners.add(listener as (event: MediaQueryListEvent) => void);
    }
  },
  matches: false,
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
    if (type === 'change' && typeof listener === 'function') {
      desktopBreakpointListeners.delete(listener as (event: MediaQueryListEvent) => void);
    }
  },
}));

describe('TerminalLayout public navigation', () => {
  beforeEach(() => {
    mocks.language = 'en';
    mocks.pathname = '/archive';
    mocks.setLanguage.mockReset();
    desktopBreakpointListeners.clear();
    matchMedia.mockClear();
    vi.stubGlobal('matchMedia', matchMedia);
  });

  it('provides a skip link and exposes the current route to assistive technology', () => {
    render(<TerminalLayout><h1>Archive</h1></TerminalLayout>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: /ARCHIVE$/ })).toHaveAttribute('aria-current', 'page');
  });

  it('traps mobile navigation focus and restores the trigger after closing it', async () => {
    const user = userEvent.setup();
    render(<TerminalLayout><h1>Archive</h1></TerminalLayout>);

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    await user.click(menuButton);

    const dialog = await screen.findByRole('dialog', { name: 'Mobile navigation' });
    const firstLink = within(dialog).getByRole('link', { name: /HOME$/ });
    await waitFor(() => expect(firstLink).toHaveFocus());

    const lastControl = within(dialog).getByRole('button', { name: '언어를 한국어로 전환' });
    lastControl.focus();
    await user.tab();
    expect(firstLink).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());

    await user.click(menuButton);
    await screen.findByRole('dialog', { name: 'Mobile navigation' });
    await user.click(screen.getByRole('button', { name: 'Close mobile navigation backdrop' }));
    await waitFor(() => expect(menuButton).toHaveFocus());

    await user.click(menuButton);
    await screen.findByRole('dialog', { name: 'Mobile navigation' });
    act(() => {
      for (const listener of desktopBreakpointListeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());
  });

  it('moves focus to main content after a public route transition', async () => {
    const { rerender } = render(<TerminalLayout><h1>Archive</h1></TerminalLayout>);

    mocks.pathname = '/music';
    rerender(<TerminalLayout><h1>Music</h1></TerminalLayout>);

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('keeps the optional ambient scene available across public routes', () => {
    mocks.pathname = '/';
    const { rerender } = render(<TerminalLayout><h1>Home</h1></TerminalLayout>);

    expect(screen.getByTestId('home-ambient-scene')).toBeInTheDocument();

    mocks.pathname = '/archive';
    rerender(<TerminalLayout><h1>Archive</h1></TerminalLayout>);

    expect(screen.getByTestId('home-ambient-scene')).toBeInTheDocument();
  });
});
