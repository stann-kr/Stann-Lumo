import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, validateSession } from './auth.server';

export const PRIVATE_NO_STORE_CACHE_CONTROL = 'private, no-store';

export function privateNoStoreResponse(body: BodyInit | null, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
  return new Response(body, { ...init, headers });
}

export function privateNoStoreJson(payload: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
  return NextResponse.json(payload, { ...init, headers });
}

export async function requireAdminSession(request: NextRequest): Promise<NextResponse | null> {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? '';
  if (!sessionId) {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No session' } },
      { status: 401 },
    );
  }

  let isValid = false;
  try {
    isValid = await validateSession(sessionId);
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session validation failed' } },
      { status: 401 },
    );
  }

  if (!isValid) {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid' } },
      { status: 401 },
    );
  }
  return null;
}
