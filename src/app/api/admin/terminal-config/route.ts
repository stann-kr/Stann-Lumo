/**
 * 어드민 터미널 통합 설정 API
 * GET  /api/admin/terminal-config — URL/설명 + 커스텀 필드 + 스타일 전체 조회
 * PUT  /api/admin/terminal-config — 전체 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTerminalConfig,
  updateTerminalConfig,
} from '@/capabilities/terminal/terminalConfig.server';
import type { TerminalConfigData } from '@/capabilities/terminal/terminalConfig';
import { requireAdminSession } from '@/lib/adminAuth';
import { getDB } from '@/lib/db';

export type { TerminalConfigData } from '@/capabilities/terminal/terminalConfig';

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const data = await fetchTerminalConfig(db);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch terminal config' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { config: TerminalConfigData };
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'config is required' } },
        { status: 400 },
      );
    }

    await updateTerminalConfig(db, config);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update terminal config' } },
      { status: 500 },
    );
  }
}
