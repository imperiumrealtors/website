import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser, resolveSession, SESSION_COOKIE, type SessionUser } from './session';
import { can, canAccessPortal, type Permission } from './permissions';
import { getDb, newId, nowIso } from '../db';
import { HttpError } from '../http-error';

/* ---------- Page guards (server components) ---------- */

export async function requirePortalUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (!canAccessPortal(user.role)) redirect('/admin/forbidden');
  return user;
}

export async function requirePagePermission(permission: Permission): Promise<SessionUser> {
  const user = await requirePortalUser();
  if (!can(user.role, permission)) redirect('/admin/forbidden');
  return user;
}

/* ---------- API guards (route handlers) ---------- */

export { HttpError };

export function requireApiUser(req: NextRequest): SessionUser {
  const user = resolveSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) throw new HttpError(401, 'Authentication required.');
  if (!canAccessPortal(user.role)) throw new HttpError(403, 'Your account does not have portal access.');
  return user;
}

export function requireApiPermission(req: NextRequest, permission: Permission): SessionUser {
  const user = requireApiUser(req);
  if (!can(user.role, permission)) throw new HttpError(403, 'You are not allowed to perform this action.');
  return user;
}

/** Blocks cross-site requests from carrying the session cookie into mutating endpoints. */
export function assertSameOrigin(req: NextRequest) {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    throw new HttpError(403, 'Cross-site request rejected.');
  }
  const origin = req.headers.get('origin');
  if (origin) {
    const expected = req.nextUrl.origin;
    if (origin !== expected) throw new HttpError(403, 'Cross-site request rejected.');
  }
}

export function clientIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'Expected application/json.');
  }
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Malformed JSON body.');
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ ok: false, error: err.message, details: err.details ?? null }, { status: err.status });
  }
  console.error('[api]', err);
  return NextResponse.json({ ok: false, error: 'Something went wrong on our side.' }, { status: 500 });
}

/** Wrap a route handler so thrown HttpErrors become proper JSON responses. */
export function handle<C = unknown>(fn: (req: NextRequest, ctx: C) => Promise<Response> | Response) {
  return async (req: NextRequest, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return apiError(err);
    }
  };
}

/* ---------- Audit ---------- */

export function audit(
  user: SessionUser | null,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
  ip: string | null = null,
) {
  getDb().prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newId(), user?.id ?? null, action, entity, entityId, JSON.stringify(details), ip, nowIso());
}
