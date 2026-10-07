import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { listUsers } from '@/lib/db/users';
import UsersManager from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await requirePagePermission('users:read');
  return <UsersManager initial={listUsers()} canWrite={can(user.role, 'users:write')} currentUserId={user.id} />;
}
