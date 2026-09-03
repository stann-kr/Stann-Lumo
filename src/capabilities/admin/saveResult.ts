/**
 * 관리자 화면의 여러 독립 저장 요청에서 실패한 영역을 정리한다.
 * 요청이 reject되거나 API envelope가 success: false이면 모두 실패로 취급한다.
 */
export async function getFailedSaveAreas(
  areas: readonly string[],
  operations: readonly Promise<{ success: boolean }>[],
): Promise<string[]> {
  const results = await Promise.allSettled(operations);

  return results.flatMap((result, index) =>
    result.status === 'fulfilled' && result.value.success ? [] : [areas[index] ?? 'UNKNOWN'],
  );
}

/**
 * 저장 성공 후에만 로컬 콘텐츠를 동기화하고 성공 알림을 표시하도록 보장한다.
 */
export async function runSave(
  areas: readonly string[],
  operations: readonly Promise<{ success: boolean }>[],
  onSuccess: () => void,
  onFailure: (failedAreas: string[]) => void,
): Promise<boolean> {
  const failedAreas = await getFailedSaveAreas(areas, operations);
  if (failedAreas.length > 0) {
    onFailure(failedAreas);
    return false;
  }

  onSuccess();
  return true;
}
