import 'server-only';

import { getDB } from '@/lib/db';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE_NAME = 'admin_session';

export class SessionStorageUnavailableError extends Error {
  constructor() {
    super('Admin session storage is unavailable');
    this.name = 'SessionStorageUnavailableError';
  }
}

export async function createSession(): Promise<string> {
  const db = getDB();
  if (!db) throw new SessionStorageUnavailableError();

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.prepare(
    'INSERT INTO admin_sessions (id, expires_at) VALUES (?, ?)',
  ).bind(sessionId, expiresAt).run();
  return sessionId;
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const db = getDB();
  if (!db) return false;

  const row = await db.prepare(
    'SELECT id FROM admin_sessions WHERE id = ? AND expires_at > ?',
  ).bind(sessionId, new Date().toISOString()).first<{ id: string }>();
  return row !== null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.prepare('DELETE FROM admin_sessions WHERE id = ?').bind(sessionId).run();
}

export async function pruneExpiredSessions(): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.prepare(
    'DELETE FROM admin_sessions WHERE expires_at <= ?',
  ).bind(new Date().toISOString()).run();
}

export function buildSessionCookieHeader(sessionId: string): string {
  const isExpire = sessionId === '';
  const maxAge = isExpire ? 0 : SESSION_TTL_MS / 1000;
  const parts = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}
