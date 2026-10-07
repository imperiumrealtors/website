import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { getSettings } from '@/lib/db/settings';
import { listAuditLogs } from '@/lib/db/stats';
import SettingsPanel from '@/components/admin/SettingsPanel';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requirePagePermission('settings:read');
  return (
    <SettingsPanel
      settings={getSettings()}
      audit={can(user.role, 'audit:read') ? listAuditLogs(60) : []}
      canWrite={can(user.role, 'settings:write')}
      user={{ name: user.name, email: user.email, role: user.role }}
    />
  );
}
