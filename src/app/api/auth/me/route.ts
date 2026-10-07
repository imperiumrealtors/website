import type { NextRequest } from 'next/server';
import { handle, ok, requireApiUser } from '@/lib/auth/guard';
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';

export const GET = handle(async (req: NextRequest) => {
  const user = requireApiUser(req);
  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role],
  });
});
