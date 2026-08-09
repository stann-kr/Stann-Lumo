/**
 * 어드민 세션 인증 미들웨어 헬퍼
 *
 * 라우트 핸들러에서 세션 검증 게이트 적용.
 * 미인증 시 401 반환.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, SESSION_COOKIE_NAME } from './auth';

export const PRIVATE_NO_STORE_CACHE_CONTROL = 'private, no-store';

export function privateNoStoreJson(payload: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
  return NextResponse.json(payload, { ...init, headers });
}

/**
 * 세션 유효성 확인 — 유효하지 않으면 401 반환
 * @returns null(유효) 또는 NextResponse(401)
 */
export async function requireAdminSession(
  request: NextRequest,
): Promise<NextResponse | null> {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? '';

  if (!sessionId) {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No session' } },
      { status: 401 },
    );
  }

  let valid = false;
  try {
    valid = await validateSession(sessionId);
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session validation failed' } },
      { status: 401 },
    );
  }

  if (!valid) {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid' } },
      { status: 401 },
    );
  }

  return null;
}
