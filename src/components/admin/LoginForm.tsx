'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { api } from '@/lib/admin-api';
import { Alert } from './ui';

const REASONS: Record<string, { kind: 'info' | 'error'; text: string }> = {
  expired: { kind: 'error', text: 'Your session has expired. Please sign in again.' },
  'signed-out': { kind: 'info', text: 'You have been signed out.' },
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get('next');
  const reason = params.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = nextPath && nextPath.startsWith('/admin') && !nextPath.startsWith('/admin/login') ? nextPath : '/admin/dashboard';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api.post('/api/auth/login', { email, password });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.replace(safeNext);
    router.refresh();
  };

  const notice = reason ? REASONS[reason] : null;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', background: 'var(--surface-raised)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', minHeight: '100vh' }}>
        <div className="parcel-grid" style={{ background: 'var(--gradient-hero)', color: '#fff', padding: 'clamp(32px, 6vw, 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13.5 }}>
            <ArrowLeft size={15} /> Back to website
          </Link>
          <div>
            <LogoMark size={64} tone="light" />
            <h1 className="font-display" style={{ fontSize: 'clamp(30px, 4vw, 44px)', margin: '26px 0 12px', lineHeight: 1.1 }}>Imperium Realtors<br />Admin Portal</h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 380, lineHeight: 1.7, fontSize: 15 }}>
              Manage layouts, plot availability, enquiries and site visits. Changes you make here go live on the website immediately.
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Authorised personnel only. All actions are logged.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 64px)' }}>
          <form onSubmit={submit} className="admin-card" style={{ width: '100%', maxWidth: 420, padding: 'clamp(24px, 4vw, 36px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: 'var(--brand-deep)' }}>Sign in</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Use your staff email and password.</p>
            </div>

            {notice && !error && <Alert kind={notice.kind}>{notice.text}</Alert>}
            {error && <Alert kind="error">{error}</Alert>}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input id="login-email" type="email" className="form-input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: 38 }} placeholder="you@imperiumrealtors.com" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input id="login-password" type={show ? 'text' : 'password'} className="form-input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: 38, paddingRight: 44 }} placeholder="••••••••••" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', padding: 14 }}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
