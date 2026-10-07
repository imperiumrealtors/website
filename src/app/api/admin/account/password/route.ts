import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, readJson, requireApiUser } from '@/lib/auth/guard';
import { validatePasswordStrength, verifyPassword } from '@/lib/auth/password';
import { createSession, destroyAllSessionsForUser, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session';
import { getPasswordHash, setUserPassword } from '@/lib/db/users';

export const PUT = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = requireApiUser(req);
  const body = await readJson<{ currentPassword?: string; newPassword?: string }>(req);
  const current = String(body.currentPassword ?? '');
  const next = String(body.newPassword ?? '');

  const hash = getPasswordHash(user.id);
  if (!hash || !verifyPassword(current, hash)) throw new HttpError(422, 'Please fix the highlighted fields.', { currentPassword: 'Current password is incorrect.' });
  const weak = validatePasswordStrength(next);
  if (weak) throw new HttpError(422, 'Please fix the highlighted fields.', { newPassword: weak });
  if (current === next) throw new HttpError(422, 'Please fix the highlighted fields.', { newPassword: 'New password must be different.' });

  setUserPassword(user.id, next);
  // Rotate: every other session for this account is invalidated, this one is re-issued.
  destroyAllSessionsForUser(user.id);
  const { token, expiresAt } = createSession(user.id, { ip: clientIp(req), userAgent: req.headers.get('user-agent') });
  audit(user, 'account.password_change', 'user', user.id, {}, clientIp(req));

  const res = NextResponse.json({ ok: true, data: null });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
