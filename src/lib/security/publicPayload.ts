const FORBIDDEN_PUBLIC_KEYS = new Set([
  'raapiconfig',
  'apikey',
  'accesskey',
  'userid',
  'djid',
  'rauserid',
]);

function normalizePayloadKey(key: string): string {
  return key.toLowerCase().replace(/[_.\-\s]/g, '');
}

/**
 * 공개 JSON 경계에 관리자/외부 API 자격정보 field가 섞이지 않았는지 검사한다.
 * 값은 읽거나 오류 메시지에 포함하지 않는다.
 */
export function assertPublicPayloadSafe(payload: unknown): void {
  const visited = new WeakSet<object>();

  const visit = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      if (FORBIDDEN_PUBLIC_KEYS.has(normalizePayloadKey(key))) {
        throw new Error(`Unsafe public payload field: ${key}`);
      }
      visit(nestedValue);
    }
  };

  visit(payload);
}
