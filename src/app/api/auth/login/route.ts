import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, readJson } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, purgeExpiredSessions, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session';
import { canAccessPortal } from '@/lib/auth/permissions';
import { getUserWithHashByEmail, touchLastLogin } from '@/lib/db/users';
import { EMAIL_RE } from '@/lib/validation';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const attempts = new Map<string, { count: number; first: number }>();

function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const body = await readJson<{ email?: string; password?: string }>(req);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const ip = clientIp(req);

  if (!EMAIL_RE.test(email) || !password) throw new HttpError(400, 'Enter your email and password.');

  const key = `${ip ?? 'unknown'}|${email}`;
  if (tooManyAttempts(key)) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');

  const user = getUserWithHashByEmail(email);
  const valid = user ? verifyPassword(password, user.passwordHash) : verifyPassword(password, DUMMY_HASH) && false;

  if (!user || !valid) {
    recordFailure(key);
    audit(null, 'login.failed', 'user', user?.id ?? null, { email }, ip);
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (user.status !== 'active') {
    audit(null, 'login.blocked', 'user', user.id, { reason: 'inactive' }, ip);
    throw new HttpError(403, 'This account has been deactivated. Contact an administrator.');
  }
  if (!canAccessPortal(user.role)) {
    audit(null, 'login.blocked', 'user', user.id, { reason: 'no-portal-role', role: user.role }, ip);
    throw new HttpError(403, 'Your account does not have access to the admin portal.');
  }

  attempts.delete(key);
  purgeExpiredSessions();
  const { token, expiresAt } = createSession(user.id, { ip, userAgent: req.headers.get('user-agent') });
  touchLastLogin(user.id);
  audit({ ...user, sessionId: '' }, 'login.success', 'user', user.id, {}, ip);

  const res = NextResponse.json({ ok: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});

// Keeps timing comparable when the email does not exist.
const DUMMY_HASH = 'scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
