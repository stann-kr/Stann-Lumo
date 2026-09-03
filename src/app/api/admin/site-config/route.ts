import { NextRequest, NextResponse } from 'next/server';
import type { SiteConfigData } from '@/capabilities/site/siteConfig';
import {
  fetchSiteConfig,
  updateSiteConfig,
} from '@/capabilities/site/siteConfig.server';
import { requireAdminSession } from '@/lib/adminAuth';
import { getDB } from '@/lib/db';

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
    const data = await fetchSiteConfig(db);
    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site config not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch site config' } },
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
    const body = (await request.json()) as { siteConfig: SiteConfigData };
    if (!body.siteConfig || typeof body.siteConfig !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'siteConfig is required' } },
        { status: 400 },
      );
    }

    await updateSiteConfig(db, body.siteConfig);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update site config' } },
      { status: 500 },
    );
  }
}
