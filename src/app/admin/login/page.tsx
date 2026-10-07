import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessPortal } from '@/lib/auth/permissions';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Sign in · Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && canAccessPortal(user.role)) redirect('/admin/dashboard');
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
