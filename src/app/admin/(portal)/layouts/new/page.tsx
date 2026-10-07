import { requirePagePermission } from '@/lib/auth/guard';
import { listMedia } from '@/lib/db/media';
import LayoutForm, { EMPTY_LAYOUT } from '@/components/admin/LayoutForm';

export const dynamic = 'force-dynamic';

export default async function NewLayoutPage() {
  await requirePagePermission('layouts:write');
  return <LayoutForm mode="create" initial={EMPTY_LAYOUT} media={listMedia({ kind: 'image' })} />;
}
