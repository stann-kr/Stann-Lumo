import { NextRequest, NextResponse } from 'next/server';
import type { MultiLanguageContent } from '@/capabilities/content/content';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { importLegacyContent } from '@/capabilities/migration/importLegacyContent.server';
import { getDB, getEnv } from '@/lib/db';

export async function POST(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const { MIGRATE_ENABLED } = getEnv();
  if (MIGRATE_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Migration endpoint is disabled. Set MIGRATE_ENABLED=true to enable.' } },
      { status: 403 },
    );
  }

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { content: MultiLanguageContent };
    if (!body.content?.en || !body.content?.ko) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'content.en and content.ko are required' } },
        { status: 400 },
      );
    }

    const inserted = await importLegacyContent(db, body.content);
    return NextResponse.json({ success: true, data: { inserted } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: String(error) } },
      { status: 500 },
    );
  }
}
