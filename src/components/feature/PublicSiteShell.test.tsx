import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicSiteShell from './PublicSiteShell';
import HomePageClient from '../public/HomePageClient';

const mocks = vi.hoisted(() => ({
  language: 'en' as 'en' | 'ko',
  pathname: '/archive',
  setLanguage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, onNavigate, ...props }: React.ComponentProps<'a'> & { onNavigate?: unknown }) => (
    <a href={href} {...props} onClick={() => { if (typeof onNavigate === 'function') onNavigate(); }}>{children}</a>
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

describe('PublicSiteShell public navigation', () => {
  beforeEach(() => {
    mocks.language = 'en';
    mocks.pathname = '/archive';
    mocks.setLanguage.mockReset();
    desktopBreakpointListeners.clear();
    matchMedia.mockClear();
    vi.stubGlobal('matchMedia', matchMedia);
  });

  it('provides a skip link and exposes the current route to assistive technology', () => {
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: /ARCHIVE$/ })).toHaveAttribute('aria-current', 'page');
  });

  it('traps mobile navigation focus and restores the trigger after closing it', async () => {
    const user = userEvent.setup();
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

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
    await waitFor(() => expect(screen.getByRole('link', { name: 'STANN LUMO' })).toHaveFocus());
    screen.getByRole('main').focus();
    act(() => {
      for (const listener of desktopBreakpointListeners) listener({ matches: true } as MediaQueryListEvent);
    });
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('moves focus to main content after a public route transition', async () => {
    const { rerender } = render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    mocks.pathname = '/music';
    rerender(<PublicSiteShell><h1>Music</h1></PublicSiteShell>);

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('keeps background content inert only while the mobile dialog is open', async () => {
    const user = userEvent.setup();
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);
    const main = screen.getByRole('main');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(main.closest('[inert]')).not.toBeNull();
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'HOME' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(main.closest('[inert]')).toBeNull();
  });
});

const sections = ['About', 'Music', 'Events', 'Archive', 'Contact', 'Link'].map((title) => ({
  title, description: `${title} description`, path: `/${title.toLowerCase()}`, icon: '',
}));

describe('Home panels', () => {
  it('keeps CMS order and separates keyboard expansion from route links', async () => {
    const user = userEvent.setup();
    render(<HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={sections} previews={{ tracks: [{ id: 'track', title: 'Real track', type: 'Original', year: '2026' }], events: [], photos: [{ id: 'poster', caption: 'Real poster', altText: 'Poster' }] }} terminalInfo={{ url: '', description: '' }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STANN LUMO');
    expect(screen.getAllByRole('button').map((button) => button.textContent?.replace(/[+−]/g, ''))).toEqual(['About', 'Music', 'Events', 'Archive']);
    expect(screen.getByRole('link', { name: /Explore Music/ })).toHaveAttribute('href', '/music');
    expect(screen.getByText('Real track')).toBeVisible();
    expect(screen.queryByRole('link', { name: /Explore Archive/ })).not.toBeInTheDocument();
    const archive = screen.getByRole('button', { name: 'Archive' });
    archive.focus();
    await user.keyboard('{Enter}');
    expect(archive).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Explore Archive/ })).toHaveAttribute('href', '/archive');
    expect(screen.getByRole('link', { name: 'Real poster' })).toHaveAttribute('href', '/archive/poster');
    expect(screen.getByRole('img', { name: 'Poster' })).toHaveAttribute('src', '/api/media/poster?v=2');
    expect(screen.queryByRole('link', { name: /Explore Music/ })).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(archive).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Explore Archive/ })).not.toBeInTheDocument();
    for (const title of ['Contact', 'Link']) expect(screen.getByRole('link', { name: new RegExp(`${title} ${title} description`) })).toHaveAttribute('href', `/${title.toLowerCase()}`);
  });

  it('preserves actual Terminal fields, URL and optional embed without inventing home items', () => {
    render(<HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={[]} terminalInfo={{
      url: 'https://terminal.example', description: 'Live interface',
      customFields: [{ id: 'one', fieldKey: 'Set', fieldValue: 'Live', fieldType: 'badge', sortOrder: 0 }],
      style: { fontSize: 'md', animationSpeed: 'normal', promptText: '>', showEmbed: true, embedHeight: '420px' },
    }} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home_terminal_enter/ })).toHaveAttribute('href', 'https://terminal.example');
    expect(screen.getByTitle('Terminal')).toHaveAttribute('src', 'https://terminal.example');
    expect(screen.getByTitle('Terminal')).toHaveStyle({ height: '420px' });
  });
});
