import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';
import { requirePortalUser } from '@/lib/auth/guard';
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';

export const metadata: Metadata = {
  title: 'Admin Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser();
  return (
    <AdminShell
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
      permissions={ROLE_PERMISSIONS[user.role]}
    >
      {children}
    </AdminShell>
  );
}
