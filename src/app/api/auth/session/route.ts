import { NextRequest, NextResponse } from 'next/server';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? '';

  if (!sessionId) {
    return NextResponse.json({ success: false, data: { authenticated: false } });
  }

  const valid = await validateSession(sessionId);

  return NextResponse.json({ success: true, data: { authenticated: valid } });
}
