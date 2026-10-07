import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { listMedia } from '@/lib/db/media';
import { listLayouts } from '@/lib/db/layouts';
import MediaManager from '@/components/admin/MediaManager';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const user = await requirePagePermission('media:read');
  return (
    <MediaManager
      initial={listMedia()}
      layouts={listLayouts({ includeInactive: true }).map((l) => ({ id: l.id, name: l.name }))}
      canWrite={can(user.role, 'media:write')}
    />
  );
}
