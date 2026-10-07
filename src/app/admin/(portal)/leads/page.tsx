import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { listLeads } from '@/lib/db/leads';
import { listLayouts } from '@/lib/db/layouts';
import { listUsers } from '@/lib/db/users';
import LeadsManager from '@/components/admin/LeadsManager';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const user = await requirePagePermission('leads:read');
  return (
    <LeadsManager
      initial={listLeads()}
      layouts={listLayouts({ includeInactive: true }).map((l) => ({ id: l.id, name: l.name }))}
      staff={listUsers({ portalOnly: true }).filter((u) => u.status === 'active').map((u) => ({ id: u.id, name: u.name }))}
      canWrite={can(user.role, 'leads:write')}
      currentUserId={user.id}
    />
  );
}
