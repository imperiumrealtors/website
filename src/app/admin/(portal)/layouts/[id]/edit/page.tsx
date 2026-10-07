import Link from 'next/link';
import { requirePagePermission } from '@/lib/auth/guard';
import { getLayout } from '@/lib/db/layouts';
import { listMedia } from '@/lib/db/media';
import LayoutForm from '@/components/admin/LayoutForm';
import { EmptyState } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function EditLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission('layouts:write');
  const { id } = await params;
  const layout = getLayout(id);

  if (!layout) {
    return (
      <div className="admin-card">
        <EmptyState
          title="Layout not found"
          body="It may have been deleted by another user."
          action={<Link href="/admin/layouts" className="btn btn-dark btn-sm">Back to layouts</Link>}
        />
      </div>
    );
  }

  return <LayoutForm mode="edit" layoutId={id} initial={layout} media={listMedia({ kind: 'image' })} />;
}
