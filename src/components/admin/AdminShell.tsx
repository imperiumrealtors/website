'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Map, LandPlot, Users, CalendarCheck, Image as ImageIcon, UserCog, Settings, LogOut, Menu, X, ExternalLink,
} from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { ToastProvider, useToast } from './ui';
import type { Permission } from '@/lib/auth/permissions';
import type { Role } from '@/lib/types';
import { api } from '@/lib/admin-api';

interface NavItem { href: string; label: string; icon: React.ComponentType<{ size?: number }>; permission: Permission }
interface NavGroup { label?: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' }] },
  { label: 'Properties', items: [
    { href: '/admin/layouts', label: 'Layouts', icon: Map, permission: 'layouts:read' },
    { href: '/admin/plots', label: 'Plots', icon: LandPlot, permission: 'plots:read' },
  ] },
  { label: 'CRM', items: [
    { href: '/admin/leads', label: 'Leads', icon: Users, permission: 'leads:read' },
    { href: '/admin/site-visits', label: 'Site Visits', icon: CalendarCheck, permission: 'visits:read' },
  ] },
  { label: 'Library', items: [{ href: '/admin/media', label: 'Media', icon: ImageIcon, permission: 'media:read' }] },
  { label: 'Administration', items: [
    { href: '/admin/users', label: 'Users', icon: UserCog, permission: 'users:read' },
    { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings:read' },
  ] },
];

export interface ShellUser { id: string; name: string; email: string; role: Role }

interface Props {
  user: ShellUser;
  permissions: Permission[];
  children: React.ReactNode;
}

function Shell({ user, permissions, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // UX filtering only; every page and API route enforces permissions server-side.
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => permissions.includes(i.permission)) })).filter((g) => g.items.length);

  const logout = async () => {
    setLoggingOut(true);
    const res = await api.post('/api/auth/logout', {});
    if (!res.ok) { toast('error', res.error); setLoggingOut(false); return; }
    router.replace('/admin/login?reason=signed-out');
    router.refresh();
  };

  const initials = user.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`admin-root ${open ? 'nav-open' : ''}`}>
      <div className="admin-sidebar-backdrop" onClick={() => setOpen(false)} />

      <aside className="admin-sidebar">
        <div style={{ padding: '20px 22px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
            <LogoMark size={36} tone="light" />
            <span>
              <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 17, color: '#fff', lineHeight: 1.1 }}>Imperium Realtors</span>
              <span style={{ display: 'block', fontSize: 9.5, letterSpacing: 1.8, fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-gold)' }}>Admin Portal</span>
            </span>
          </Link>
          <button className="admin-icon-btn admin-menu-btn" onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
          {groups.map((g, i) => (
            <div key={g.label ?? i}>
              {g.label && <div className="admin-nav-group">{g.label}</div>}
              {!g.label && <div style={{ height: 12 }} />}
              {g.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={`admin-nav-link ${active ? 'active' : ''}`} onClick={() => setOpen(false)}>
                    <item.icon size={17} /> {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Link href="/" target="_blank" rel="noopener" className="admin-nav-link" style={{ margin: 0 }}>
            <ExternalLink size={16} /> View website
          </Link>
          <button onClick={logout} disabled={loggingOut} className="admin-nav-link" style={{ margin: 0, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', font: 'inherit' }}>
            <LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="admin-icon-btn admin-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }} className="hidden-mobile">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.2 }} className="hidden-mobile">
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-deep)' }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-deep)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
              {initials}
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export default function AdminShell(props: Props) {
  return (
    <ToastProvider>
      <Shell {...props} />
    </ToastProvider>
  );
}
