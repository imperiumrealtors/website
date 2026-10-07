import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { nowIso, one, run } from '../db';
import type { Role, User } from '../types';

export const SESSION_COOKIE = 'vk_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const RENEW_THRESHOLD_MS = 2 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface SessionUser extends User {
  sessionId: string;
}

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null }) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await run(`
    INSERT INTO sessions (id, user_id, expires_at, created_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)
  `, hashToken(token), userId, expiresAt.toISOString(), nowIso(), meta.ip ?? null, meta.userAgent ?? null);
  return { token, expiresAt };
}

export async function destroySession(token: string) {
  await run('DELETE FROM sessions WHERE id = ?', hashToken(token));
}

export async function destroyAllSessionsForUser(userId: string) {
  await run('DELETE FROM sessions WHERE user_id = ?', userId);
}

export async function purgeExpiredSessions() {
  await run('DELETE FROM sessions WHERE expires_at < ?', nowIso());
}

/** Resolve a raw cookie token to an active user, or null. Inactive users and expired sessions are rejected. */
export async function resolveSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const row = await one<SessionRow>(`
    SELECT s.id, s.user_id, s.expires_at,
           u.name, u.email, u.role, u.status, u.created_at, u.updated_at, u.last_login_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `, hashToken(token));

  if (!row) return null;
  const expires = new Date(row.expires_at).getTime();
  if (expires < Date.now() || row.status !== 'active') {
    await run('DELETE FROM sessions WHERE id = ?', row.id);
    return null;
  }
  if (expires - Date.now() < RENEW_THRESHOLD_MS) {
    await run('UPDATE sessions SET expires_at = ? WHERE id = ?', new Date(Date.now() + SESSION_TTL_MS).toISOString(), row.id);
  }
  return {
    sessionId: row.id,
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return resolveSession(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}

export function clearedSessionCookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 };
}
