import { requirePagePermission } from '@/lib/auth/guard';
import { can } from '@/lib/auth/permissions';
import { listLayouts } from '@/lib/db/layouts';
import { listPlots } from '@/lib/db/plots';
import PlotsManager from '@/components/admin/PlotsManager';

export const dynamic = 'force-dynamic';

export default async function PlotsPage({ searchParams }: { searchParams: Promise<{ layoutId?: string }> }) {
  const user = await requirePagePermission('plots:read');
  const { layoutId } = await searchParams;
  const layouts = listLayouts({ includeInactive: true });
  const initialLayout = layoutId && layouts.some((l) => l.id === layoutId) ? layoutId : '';
  return (
    <PlotsManager
      layouts={layouts.map((l) => ({ id: l.id, name: l.name }))}
      initialLayoutId={initialLayout}
      initialPlots={listPlots(initialLayout ? { layoutId: initialLayout } : {})}
      canWrite={can(user.role, 'plots:write')}
    />
  );
}
