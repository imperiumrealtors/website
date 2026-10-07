'use client';
import { useState } from 'react';
import { Save, KeyRound } from 'lucide-react';
import { api, formatDate, type FieldErrors } from '@/lib/admin-api';
import type { SettingKey } from '@/lib/db/settings';
import type { AuditLog, Role } from '@/lib/types';
import { PageHeader, Card, Field, Alert, EmptyState, useToast } from './ui';

interface Props {
  settings: Record<SettingKey, string>;
  audit: AuditLog[];
  canWrite: boolean;
  user: { name: string; email: string; role: Role };
}

const LABELS: Record<SettingKey, { label: string; hint?: string }> = {
  company_name: { label: 'Company name' },
  support_phone: { label: 'Support phone' },
  support_email: { label: 'Support email' },
  lead_auto_assign: { label: 'Lead auto-assignment', hint: '"on" or "off" — reserved for future round-robin assignment.' },
  visit_slots: { label: 'Site visit slots', hint: 'Comma-separated, e.g. 09:00 AM,11:00 AM' },
};

export default function SettingsPanel({ settings: initial, audit, canWrite, user }: Props) {
  const toast = useToast();
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<FieldErrors>({});
  const [pwBusy, setPwBusy] = useState(false);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const res = await api.put<Record<SettingKey, string>>('/api/admin/settings', settings);
    setSaving(false);
    if (!res.ok) { setErrors(res.details ?? { _: res.error }); return; }
    setSettings(res.data);
    toast('success', 'Settings saved.');
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) { setPwErrors({ confirm: 'Passwords do not match.' }); return; }
    setPwBusy(true);
    setPwErrors({});
    const res = await api.put('/api/admin/account/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
    setPwBusy(false);
    if (!res.ok) { setPwErrors(res.details ?? { _: res.error }); return; }
    setPw({ currentPassword: '', newPassword: '', confirm: '' });
    toast('success', 'Password changed. Other sessions for your account were signed out.');
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Business details, your account, and the audit trail." />

      <div className="admin-grid-2">
        <Card title="Business settings">
          <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {errors._ && <Alert kind="error">{errors._}</Alert>}
            {(Object.keys(LABELS) as SettingKey[]).map((key) => (
              <Field key={key} label={LABELS[key].label} htmlFor={`s-${key}`} error={errors[key]} hint={LABELS[key].hint}>
                <input id={`s-${key}`} className={`form-input ${errors[key] ? 'invalid' : ''}`} value={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} disabled={!canWrite} />
              </Field>
            ))}
            {canWrite && <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save settings'}</button>}
          </form>
        </Card>

        <Card title="Your account">
          <div style={{ marginBottom: 18, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Signed in as <strong style={{ color: 'var(--brand-deep)' }}>{user.name}</strong> ({user.email}) · role <strong style={{ color: 'var(--brand-deep)', textTransform: 'capitalize' }}>{user.role}</strong>
          </div>
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pwErrors._ && <Alert kind="error">{pwErrors._}</Alert>}
            <Field label="Current password" htmlFor="pw-current" error={pwErrors.currentPassword}><input id="pw-current" type="password" autoComplete="current-password" required className={`form-input ${pwErrors.currentPassword ? 'invalid' : ''}`} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
            <Field label="New password" htmlFor="pw-new" error={pwErrors.newPassword} hint="At least 10 characters with upper, lower case and a number."><input id="pw-new" type="password" autoComplete="new-password" required className={`form-input ${pwErrors.newPassword ? 'invalid' : ''}`} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
            <Field label="Confirm new password" htmlFor="pw-confirm" error={pwErrors.confirm}><input id="pw-confirm" type="password" autoComplete="new-password" required className={`form-input ${pwErrors.confirm ? 'invalid' : ''}`} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <button type="submit" className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-start' }} disabled={pwBusy}><KeyRound size={14} /> {pwBusy ? 'Updating…' : 'Change password'}</button>
          </form>
        </Card>
      </div>

      {audit.length > 0 && (
        <Card title="Recent activity" padded={false}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatDate(a.createdAt, true)}</td>
                    <td>{a.userName ?? <span style={{ color: 'var(--text-muted)' }}>System / public</span>}</td>
                    <td><code style={{ fontSize: 12.5, background: 'var(--surface-raised)', padding: '2px 7px', borderRadius: 4 }}>{a.action}</code></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.entity}{a.entityId && <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}> · {a.entityId.slice(0, 8)}</span>}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(a.details)}>
                      {Object.keys(a.details).length ? JSON.stringify(a.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {audit.length === 0 && (
        <div className="admin-card"><EmptyState title="No activity recorded yet" body="Sign-ins and changes made in the portal will be listed here." /></div>
      )}
    </>
  );
}
