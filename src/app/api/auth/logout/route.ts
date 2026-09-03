import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, buildSessionCookieHeader, SESSION_COOKIE_NAME } from '@/capabilities/auth/auth.server';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? '';

  if (sessionId) {
    await deleteSession(sessionId);
  }

  const response = NextResponse.json({ success: true });
  // 쿠키 만료 처리
  response.headers.set('Set-Cookie', buildSessionCookieHeader(''));

  return response;
}
