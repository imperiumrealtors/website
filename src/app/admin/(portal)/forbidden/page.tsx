import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { requirePortalUser } from '@/lib/auth/guard';

export default async function ForbiddenPage() {
  const user = await requirePortalUser();
  return (
    <div className="admin-card" style={{ padding: '64px 24px', textAlign: 'center', maxWidth: 560, margin: '40px auto' }}>
      <ShieldOff size={40} color="var(--status-sold)" style={{ margin: '0 auto 16px' }} />
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: 'var(--brand-deep)', marginBottom: 8 }}>Access denied</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
        Your account (<strong>{user.role}</strong>) does not have permission to view that section.
        If you think you should, ask an administrator to update your role.
      </p>
      <Link href="/admin/dashboard" className="btn btn-dark btn-sm">Back to dashboard</Link>
    </div>
  );
}
