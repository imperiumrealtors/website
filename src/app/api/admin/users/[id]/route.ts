import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { validatePasswordStrength } from '@/lib/auth/password';
import { destroyAllSessionsForUser } from '@/lib/auth/session';
import { countActiveAdmins, emailExists, getUser, setUserPassword, updateUser } from '@/lib/db/users';
import { validateUser } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  requireApiPermission(req, 'users:read');
  const { id } = await params;
  const user = getUser(id);
  if (!user) throw new HttpError(404, 'User not found.');
  return ok(user);
});

export const PUT = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const actor = requireApiPermission(req, 'users:write');
  const { id } = await params;
  const existing = getUser(id);
  if (!existing) throw new HttpError(404, 'User not found.');

  const body = await readJson(req);
  const input = validateUser(body, { requirePassword: false });
  if (emailExists(input.email, id)) throw new HttpError(422, 'Please fix the highlighted fields.', { email: 'A user with this email already exists.' });

  const losingAdmin = existing.role === 'admin' && (input.role !== 'admin' || input.status !== 'active');
  if (losingAdmin && countActiveAdmins(id) === 0) {
    throw new HttpError(409, 'You cannot demote or deactivate the last active administrator.');
  }
  if (id === actor.id && (input.role !== 'admin' || input.status !== 'active')) {
    throw new HttpError(409, 'You cannot change your own role or deactivate yourself.');
  }

  const user = updateUser(id, { name: input.name, email: input.email, role: input.role, status: input.status });
  const changes: Record<string, unknown> = { role: input.role, status: input.status };

  if (input.password) {
    const weak = validatePasswordStrength(input.password);
    if (weak) throw new HttpError(422, 'Please fix the highlighted fields.', { password: weak });
    setUserPassword(id, input.password);
    changes.passwordReset = true;
  }

  // Any change that reduces access takes effect immediately.
  if (input.status === 'inactive' || input.role !== existing.role || input.password) destroyAllSessionsForUser(id);

  audit(actor, 'user.update', 'user', id, changes, clientIp(req));
  return ok(user);
});
