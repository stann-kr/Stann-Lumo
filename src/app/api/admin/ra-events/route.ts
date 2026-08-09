/**
 * RA 이벤트 프록시 API
 * GET /api/admin/ra-events
 *
 * 브라우저에서 RA API를 직접 호출하면 CORS 차단됨.
 * 이 라우트가 서버(CF Workers)에서 RA API를 호출하고 XML을 그대로 반환.
 */

import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import {
  privateNoStoreJson,
  privateNoStoreResponse,
  requireAdminSession,
} from '@/lib/adminAuth';
import { getRaApiConfigSecret, isRAApiOption } from '@/lib/admin/raApiConfig.server';

function escapeXmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function containsCredentialReflection(body: string, credential: string): boolean {
  const formEncoded = new URLSearchParams({ credential }).toString().slice('credential='.length);
  const variants = new Set([
    credential,
    escapeXmlText(credential),
    encodeURIComponent(credential),
    formEncoded,
  ]);

  return [...variants].some((variant) => variant.length > 0 && body.includes(variant));
}

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
    const searchParams = request.nextUrl.searchParams;
    const requestedOption = searchParams.get('option');
    const requestedYear = searchParams.get('year');

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

    const config = await getRaApiConfigSecret(db);

    if (!config) {
      return privateNoStoreJson(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'RA API 설정이 완료되지 않았습니다.' } },
        { status: 400 },
      );
    }

    const option = requestedOption ?? config.option;
    let year = requestedYear !== null ? requestedYear : config.year;

    if (!year && option === '4') {
      year = new Date().getFullYear().toString();
    }

    const params = new URLSearchParams({
      AccessKey: config.apiKey,
      UserID: config.userId,
      DJID: config.djId,
      Option: option,
      VenueID: '',
      CountryID: '',
      AreaID: '',
      PromoterID: '',
      Year: year || '',
    });

    const raResponse = await fetch(
      `https://www.residentadvisor.net/api/events.asmx/GetEvents?${params.toString()}`,
      { headers: { Accept: 'application/xml, text/xml' } },
    );

    if (!raResponse.ok) {
      return privateNoStoreJson(
        { success: false, error: { code: 'RA_API_ERROR', message: `RA API 오류: ${raResponse.status}` } },
        { status: 502 },
      );
    }

    const xml = await raResponse.text();
    if (containsCredentialReflection(xml, config.apiKey)) {
      return privateNoStoreJson(
        { success: false, error: { code: 'RA_API_ERROR', message: 'RA API 응답을 처리하지 못했습니다.' } },
        { status: 502 },
      );
    }

    return privateNoStoreResponse(xml, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch {
    return privateNoStoreJson(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'RA API 호출 실패',
        },
      },
      { status: 500 },
    );
  }
}
