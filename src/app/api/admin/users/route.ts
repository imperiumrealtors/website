import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { validatePasswordStrength } from '@/lib/auth/password';
import { createUser, emailExists, listUsers } from '@/lib/db/users';
import { validateUser } from '@/lib/validators';
import { ROLES } from '@/lib/auth/permissions';
import type { Role } from '@/lib/types';

export const GET = handle(async (req: NextRequest) => {
  await requireApiPermission(req, 'users:read');
  const sp = req.nextUrl.searchParams;
  const role = sp.get('role') as Role | null;
  return ok(await listUsers({ search: sp.get('q') ?? undefined, role: role && ROLES.includes(role) ? role : undefined }));
});

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const actor = await requireApiPermission(req, 'users:write');
  const input = validateUser(await readJson(req), { requirePassword: true });
  const weak = validatePasswordStrength(input.password);
  if (weak) throw new HttpError(422, 'Please fix the highlighted fields.', { password: weak });
  if (await emailExists(input.email)) throw new HttpError(422, 'Please fix the highlighted fields.', { email: 'A user with this email already exists.' });
  const user = await createUser(input);
  await audit(actor, 'user.create', 'user', user.id, { email: user.email, role: user.role }, clientIp(req));
  return ok(user, { status: 201 });
});
