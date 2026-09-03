'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAdminEditGuard } from './AdminEditGuard';

const createSnapshot = (value: unknown) => JSON.stringify(value) ?? '';

/**
 * 로컬 편집 상태와 마지막 저장 스냅샷을 비교해 shell의 이탈 경고를 갱신한다.
 * resetKey가 바뀌면 다음 프레임에 현재 화면 값으로 기준선을 다시 잡아, 언어 전환과 비동기 초기 로드를 변경으로 오인하지 않는다.
 */
export function useUnsavedChanges(value: unknown, resetKey: unknown) {
  const { isDirty, setDirty } = useAdminEditGuard();
  const snapshot = createSnapshot(value);
  const snapshotRef = useRef(snapshot);
  const baselineRef = useRef(snapshot);
  const resetKeyRef = useRef(resetKey);
  const resetPendingRef = useRef(false);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (Object.is(resetKeyRef.current, resetKey)) return;

    resetKeyRef.current = resetKey;
    resetPendingRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      baselineRef.current = snapshotRef.current;
      resetPendingRef.current = false;
      setDirty(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [resetKey, setDirty]);

  useEffect(() => {
    if (resetPendingRef.current) return;
    setDirty(snapshot !== baselineRef.current);
  }, [setDirty, snapshot]);

  useEffect(() => () => setDirty(false), [setDirty]);

  const markSaved = useCallback(() => {
    baselineRef.current = snapshotRef.current;
    setDirty(false);
  }, [setDirty]);

  return { isDirty, markSaved };
}
