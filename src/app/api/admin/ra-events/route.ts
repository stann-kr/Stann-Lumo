import { NextRequest } from 'next/server';
import { isRAApiOption } from '@/capabilities/events/raApiConfig.server';
import { fetchRaEventsXml } from '@/capabilities/events/raEvents.server';
import {
  privateNoStoreJson,
  privateNoStoreResponse,
  requireAdminSession,
} from '@/capabilities/auth/authRoute.server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return privateNoStoreJson(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const requestedOption = request.nextUrl.searchParams.get('option');
    const requestedYear = request.nextUrl.searchParams.get('year');
    if (requestedOption !== null && !isRAApiOption(requestedOption)) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid RA option' } },
        { status: 400 },
      );
    }
    if (requestedYear !== null && requestedYear !== '' && !/^\d{4}$/.test(requestedYear)) {
      return privateNoStoreJson(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid RA year' } },
        { status: 400 },
      );
    }

    const result = await fetchRaEventsXml(db, requestedOption, requestedYear);
    if (result.kind === 'not-configured') {
      return privateNoStoreJson(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'RA API 설정이 완료되지 않았습니다.' } },
        { status: 400 },
      );
    }
    if (result.kind === 'upstream-error') {
      return privateNoStoreJson(
        { success: false, error: { code: 'RA_API_ERROR', message: `RA API 오류: ${result.status}` } },
        { status: 502 },
      );
    }
    if (result.kind === 'unsafe-response') {
      return privateNoStoreJson(
        { success: false, error: { code: 'RA_API_ERROR', message: 'RA API 응답을 처리하지 못했습니다.' } },
        { status: 502 },
      );
    }

    return privateNoStoreResponse(result.xml, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'RA API 호출 실패' } },
      { status: 500 },
    );
  }
}
