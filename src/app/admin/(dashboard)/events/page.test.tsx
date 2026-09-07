import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminEditGuardProvider } from "@/capabilities/admin/AdminEditGuard";
import type { ContentData, PageMeta } from "@/capabilities/content/content";
import type { RAApiConfigView } from "@/capabilities/events/raConfig";
import AdminEventsPage from "./page";

const mocks = vi.hoisted(() => ({
  currentEditLanguage: "en" as "en" | "ko",
  fetchPerformancesSnapshot: vi.fn(),
  fetchRaApiConfig: vi.fn(),
  fetchRaSyncStatus: vi.fn(),
  updatePerformances: vi.fn(),
  updateRaApiConfig: vi.fn(),
  runRaSync: vi.fn(),
  updatePageMeta: vi.fn(),
  updateContent: vi.fn(),
  showNotification: vi.fn(),
}));

const pageMeta = (title: string): PageMeta => ({
  home: { navTitle: "HOME" },
  music: { title: "MUSIC", subtitle: "" },
  events: { title, subtitle: "", upcomingTitle: "UPCOMING", pastTitle: "PAST" },
  contact: {
    title: "CONTACT",
    subtitle: "",
    guestbookTitle: "",
    directTitle: "",
    bookingTitle: "",
  },
  link: { title: "LINK", subtitle: "", terminalTitle: "" },
});

const content = (title: string): ContentData => ({
  artistInfo: [],
  aboutSections: [],
  pageMeta: pageMeta(title),
  homeSections: [],
  tracks: [],
  performances: [],
  eventsInfo: {
    setDurations: [],
    technicalRequirements: [],
    contactEmail: "",
    responseTime: "",
  },
  linkPlatforms: [],
  terminalInfo: { url: "", description: "" },
  contactInfo: [],
});

const allContent = { en: content("EVENTS EN"), ko: content("EVENTS KO") };

vi.mock("@/contexts/ContentContext", () => ({
  useContent: () => ({
    allContent,
    currentEditLanguage: mocks.currentEditLanguage,
    isLoading: false,
    updateContent: mocks.updateContent,
  }),
}));
vi.mock("@/capabilities/content/contentAdmin.client", () => ({
  updatePageMeta: mocks.updatePageMeta,
}));
vi.mock("@/capabilities/events/eventsAdmin.client", () => ({
  fetchPerformancesSnapshot: mocks.fetchPerformancesSnapshot,
  fetchRaApiConfig: mocks.fetchRaApiConfig,
  fetchRaSyncStatus: mocks.fetchRaSyncStatus,
  updatePerformances: mocks.updatePerformances,
  updateRaApiConfig: mocks.updateRaApiConfig,
  uploadEventPoster: vi.fn(),
  deleteEventPoster: vi.fn(),
  runRaSync: mocks.runRaSync,
  restoreRaEventExclusion: vi.fn(),
}));
vi.mock("@/capabilities/events/raApi.client", () => ({
  sortEventsByDate: vi.fn((items: unknown[]) => items),
}));
vi.mock("@/capabilities/admin/useSaveNotification", () => ({
  useSaveNotification: () => ({
    isVisible: false,
    showNotification: mocks.showNotification,
  }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderPage = () =>
  render(
    <AdminEditGuardProvider>
      <AdminEventsPage />
    </AdminEditGuardProvider>,
  );

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe("AdminEventsPage performance snapshots", () => {
  beforeEach(() => {
    mocks.currentEditLanguage = "en";
    vi.clearAllMocks();
    mocks.fetchPerformancesSnapshot.mockResolvedValue({
      success: true,
      data: {
        revision: 3,
        items: [
          {
            id: "ra-1",
            title: "Original",
            date: "2026-09-01",
            venue: "Venue",
            status: "Announced",
          },
        ],
      },
    });
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: { userId: "1", djId: "2", option: "1", year: "", hasApiKey: true },
    });
    mocks.fetchRaSyncStatus.mockResolvedValue({
      success: true,
      data: {
        lastStatus: "never",
        lastStartedAt: null,
        lastCompletedAt: null,
        lastSuccessAt: null,
        lastErrorCode: null,
        fetched: 0,
        inserted: 0,
        skippedExcluded: 0,
        nextScheduledAt: 0,
        nextRetryAt: null,
        exclusions: [],
      },
    });
    mocks.updatePageMeta.mockResolvedValue({ success: true });
    mocks.updatePerformances.mockResolvedValue({
      success: true,
      data: {
        revision: 4,
        items: [
          {
            id: "ra-1",
            title: "Original",
            date: "2026-09-01",
            venue: "Venue",
            status: "Announced",
          },
        ],
      },
    });
    mocks.updateRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "1",
        djId: "2",
        option: "1",
        year: "",
        hasApiKey: true,
      },
    });
    mocks.runRaSync.mockResolvedValue({
      success: true,
      data: {
        result: {
          kind: "success",
          fetched: 1,
          inserted: 0,
          skippedExcluded: 0,
        },
        status: {
          lastStatus: "success",
          lastStartedAt: 0,
          lastCompletedAt: 0,
          lastSuccessAt: 0,
          lastErrorCode: null,
          fetched: 1,
          inserted: 0,
          skippedExcluded: 0,
          nextScheduledAt: 0,
          nextRetryAt: null,
          exclusions: [],
        },
      },
    });
  });

  it("keeps the edited event visible after a stale revision conflict", async () => {
    mocks.updatePerformances.mockResolvedValue({
      success: false,
      error: { code: "CONFLICT", message: "stale" },
    });
    renderPage();
    const title = await screen.findByLabelText("TITLE");
    fireEvent.change(title, { target: { value: "My draft" } });
    fireEvent.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    await screen.findByText(/현재 입력은 유지됩니다/);
    expect(screen.getByLabelText("TITLE")).toHaveValue("My draft");
    expect(
      screen.getByRole("button", { name: /최신 이벤트 목록/ }),
    ).toBeInTheDocument();
  });

  it("uses the selected locale page settings only while no draft is dirty", async () => {
    const view = renderPage();
    expect(await screen.findByDisplayValue("EVENTS EN")).toBeInTheDocument();
    mocks.currentEditLanguage = "ko";
    view.rerender(
      <AdminEditGuardProvider>
        <AdminEventsPage />
      </AdminEditGuardProvider>,
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue("EVENTS KO")).toBeInTheDocument(),
    );
  });

  it("loads protected config once, disables save and sync while pending, and keeps it across locale changes", async () => {
    const config: RAApiConfigView = {
      userId: "user-fixture",
      djId: "dj-fixture",
      option: "2",
      year: "2026",
      hasApiKey: true,
    };
    const pending = deferred<{ success: true; data: RAApiConfigView }>();
    mocks.fetchRaApiConfig.mockReturnValue(pending.promise);
    const view = renderPage();

    expect(screen.getByRole("button", { name: "SAVE CHANGES" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "SYNC RA NOW" })).toBeDisabled();
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ success: true, data: config });
      await pending.promise;
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "SAVE CHANGES" }),
      ).toBeEnabled(),
    );
    const apiKeyInput = screen.getByLabelText("events_api_key");
    expect(apiKeyInput).toHaveValue("");
    expect(apiKeyInput).toHaveAttribute("type", "password");
    expect(apiKeyInput).toHaveAttribute("autocomplete", "new-password");
    expect(apiKeyInput).toHaveAccessibleDescription("API 키 저장됨");

    mocks.currentEditLanguage = "ko";
    view.rerender(
      <AdminEditGuardProvider>
        <AdminEventsPage />
      </AdminEditGuardProvider>,
    );
    expect(screen.getByLabelText("events_api_key")).toHaveValue("");
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);
  });

  it("keeps base saves working but never writes protected config after its load fails", async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "test" },
    });
    renderPage();
    await screen.findByText(/RA API 설정을 불러오지 못했습니다/);
    fireEvent.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    await waitFor(() => {
      expect(mocks.updatePerformances).toHaveBeenCalledTimes(1);
      expect(mocks.updatePageMeta).toHaveBeenCalledTimes(1);
    });
    expect(mocks.updateRaApiConfig).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
  });

  it("requires a missing key to be saved before the server sync is available", async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        hasApiKey: false,
      },
    });
    mocks.updateRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        hasApiKey: true,
      },
    });
    renderPage();
    const syncButton = await screen.findByRole("button", {
      name: "SYNC RA NOW",
    });
    expect(syncButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("events_api_key"), {
      target: { value: "test-only-key" },
    });
    expect(syncButton).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    await waitFor(() =>
      expect(mocks.updateRaApiConfig).toHaveBeenCalledWith({
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        apiKey: "test-only-key",
      }),
    );
    await waitFor(() => expect(syncButton).toBeEnabled());
    fireEvent.click(syncButton);
    await waitFor(() => expect(mocks.runRaSync).toHaveBeenCalledTimes(1));
  });

  it("keeps ordinary event saves working when the RA connection has no key", async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        hasApiKey: false,
      },
    });
    renderPage();
    await screen.findByText("저장된 API 키 없음");
    fireEvent.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    await waitFor(() =>
      expect(mocks.updatePerformances).toHaveBeenCalledTimes(1),
    );
    expect(mocks.updateRaApiConfig).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
  });

  it("locks credentials and server sync while the config save is pending", async () => {
    const pending = deferred<{ success: true; data: RAApiConfigView }>();
    mocks.updateRaApiConfig.mockReturnValue(pending.promise);
    renderPage();
    await screen.findByText("API 키 저장됨");
    fireEvent.change(screen.getByLabelText("events_api_key"), {
      target: { value: "test-only-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    await waitFor(() =>
      expect(mocks.updateRaApiConfig).toHaveBeenCalledTimes(1),
    );
    expect(screen.getByLabelText("events_api_userid")).toBeDisabled();
    expect(screen.getByLabelText("events_api_key")).toBeDisabled();
    expect(screen.getByLabelText("events_api_option")).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "저장된 API 키 제거" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "SYNC RA NOW" })).toBeDisabled();

    await act(async () => {
      pending.resolve({
        success: true,
        data: {
          userId: "1",
          djId: "2",
          option: "1",
          year: "",
          hasApiKey: true,
        },
      });
      await pending.promise;
    });
    await waitFor(() =>
      expect(screen.getByLabelText("events_api_key")).toBeEnabled(),
    );
  });

  it("does not show success when the masked config update fails", async () => {
    mocks.updateRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "test" },
    });
    renderPage();
    await screen.findByText("API 키 저장됨");
    fireEvent.change(screen.getByLabelText("events_api_option"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    await screen.findByText(/RA API CONFIG 저장에 실패했습니다/);
    expect(mocks.showNotification).not.toHaveBeenCalled();
    expect(mocks.updateContent).not.toHaveBeenCalled();
    expect(screen.getByLabelText("events_api_option")).toHaveValue("3");
  });
});
