import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { listVisits } from '@/lib/db/visits';
import { listLayouts } from '@/lib/db/layouts';
import { listUsers } from '@/lib/db/users';
import VisitsManager from '@/components/admin/VisitsManager';

export const dynamic = 'force-dynamic';

export default async function SiteVisitsPage() {
  const user = await requirePagePermission('visits:read');
  return (
    <VisitsManager
      initial={listVisits()}
      layouts={listLayouts({ includeInactive: true }).map((l) => ({ id: l.id, name: l.name }))}
      staff={listUsers({ portalOnly: true }).filter((u) => u.status === 'active').map((u) => ({ id: u.id, name: u.name }))}
      canWrite={can(user.role, 'visits:write')}
    />
  );
}
