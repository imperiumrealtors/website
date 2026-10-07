import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { listLayouts } from '@/lib/db/layouts';
import LayoutsTable from '@/components/admin/LayoutsTable';

export const dynamic = 'force-dynamic';

export default async function LayoutsPage() {
  const user = await requirePagePermission('layouts:read');
  return <LayoutsTable initial={listLayouts({ includeInactive: true })} canWrite={can(user.role, 'layouts:write')} />;
}
