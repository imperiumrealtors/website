'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, Inbox, X } from 'lucide-react';

/* ---------- Toasts ---------- */

type Toast = { id: number; kind: 'success' | 'error' | 'info'; message: string };
const ToastContext = createContext<(kind: Toast['kind'], message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ---------- Layout primitives ---------- */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', color: 'var(--brand-deep)', margin: 0, lineHeight: 1.15 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, padded = true }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; padded?: boolean }) {
  return (
    <section className="admin-card">
      {(title || actions) && (
        <div className="admin-card-head">
          {title && (typeof title === 'string' ? <h2 className="admin-card-title">{title}</h2> : <div>{title}</div>)}
          {actions}
        </div>
      )}
      <div style={{ padding: padded ? 20 : 0 }}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, accent, icon }: { label: string; value: string | number; accent?: string; icon?: React.ReactNode }) {
  return (
    <div className="admin-stat" style={{ borderLeftColor: accent ?? 'var(--brand-gold)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="admin-stat-label">{label}</span>
        {icon && <span style={{ color: accent ?? 'var(--brand-gold-dark)', display: 'flex' }}>{icon}</span>}
      </div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

const PILL_COLORS: Record<string, { bg: string; fg: string }> = {
  // plot statuses
  Available: { bg: 'rgba(18,140,90,0.12)', fg: '#0B6B44' },
  Reserved: { bg: 'rgba(199,123,22,0.14)', fg: '#8F5A10' },
  Sold: { bg: 'rgba(180,69,60,0.12)', fg: '#8F2F28' },
  Blocked: { bg: 'rgba(13,27,42,0.10)', fg: 'var(--brand-deep)' },
  // lead statuses
  New: { bg: 'rgba(37,99,235,0.12)', fg: '#1D4ED8' },
  Contacted: { bg: 'rgba(201,168,76,0.18)', fg: '#7A5F1E' },
  'Follow-up': { bg: 'rgba(199,123,22,0.14)', fg: '#8F5A10' },
  'Site Visit Scheduled': { bg: 'rgba(109,40,217,0.12)', fg: '#5B21B6' },
  Negotiation: { bg: 'rgba(13,27,42,0.10)', fg: 'var(--brand-deep)' },
  Converted: { bg: 'rgba(18,140,90,0.12)', fg: '#0B6B44' },
  Lost: { bg: 'rgba(180,69,60,0.12)', fg: '#8F2F28' },
  // visit statuses
  Requested: { bg: 'rgba(37,99,235,0.12)', fg: '#1D4ED8' },
  Confirmed: { bg: 'rgba(18,140,90,0.12)', fg: '#0B6B44' },
  Completed: { bg: 'rgba(13,27,42,0.10)', fg: 'var(--brand-deep)' },
  Cancelled: { bg: 'rgba(180,69,60,0.12)', fg: '#8F2F28' },
  Rescheduled: { bg: 'rgba(199,123,22,0.14)', fg: '#8F5A10' },
  // misc
  active: { bg: 'rgba(18,140,90,0.12)', fg: '#0B6B44' },
  inactive: { bg: 'rgba(13,27,42,0.10)', fg: 'var(--text-secondary)' },
  admin: { bg: 'rgba(201,168,76,0.2)', fg: '#7A5F1E' },
  manager: { bg: 'rgba(109,40,217,0.12)', fg: '#5B21B6' },
  sales: { bg: 'rgba(37,99,235,0.12)', fg: '#1D4ED8' },
  customer: { bg: 'rgba(13,27,42,0.08)', fg: 'var(--text-secondary)' },
};

export function StatusPill({ value }: { value: string }) {
  const c = PILL_COLORS[value] ?? { bg: 'var(--brand-deep-soft)', fg: 'var(--brand-deep)' };
  return <span className="pill" style={{ background: c.bg, color: c.fg }}>{value}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="admin-empty">
      <Inbox size={34} color="var(--border-medium)" style={{ margin: '0 auto' }} />
      <h3>{title}</h3>
      {body && <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>{body}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`admin-alert admin-alert-${kind}`}>{children}</div>;
}

/* ---------- Modal & confirm ---------- */

export function Modal({ title, onClose, children, width = 640 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{ maxWidth: width, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 700, color: 'var(--brand-deep)' }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" className="admin-icon-btn"><X size={16} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel = 'Delete', danger = true, busy, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} width={440}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <AlertTriangle size={24} color={danger ? 'var(--status-sold)' : 'var(--status-hold)'} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.65 }}>{body}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
        <button
          className="btn btn-sm"
          style={{ background: danger ? 'var(--status-sold)' : 'var(--brand-deep)', color: '#fff' }}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Form helpers ---------- */

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor?: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="search"
      className="form-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: 240, padding: '9px 12px', fontSize: 13.5 }}
    />
  );
}

export function LoadingRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: `${60 + ((r + c) % 3) * 15}%` }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}
