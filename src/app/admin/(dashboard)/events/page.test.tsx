import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentData, PageMeta } from '@/types/content';
import type { RAApiConfigLegacy } from '@/types/admin';
import AdminEventsPage from './page';

const mocks = vi.hoisted(() => ({
  currentEditLanguage: 'en' as 'en' | 'ko',
  updateContent: vi.fn(),
  fetchRaApiConfig: vi.fn(),
  updateRaApiConfig: vi.fn(),
  updatePerformances: vi.fn(),
  updatePageMeta: vi.fn(),
  fetchRaEvents: vi.fn(),
  showNotification: vi.fn(),
}));

const pageMeta = (title: string): PageMeta => ({
  home: { navTitle: 'HOME' },
  music: { title: 'MUSIC', subtitle: '' },
  events: { title, subtitle: '', upcomingTitle: 'UPCOMING', pastTitle: 'PAST' },
  contact: { title: 'CONTACT', subtitle: '', guestbookTitle: '', directTitle: '', bookingTitle: '' },
  link: { title: 'LINK', subtitle: '', terminalTitle: '' },
});

const content = (title: string): ContentData => ({
  artistInfo: [],
  aboutSections: [],
  pageMeta: pageMeta(title),
  homeSections: [],
  tracks: [],
  performances: [],
  eventsInfo: { setDurations: [], technicalRequirements: [], contactEmail: '', responseTime: '' },
  linkPlatforms: [],
  terminalInfo: { url: '', description: '' },
  contactInfo: [],
});

const allContent = {
  en: content('EVENTS EN'),
  ko: content('EVENTS KO'),
};

vi.mock('@/contexts/ContentContext', () => ({
  useContent: () => ({
    allContent,
    updateContent: mocks.updateContent,
    currentEditLanguage: mocks.currentEditLanguage,
  }),
}));

vi.mock('@/services/adminService', () => ({
  fetchRaApiConfig: mocks.fetchRaApiConfig,
  updateRaApiConfig: mocks.updateRaApiConfig,
  updatePerformances: mocks.updatePerformances,
  updatePageMeta: mocks.updatePageMeta,
  uploadEventPoster: vi.fn(),
  deleteEventPoster: vi.fn(),
}));

vi.mock('@/utils/raApi', () => ({
  fetchRAEvents: mocks.fetchRaEvents,
  convertRAEventsToPerformances: vi.fn(() => []),
  sortEventsByDate: vi.fn((items: unknown[]) => items),
}));

vi.mock('@/hooks/useSaveNotification', () => ({
  useSaveNotification: () => ({
    isVisible: false,
    showNotification: mocks.showNotification,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe('AdminEventsPage S1a RA config bridge', () => {
  beforeEach(() => {
    mocks.currentEditLanguage = 'en';
    vi.clearAllMocks();
    mocks.updatePerformances.mockResolvedValue({ success: true });
    mocks.updatePageMeta.mockResolvedValue({ success: true });
    mocks.updateRaApiConfig.mockResolvedValue({ success: true });
  });

  it('loads protected config once, disables save/sync while pending, and preserves it across locale changes', async () => {
    const config: RAApiConfigLegacy = {
      userId: 'user-fixture',
      apiKey: 'test-only-admin-key',
      djId: 'dj-fixture',
      option: '2',
      year: '2026',
    };
    const pending = deferred<{ success: true; data: RAApiConfigLegacy }>();
    mocks.fetchRaApiConfig.mockReturnValue(pending.promise);

    const { rerender } = render(<AdminEventsPage />);

    expect(screen.getByRole('button', { name: 'SAVING...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'events_fetch_from_ra' })).toBeDisabled();
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ success: true, data: config });
      await pending.promise;
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'SAVE CHANGES' })).toBeEnabled();
    });
    expect(screen.getByPlaceholderText('your-api-key')).toHaveValue('test-only-admin-key');

    mocks.currentEditLanguage = 'ko';
    rerender(<AdminEventsPage />);

    expect(screen.getByPlaceholderText('your-api-key')).toHaveValue('test-only-admin-key');
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);
  });

  it('keeps base saves working but never writes RA config after protected load failure', async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'test-only failure' },
    });

    render(<AdminEventsPage />);

    await screen.findByText(/RA API 설정을 불러오지 못했습니다/);
    expect(screen.getByRole('button', { name: 'SAVE CHANGES' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'events_fetch_from_ra' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    await waitFor(() => {
      expect(mocks.updatePerformances).toHaveBeenCalledTimes(1);
      expect(mocks.updatePageMeta).toHaveBeenCalledTimes(1);
    });
    expect(mocks.updateRaApiConfig).not.toHaveBeenCalled();
    expect(mocks.updateContent).toHaveBeenCalledWith({
      performances: [],
      pageMeta: allContent.en.pageMeta,
    });
    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
  });
});
