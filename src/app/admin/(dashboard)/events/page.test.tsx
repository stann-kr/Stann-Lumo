import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentData, PageMeta } from '@/types/content';
import type { RAApiConfigView } from '@/types/admin';
import { AdminEditGuardProvider } from '@/contexts/AdminEditGuardContext';
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

const renderPage = () => render(
  <AdminEditGuardProvider>
    <AdminEventsPage />
  </AdminEditGuardProvider>,
);

describe('AdminEventsPage masked RA config boundary', () => {
  beforeEach(() => {
    mocks.currentEditLanguage = 'en';
    vi.clearAllMocks();
    mocks.updatePerformances.mockResolvedValue({ success: true });
    mocks.updatePageMeta.mockResolvedValue({ success: true });
    mocks.updateRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: 'user-fixture',
        djId: 'dj-fixture',
        option: '2',
        year: '2026',
        hasApiKey: true,
      },
    });
    mocks.fetchRaEvents.mockResolvedValue({ events: [] });
  });

  it('loads protected config once, disables save/sync while pending, and preserves it across locale changes', async () => {
    const config: RAApiConfigView = {
      userId: 'user-fixture',
      djId: 'dj-fixture',
      option: '2',
      year: '2026',
      hasApiKey: true,
    };
    const pending = deferred<{ success: true; data: RAApiConfigView }>();
    mocks.fetchRaApiConfig.mockReturnValue(pending.promise);

    const { rerender } = renderPage();

    const pendingSaveButton = screen.getByRole('button', { name: 'SAVE CHANGES' });
    expect(pendingSaveButton).toBeDisabled();
    expect(pendingSaveButton).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: 'events_fetch_from_ra' })).toBeDisabled();
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ success: true, data: config });
      await pending.promise;
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'SAVE CHANGES' })).toBeEnabled();
    });
    const apiKeyInput = screen.getByLabelText('events_api_key');
    expect(apiKeyInput).toHaveValue('');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    expect(apiKeyInput).toHaveAttribute('autocomplete', 'new-password');
    expect(apiKeyInput).toHaveAccessibleDescription('API 키 저장됨');
    expect(screen.getByText('API 키 저장됨')).toBeInTheDocument();

    mocks.currentEditLanguage = 'ko';
    rerender(
      <AdminEditGuardProvider>
        <AdminEventsPage />
      </AdminEditGuardProvider>,
    );

    expect(screen.getByLabelText('events_api_key')).toHaveValue('');
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);
  });

  it('keeps base saves working but never writes RA config after protected load failure', async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'test-only failure' },
    });

    renderPage();

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

  it('requires a missing key to be saved before RA sync becomes available', async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: 'user-fixture',
        djId: 'dj-fixture',
        option: '2',
        year: '2026',
        hasApiKey: false,
      },
    });

    renderPage();

    const syncButton = await screen.findByRole('button', { name: 'events_fetch_from_ra' });
    expect(syncButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('events_api_key'), {
      target: { value: 'test-only-replacement-key' },
    });
    expect(syncButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    await waitFor(() => {
      expect(mocks.updateRaApiConfig).toHaveBeenCalledWith({
        userId: 'user-fixture',
        djId: 'dj-fixture',
        option: '2',
        year: '2026',
        apiKey: 'test-only-replacement-key',
      });
      expect(syncButton).toBeEnabled();
    });

    fireEvent.click(syncButton);
    await waitFor(() => {
      expect(mocks.fetchRaEvents).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps ordinary event saves working when the RA connection has no key', async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: 'user-fixture',
        djId: 'dj-fixture',
        option: '2',
        year: '2026',
        hasApiKey: false,
      },
    });

    renderPage();
    await screen.findByText('저장된 API 키 없음');

    fireEvent.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    await waitFor(() => {
      expect(mocks.updatePerformances).toHaveBeenCalledTimes(1);
      expect(mocks.updatePageMeta).toHaveBeenCalledTimes(1);
    });
    expect(mocks.updateRaApiConfig).not.toHaveBeenCalled();
    expect(mocks.fetchRaEvents).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
  });

  it('locks RA credential controls while a config save is pending', async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: 'user-fixture',
        djId: 'dj-fixture',
        option: '2',
        year: '2026',
        hasApiKey: true,
      },
    });
    const pending = deferred<{
      success: true;
      data: RAApiConfigView;
    }>();
    mocks.updateRaApiConfig.mockReturnValue(pending.promise);

    renderPage();
    await screen.findByText('API 키 저장됨');

    fireEvent.change(screen.getByLabelText('events_api_key'), {
      target: { value: 'test-only-replacement-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    await waitFor(() => {
      expect(mocks.updateRaApiConfig).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByLabelText('events_api_userid')).toBeDisabled();
    expect(screen.getByLabelText('events_api_key')).toBeDisabled();
    expect(screen.getByLabelText('events_api_option')).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '저장된 API 키 제거' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'events_fetch_from_ra' })).toBeDisabled();

    await act(async () => {
      pending.resolve({
        success: true,
        data: {
          userId: 'user-fixture',
          djId: 'dj-fixture',
          option: '2',
          year: '2026',
          hasApiKey: true,
        },
      });
      await pending.promise;
    });

    await waitFor(() => {
      expect(screen.getByLabelText('events_api_key')).toBeEnabled();
    });
  });

  it('does not show a success state when the masked config update fails', async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: 'user-fixture',
        djId: 'dj-fixture',
        option: '2',
        year: '2026',
        hasApiKey: true,
      },
    });
    mocks.updateRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'test-only failure' },
    });

    renderPage();
    await screen.findByText('API 키 저장됨');

    fireEvent.change(screen.getByLabelText('events_api_option'), {
      target: { value: '3' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'SAVE CHANGES' }));

    await screen.findByText(/RA API CONFIG 저장에 실패했습니다/);
    expect(mocks.showNotification).not.toHaveBeenCalled();
    expect(mocks.updateContent).not.toHaveBeenCalled();
    expect(screen.getByLabelText('events_api_option')).toHaveValue('3');
  });
});
