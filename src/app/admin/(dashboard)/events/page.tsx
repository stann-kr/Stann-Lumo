'use client';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import SuccessMessage from '@/components/base/SuccessMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useListEditor } from '@/hooks/useListEditor';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Performance, PageMeta } from '@/types/content';
import type { RAApiConfigUpdate, RAApiConfigView } from '@/types/admin';
import {
  fetchRAEvents,
  convertRAEventsToPerformances,
  sortEventsByDate,
} from '@/utils/raApi';
import { createBorderFaint } from '@/utils/colorMix';
import {
  updatePerformances as apiUpdatePerformances,
  updatePageMeta as apiUpdatePageMeta,
  fetchRaApiConfig as apiFetchRaApiConfig,
  updateRaApiConfig as apiUpdateRaApiConfig,
  uploadEventPoster,
  deleteEventPoster,
} from '@/services/adminService';

const POSTER_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const POSTER_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const EMPTY_RA_API_CONFIG: RAApiConfigView = {
  userId: '',
  djId: '',
  option: '1',
  year: '',
  hasApiKey: false,
};

const AdminEventsPage = () => {
  const { t } = useTranslation();
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];

  const {
    items: performances,
    setItems: setPerformances,
    updateItem: updatePerformance,
    deleteItem: deletePerformance,
  } = useListEditor<Performance>(content.performances);

  const [raApiConfig, setRaApiConfig] = useState<RAApiConfigView>(EMPTY_RA_API_CONFIG);
  const [replacementApiKey, setReplacementApiKey] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);
  const [isRaConfigDirty, setIsRaConfigDirty] = useState(false);
  const [isRaConfigLoading, setIsRaConfigLoading] = useState(true);
  const [raConfigLoadFailed, setRaConfigLoadFailed] = useState(false);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [posterUploading, setPosterUploading] = useState<Record<string, boolean>>({});
  const [posterError, setPosterError] = useState<Record<string, string | null>>({});

  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  const {
    isOpen: isDeleteModalOpen,
    pendingIndex: deleteIndex,
    openConfirm: openDeleteConfirm,
    closeConfirm: closeDeleteConfirm,
    confirmDelete,
  } = useDeleteConfirm();

  useEffect(() => {
    let active = true;

    const loadRaApiConfig = async () => {
      try {
        const response = await apiFetchRaApiConfig();
        if (!active) return;

        if (response.success && response.data) {
          setRaApiConfig(response.data);
          setReplacementApiKey('');
          setClearApiKey(false);
          setIsRaConfigDirty(false);
          setRaConfigLoadFailed(false);
        } else {
          setRaConfigLoadFailed(true);
        }
      } catch {
        if (active) setRaConfigLoadFailed(true);
      } finally {
        if (active) setIsRaConfigLoading(false);
      }
    };

    void loadRaApiConfig();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // 구버전 status 값 정규화 (DB 마이그레이션 전 환경 대비)
    const normalized = allContent[currentEditLanguage].performances.map((p) => ({
      ...p,
      status: (p.status === ('Confirmed' as string) ? 'Announced'
             : p.status === ('Pending'   as string) ? 'TBA'
             : p.status) as Performance['status'],
    }));
    // 초기 로드 시에도 최신순 정렬 보장
    setPerformances(sortEventsByDate(normalized, false));
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent, setPerformances]);

  const updatePageMetaField = (field: keyof PageMeta['events'], value: string) => {
    setPageMeta(prev => ({ ...prev, events: { ...prev.events, [field]: value } }));
  };

  const canSyncWithRA =
    !isRaConfigLoading &&
    !isSaving &&
    !raConfigLoadFailed &&
    raApiConfig.hasApiKey &&
    raApiConfig.userId.trim().length > 0 &&
    raApiConfig.djId.trim().length > 0 &&
    !isRaConfigDirty;

  const saveChanges = async () => {
    const shouldSaveRaConfig = !isRaConfigLoading && !raConfigLoadFailed;
    const shouldUpdateRaConfig = shouldSaveRaConfig && isRaConfigDirty;
    const hasReplacementKey = replacementApiKey.trim().length > 0;

    setIsSaving(true);
    setFetchError('');

    try {
      const baseResults = await Promise.all([
        apiUpdatePerformances(performances),
        apiUpdatePageMeta(currentEditLanguage, pageMeta),
      ]);

      let raResult: Awaited<ReturnType<typeof apiUpdateRaApiConfig>> | null = null;
      if (shouldUpdateRaConfig) {
        const update: RAApiConfigUpdate = {
          userId: raApiConfig.userId,
          djId: raApiConfig.djId,
          option: raApiConfig.option,
          year: raApiConfig.year,
          ...(hasReplacementKey && { apiKey: replacementApiKey.trim() }),
          ...(clearApiKey && { clearApiKey: true }),
        };
        raResult = await apiUpdateRaApiConfig(update);
        if (raResult.success && raResult.data) {
          setRaApiConfig(raResult.data);
          setReplacementApiKey('');
          setClearApiKey(false);
          setIsRaConfigDirty(false);
        }
      }

      if (baseResults.some((result) => !result.success) || (raResult && !raResult.success)) {
        setFetchError('일부 변경 사항을 저장하지 못했습니다. 다시 시도해 주세요.');
        return;
      }

      updateContent({ performances, pageMeta });
      showNotification();
    } catch {
      setFetchError('일부 변경 사항을 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchFromRA = async () => {
    if (!canSyncWithRA) {
      setFetchError(t('events_api_config_required'));
      return;
    }
    setIsFetching(true);
    setFetchError('');
    setFetchSuccess('');
    try {
      const response = await fetchRAEvents({ option: raApiConfig.option, year: raApiConfig.year });
      const raPerformances = convertRAEventsToPerformances(response.events);

      // 이미 저장된 RA 이벤트 ID 집합 (raEventId 기준 중복 제외)
      const existingRaIds = new Set(
        performances.filter((p) => p.raEventId).map((p) => p.raEventId)
      );
      const newPerformances = raPerformances.filter(
        (p) => p.raEventId && !existingRaIds.has(p.raEventId)
      );
      const skipped = raPerformances.length - newPerformances.length;

      // 기존 이벤트 + 새 RA 이벤트 병합 후 날짜순 정렬 (최신순: ascending = false)
      const merged = sortEventsByDate([...performances, ...newPerformances], false);
      setPerformances(merged);

      setFetchSuccess(
        `${newPerformances.length}개 추가됨${skipped > 0 ? ` (${skipped}개 중복 제외)` : ''}`
      );
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : t('events_sync_error'));
    } finally {
      setIsFetching(false);
    }
  };

  const addNewPerformance = () => {
    const newPerf: Performance = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      venue: 'New Venue',
      title: 'New Performance',
      location: 'Seoul',
      time: '23:00',
      status: 'TBA',
    };
    setPerformances([newPerf, ...performances]);
  };

  const updatePerformanceField = (index: number, field: keyof Performance, value: string) => {
    const current = performances[index];
    if (current) {
      updatePerformance(index, { ...current, [field]: value });
    }
  };

  const updateRaApiConfigField = <
    Field extends 'userId' | 'djId' | 'option' | 'year',
  >(field: Field, value: RAApiConfigView[Field]) => {
    setRaApiConfig((prev) => ({ ...prev, [field]: value }));
    setIsRaConfigDirty(true);
  };

  const updateReplacementApiKey = (value: string) => {
    setReplacementApiKey(value);
    if (value.trim().length > 0) setClearApiKey(false);
    setIsRaConfigDirty(true);
  };

  const isRaConfigReadOnly = isRaConfigLoading || raConfigLoadFailed || isSaving;

  const handlePosterUpload = async (eventId: string, file: File) => {
    setPosterError((prev) => ({ ...prev, [eventId]: null }));

    if (!POSTER_ALLOWED_TYPES.includes(file.type)) {
      setPosterError((prev) => ({ ...prev, [eventId]: 'JPG, PNG, WebP, AVIF, GIF 형식만 지원합니다.' }));
      return;
    }
    if (file.size > POSTER_MAX_SIZE_BYTES) {
      setPosterError((prev) => ({ ...prev, [eventId]: '파일 크기가 10MB를 초과합니다.' }));
      return;
    }

    setPosterUploading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const result = await uploadEventPoster(eventId, file);
      if (result.success && result.data) {
        setPerformances(
          performances.map((p) => p.id === eventId ? { ...p, posterImageId: result.data!.photoId } : p)
        );
      } else {
        setPosterError((prev) => ({ ...prev, [eventId]: '업로드에 실패했습니다. 다시 시도해 주세요.' }));
      }
    } catch {
      setPosterError((prev) => ({ ...prev, [eventId]: '네트워크 오류가 발생했습니다.' }));
    } finally {
      setPosterUploading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handlePosterDelete = async (eventId: string) => {
    setPosterUploading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const result = await deleteEventPoster(eventId);
      if (result.success) {
        setPerformances(
          performances.map((p) => p.id === eventId ? { ...p, posterImageId: undefined } : p)
        );
      }
    } finally {
      setPosterUploading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="EVENTS SECTION"
        description={`${t('admin_events_subtitle')} (${currentEditLanguage.toUpperCase()})`}
        onSave={saveChanges}
        isSaving={isSaving}
        isSaveDisabled={isRaConfigLoading}
        action={
          <button
            onClick={addNewPerformance}
            className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider"
            style={createBorderFaint()}
          >
            <i className="ri-add-line mr-2"></i>ADD EVENT
          </button>
        }
      />

      <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />

      {/* PAGE SETTINGS */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
          PAGE SETTINGS
        </h2>
        <AdminCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="PAGE TITLE"
              value={pageMeta.events.title}
              onChange={(value) => updatePageMetaField('title', value)}
              placeholder="EVENTS"
            />
            <FormInput
              label="PAGE SUBTITLE"
              value={pageMeta.events.subtitle}
              onChange={(value) => updatePageMetaField('subtitle', value)}
              placeholder="PERFORMANCE SCHEDULE & INFORMATION"
            />
            <FormInput
              label="UPCOMING SECTION TITLE"
              value={pageMeta.events.upcomingTitle}
              onChange={(value) => updatePageMetaField('upcomingTitle', value)}
              placeholder="UPCOMING EVENTS"
            />
            <FormInput
              label="PAST SECTION TITLE"
              value={pageMeta.events.pastTitle}
              onChange={(value) => updatePageMetaField('pastTitle', value)}
              placeholder="PAST EVENTS"
            />
          </div>
        </AdminCard>
      </div>

      {/* RA API Settings */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
          {t('events_ra_settings')}
        </h2>
        <AdminCard>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('events_api_userid')}
                value={raApiConfig.userId}
                onChange={(value) => updateRaApiConfigField('userId', value)}
                placeholder="123456"
                disabled={isRaConfigReadOnly}
              />
              <FormInput
                id="ra-api-key"
                label={t('events_api_key')}
                type="password"
                value={replacementApiKey}
                onChange={updateReplacementApiKey}
                placeholder={raApiConfig.hasApiKey ? '저장된 키 유지 — 교체할 때만 입력' : '새 API 키 입력'}
                autoComplete="new-password"
                aria-describedby="ra-api-key-status"
                disabled={isRaConfigReadOnly}
              />
              <FormInput
                label={t('events_api_djid')}
                value={raApiConfig.djId}
                onChange={(value) => updateRaApiConfigField('djId', value)}
                placeholder="123456"
                disabled={isRaConfigReadOnly}
              />
              <div>
                <label
                  htmlFor="ra-api-option"
                  className="block text-xs text-[var(--color-accent)] tracking-widest mb-2"
                >
                  {t('events_api_option')}
                </label>
                <select
                  id="ra-api-option"
                  value={raApiConfig.option}
                  onChange={(e) => updateRaApiConfigField(
                    'option',
                    e.target.value as RAApiConfigView['option'],
                  )}
                  disabled={isRaConfigReadOnly}
                  className="w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                >
                  <option value="1">{t('events_api_option_1')}</option>
                  <option value="2">{t('events_api_option_2')}</option>
                  <option value="3">{t('events_api_option_3')}</option>
                  <option value="4">{t('events_api_option_4')}</option>
                </select>
              </div>
              <FormInput
                label="YEAR (선택사항, 미입력시 올해 기준)"
                value={raApiConfig.year ?? ''}
                onChange={(value) => updateRaApiConfigField('year', value)}
                placeholder="2025"
                disabled={isRaConfigReadOnly}
              />
            </div>
            {!isRaConfigLoading && !raConfigLoadFailed && (
              <div className="space-y-2 text-xs tracking-wider text-[var(--color-secondary)]/70">
                <p id="ra-api-key-status" role="status" aria-live="polite">
                  {raApiConfig.hasApiKey ? 'API 키 저장됨' : '저장된 API 키 없음'}
                </p>
                {raApiConfig.hasApiKey && (
                  <label className="inline-flex min-h-11 items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearApiKey}
                      disabled={isSaving}
                      onChange={(event) => {
                        const shouldClear = event.target.checked;
                        setClearApiKey(shouldClear);
                        if (shouldClear) setReplacementApiKey('');
                        setIsRaConfigDirty(true);
                      }}
                    />
                    저장된 API 키 제거
                  </label>
                )}
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={fetchFromRA}
                disabled={isFetching || !canSyncWithRA}
                className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] tracking-wider text-sm hover:bg-[var(--color-primary)] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? t('events_fetching') : t('events_fetch_from_ra')}
              </button>
              {raConfigLoadFailed && (
                <p role="alert" className="text-sm text-red-400 tracking-wider">
                  RA API 설정을 불러오지 못했습니다. 설정 저장과 동기화가 비활성화됩니다.
                </p>
              )}
              {fetchError && <p role="alert" className="text-sm text-red-400 tracking-wider">{fetchError}</p>}
              {fetchSuccess && <p role="status" className="text-sm text-green-400 tracking-wider">{fetchSuccess}</p>}
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Events */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
          EVENTS
        </h2>
        <div className="space-y-4">
          {performances.map((performance, index) => (
            <AdminCard key={performance.id}>
              {isDeleteModalOpen && deleteIndex === index ? (
                <DeleteConfirmModal
                  show={true}
                  itemName={deleteIndex !== null ? performances[deleteIndex]?.venue || '' : ''}
                  onConfirm={() => confirmDelete(deletePerformance)}
                  onCancel={closeDeleteConfirm}
                />
              ) : (
                <div className="flex items-start gap-4">
                  {/* 포스터 썸네일 — 있을 때만 좌측 표시 */}
                  {performance.posterImageId && (
                    <div className="shrink-0 w-20 h-20 overflow-hidden">
                      <img
                        src={`/api/media/${performance.posterImageId}`}
                        alt="Poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="TITLE"
                      value={performance.title}
                      onChange={(value) => updatePerformanceField(index, 'title', value)}
                      placeholder="Performance Title"
                    />
                    <FormInput
                      label="DATE"
                      type="date"
                      value={performance.date}
                      onChange={(value) => updatePerformanceField(index, 'date', value)}
                    />
                    <FormInput
                      label="TIME"
                      type="time"
                      value={performance.time ?? ''}
                      onChange={(value) => updatePerformanceField(index, 'time', value)}
                    />
                    <FormInput
                      label="VENUE"
                      value={performance.venue}
                      onChange={(value) => updatePerformanceField(index, 'venue', value)}
                    />
                    <FormInput
                      label="LOCATION"
                      value={performance.location ?? ''}
                      onChange={(value) => updatePerformanceField(index, 'location', value)}
                    />
                    <div className="md:col-span-2">
                      <label
                        htmlFor={`performance-status-${performance.id}`}
                        className="block text-xs text-[var(--color-accent)] tracking-widest mb-2"
                      >
                        STATUS
                      </label>
                      <select
                        id={`performance-status-${performance.id}`}
                        value={performance.status}
                        onChange={(e) => updatePerformanceField(index, 'status', e.target.value)}
                        className="w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                      >
                        <option value="Announced">Announced</option>
                        <option value="TBA">TBA</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    {performance.raEventId && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-[var(--color-accent)] tracking-widest">
                          RA에서 가져온 이벤트 (ID: {performance.raEventId})
                        </p>
                      </div>
                    )}
                    {/* 포스터 이미지 업로드 (선택 사항) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs text-[var(--color-accent)] tracking-widest">
                        POSTER IMAGE <span className="text-[var(--color-secondary)]/30 normal-case font-normal">(선택)</span>
                      </label>
                      {performance.posterImageId ? (
                        <button
                          onClick={() => handlePosterDelete(performance.id)}
                          disabled={posterUploading[performance.id]}
                          className="text-xs text-red-400 hover:text-red-300 tracking-widest disabled:opacity-50 cursor-pointer"
                        >
                          {posterUploading[performance.id] ? 'REMOVING...' : 'REMOVE POSTER'}
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] tracking-widest transition-colors">
                            <i className="ri-upload-line"></i>
                            <span>UPLOAD POSTER</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                              className="hidden"
                              disabled={posterUploading[performance.id]}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePosterUpload(performance.id, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {posterUploading[performance.id] && (
                            <div className="w-full h-0.5 bg-[var(--color-secondary)]/10 overflow-hidden rounded-full">
                              <div className="h-full w-1/2 bg-[var(--color-accent)] animate-shimmer rounded-full" />
                            </div>
                          )}
                          {!posterUploading[performance.id] && (
                            <p className="text-[10px] text-[var(--color-secondary)]/30 tracking-wider">
                              JPG · PNG · WebP · AVIF · GIF · max 10MB
                            </p>
                          )}
                          {posterError[performance.id] && (
                            <p className="text-[10px] text-red-400 tracking-wider flex items-center gap-1">
                              <i className="ri-error-warning-line" />
                              {posterError[performance.id]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openDeleteConfirm(index)}
                    className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer shrink-0"
                    title="Delete"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminEventsPage;
