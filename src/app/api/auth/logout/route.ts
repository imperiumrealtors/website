import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle } from '@/lib/auth/guard';
import { clearedSessionCookieOptions, destroySession, resolveSession, SESSION_COOKIE } from '@/lib/auth/session';

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = resolveSession(token);
  if (token) destroySession(token);
  if (user) audit(user, 'logout', 'user', user.id, {}, clientIp(req));

  const res = NextResponse.json({ ok: true, data: null });
  res.cookies.set(SESSION_COOKIE, '', clearedSessionCookieOptions());
  return res;
});
